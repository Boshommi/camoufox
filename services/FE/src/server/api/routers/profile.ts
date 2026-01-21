import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { DETECTOR_VERSION } from "~/lib/fingerprint-collector";
import {
  generateProfileName,
  getProfileInfo,
  isValidProfileName,
  sanitizeProfileName,
} from "~/lib/profile-utils";
import {
  type DeviceType,
  DEVICE_TYPE_LABELS,
  getAvailableDeviceTypes,
  getDeviceProfile,
  isValidDeviceType,
  mergeWithDeviceProfile,
} from "~/lib/device-profiles";

const fingerprintConfigSchema = z.record(z.string(), z.unknown());

const canvasFingerprintSchema = z.object({
  hash: z.string(),
  width: z.number(),
  height: z.number(),
  method: z.string(),
  dataURL: z.string(),
});

const deviceTypeSchema = z.enum(["ios-safari", "macos-safari", "android-chrome"]);

export const profileRouter = createTRPCRouter({
  // List available device profiles
  listDeviceTypes: publicProcedure.query(() => {
    const deviceTypes = getAvailableDeviceTypes();
    return deviceTypes.map((type) => ({
      id: type,
      label: DEVICE_TYPE_LABELS[type],
    }));
  }),

  // Get a device profile by type
  getDeviceProfile: publicProcedure
    .input(z.object({ deviceType: deviceTypeSchema }))
    .query(({ input }) => {
      return {
        deviceType: input.deviceType,
        label: DEVICE_TYPE_LABELS[input.deviceType],
        config: getDeviceProfile(input.deviceType),
      };
    }),

  // Save or update a profile with fingerprint and canvas data
  save: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        fingerprintConfig: fingerprintConfigSchema,
        canvasFingerprints: z.array(canvasFingerprintSchema).optional(),
        deviceType: deviceTypeSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Apply device profile if specified
      let config = input.fingerprintConfig as Record<string, unknown>;
      if (input.deviceType && isValidDeviceType(input.deviceType)) {
        config = mergeWithDeviceProfile(config, input.deviceType);
      }
      const profileInfo = getProfileInfo(config);

      // Determine profile name
      let profileName = input.name;
      if (!profileName) {
        profileName = generateProfileName(config);
      } else if (!isValidProfileName(profileName)) {
        profileName = sanitizeProfileName(profileName);
      }

      // Upsert the profile
      const profile = await ctx.db.profile.upsert({
        where: { name: profileName },
        update: {
          browser: profileInfo.browser,
          screenWidth: profileInfo.screenWidth,
          screenHeight: profileInfo.screenHeight,
          hashSuffix: profileInfo.hashSuffix,
          fingerprintConfig: config as Prisma.InputJsonValue,
          userAgent: profileInfo.userAgent,
          detectorVersion: DETECTOR_VERSION,
        },
        create: {
          name: profileName,
          browser: profileInfo.browser,
          screenWidth: profileInfo.screenWidth,
          screenHeight: profileInfo.screenHeight,
          hashSuffix: profileInfo.hashSuffix,
          fingerprintConfig: config as Prisma.InputJsonValue,
          userAgent: profileInfo.userAgent,
          detectorVersion: DETECTOR_VERSION,
        },
      });

      // Handle canvas fingerprints
      if (input.canvasFingerprints && input.canvasFingerprints.length > 0) {
        // Delete existing canvas fingerprints for this profile
        await ctx.db.profileCanvasFingerprint.deleteMany({
          where: { profileId: profile.id },
        });

        // Create new canvas fingerprints
        await ctx.db.profileCanvasFingerprint.createMany({
          data: input.canvasFingerprints.map((cf) => ({
            profileId: profile.id,
            hash: cf.hash,
            width: cf.width,
            height: cf.height,
            method: cf.method,
            dataURL: cf.dataURL,
          })),
        });
      }

      return profile;
    }),

  // List all profiles with summary info
  list: publicProcedure.query(async ({ ctx }) => {
    const profiles = await ctx.db.profile.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { canvasFingerprints: true },
        },
      },
    });

    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      browser: profile.browser,
      screenWidth: profile.screenWidth,
      screenHeight: profile.screenHeight,
      detectorVersion: profile.detectorVersion,
      currentDetectorVersion: DETECTOR_VERSION,
      isOutdated: profile.detectorVersion < DETECTOR_VERSION,
      canvasCount: profile._count.canvasFingerprints,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));
  }),

  // Get a single profile with full config
  get: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.profile.findUnique({
        where: { name: input.name },
        include: {
          canvasFingerprints: true,
        },
      });

      if (!profile) {
        throw new Error(`Profile "${input.name}" not found`);
      }

      return {
        ...profile,
        currentDetectorVersion: DETECTOR_VERSION,
        isOutdated: profile.detectorVersion < DETECTOR_VERSION,
      };
    }),

  // Get Python-ready config including canvas fingerprints
  // Optionally apply a device profile to override browser-specific properties
  getConfig: publicProcedure
    .input(
      z.object({
        name: z.string(),
        deviceType: deviceTypeSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.profile.findUnique({
        where: { name: input.name },
        include: {
          canvasFingerprints: true,
        },
      });

      if (!profile) {
        throw new Error(`Profile "${input.name}" not found`);
      }

      // Build config object from stored fingerprint
      let config = profile.fingerprintConfig as Record<string, unknown>;

      // Apply device profile if specified
      if (input.deviceType && isValidDeviceType(input.deviceType)) {
        config = mergeWithDeviceProfile(config, input.deviceType);
      }

      // Add canvas fingerprints if available
      if (profile.canvasFingerprints.length > 0) {
        const canvasConfig: Record<string, string> = {};
        for (const cf of profile.canvasFingerprints) {
          canvasConfig[cf.hash] = cf.dataURL;
        }
        config["canvas:fingerprints"] = canvasConfig;
      }

      return {
        name: profile.name,
        deviceType: input.deviceType ?? null,
        detectorVersion: profile.detectorVersion,
        currentDetectorVersion: DETECTOR_VERSION,
        isOutdated: profile.detectorVersion < DETECTOR_VERSION,
        config,
      };
    }),

  // Delete a profile
  delete: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.profile.delete({
        where: { name: input.name },
      });
    }),

  // Delete all profiles
  deleteAll: publicProcedure.mutation(async ({ ctx }) => {
    return ctx.db.profile.deleteMany();
  }),
});
