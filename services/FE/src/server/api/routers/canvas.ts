import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const canvasRouter = createTRPCRouter({
  // Upload a new canvas fingerprint
  upload: publicProcedure
    .input(
      z.object({
        hash: z.string(),
        pixelData: z.string(),
        width: z.number(),
        height: z.number(),
        method: z.string(),
        sourceUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.canvasFingerprint.upsert({
        where: { hash: input.hash },
        update: {
          pixelData: input.pixelData,
          width: input.width,
          height: input.height,
          method: input.method,
          sourceUrl: input.sourceUrl,
        },
        create: {
          hash: input.hash,
          pixelData: input.pixelData,
          width: input.width,
          height: input.height,
          method: input.method,
          sourceUrl: input.sourceUrl,
        },
      });
    }),

  // Upload multiple canvas fingerprints at once
  uploadBatch: publicProcedure
    .input(
      z.array(
        z.object({
          hash: z.string(),
          pixelData: z.string(),
          width: z.number(),
          height: z.number(),
          method: z.string(),
          sourceUrl: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.all(
        input.map((item) =>
          ctx.db.canvasFingerprint.upsert({
            where: { hash: item.hash },
            update: {
              pixelData: item.pixelData,
              width: item.width,
              height: item.height,
              method: item.method,
              sourceUrl: item.sourceUrl,
            },
            create: {
              hash: item.hash,
              pixelData: item.pixelData,
              width: item.width,
              height: item.height,
              method: item.method,
              sourceUrl: item.sourceUrl,
            },
          }),
        ),
      );
      return { count: results.length };
    }),

  // Get all canvas fingerprints with renders
  list: publicProcedure.query(async ({ ctx }) => {
    const fingerprints = await ctx.db.canvasFingerprint.findMany({
      orderBy: { createdAt: "desc" },
    });

    const renders = await ctx.db.canvasRender.findMany({
      orderBy: { createdAt: "desc" },
    });

    const rendersByFp: Record<string, typeof renders> = {};
    for (const r of renders) {
      if (!rendersByFp[r.fingerprintId]) rendersByFp[r.fingerprintId] = [];
      rendersByFp[r.fingerprintId]!.push(r);
    }

    return fingerprints.map((fp) => ({
      ...fp,
      renders: rendersByFp[fp.id] || [],
    }));
  }),

  // Upload a rendered version from a device
  uploadRender: publicProcedure
    .input(
      z.object({
        hash: z.string(),
        deviceInfo: z.string(),
        dataURL: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fingerprint = await ctx.db.canvasFingerprint.findUnique({
        where: { hash: input.hash },
      });

      if (!fingerprint) {
        throw new Error(`Canvas fingerprint with hash ${input.hash} not found`);
      }

      return ctx.db.canvasRender.create({
        data: {
          fingerprintId: fingerprint.id,
          deviceInfo: input.deviceInfo,
          dataURL: input.dataURL,
        },
      });
    }),

  // Delete a single canvas fingerprint by hash
  delete: publicProcedure
    .input(z.object({ hash: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.canvasFingerprint.delete({
        where: { hash: input.hash },
      });
    }),

  // Delete all canvas fingerprints
  deleteAll: publicProcedure.mutation(async ({ ctx }) => {
    return ctx.db.canvasFingerprint.deleteMany();
  }),

  // Get config format for Camoufox (hash -> pixelData mapping)
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const fingerprints = await ctx.db.canvasFingerprint.findMany();
    const renders = await ctx.db.canvasRender.findMany();

    const rendersByFp: Record<string, typeof renders> = {};
    for (const r of renders) {
      if (!rendersByFp[r.fingerprintId]) rendersByFp[r.fingerprintId] = [];
      rendersByFp[r.fingerprintId]!.push(r);
    }

    const config: Record<string, string> = {};
    for (const fp of fingerprints) {
      // Use first render if available, otherwise original
      const fpRenders = rendersByFp[fp.id];
      config[fp.hash] = fpRenders?.[0]?.dataURL ?? fp.pixelData;
    }
    return config;
  }),
});
