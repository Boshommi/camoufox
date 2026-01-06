import { defineConfig } from "prisma/config";
import { listLocalDatabases } from "@prisma/adapter-d1";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: `file:${listLocalDatabases()[0]!}`,
  },
});
