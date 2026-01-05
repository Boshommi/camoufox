import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

// Create a new client per request (required for Cloudflare Workers)
export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const adapter = new PrismaD1(env.db);
  return new PrismaClient({ adapter });
});

// For static routes (ISR/SSG)
export const getDbAsync = async () => {
  const { env } = await getCloudflareContext({ async: true });
  const adapter = new PrismaD1(env.db);
  return new PrismaClient({ adapter });
};
