import { $ } from "bun";
import { getDbName } from "./get-db-name";

async function main() {
  const isRemote = process.argv.includes("--remote");
  const dbName = getDbName();
  const target = isRemote ? "remote" : "local";

  console.log(`Applying migrations to ${target} database: ${dbName}`);

  if (isRemote) {
    await $`bun wrangler d1 migrations apply ${dbName} --remote`;
  } else {
    await $`bun wrangler d1 migrations apply ${dbName} --local`;
  }

  console.log("Migrations applied successfully");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
