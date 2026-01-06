import wranglerConfig from "../wrangler.jsonc";

interface WranglerConfig {
  d1_databases?: Array<{
    binding: string;
    database_name: string;
    database_id: string;
  }>;
}

export function getDbName(): string {
  const config = wranglerConfig as WranglerConfig;
  const dbName = config.d1_databases?.[0]?.database_name;

  if (!dbName) {
    throw new Error("No D1 database found in wrangler.jsonc");
  }

  return dbName;
}
