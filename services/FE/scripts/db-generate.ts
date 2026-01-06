import { $ } from "bun";
import { getDbName } from "./get-db-name";

async function main() {
  let migrationName = process.argv[2];

  if (!migrationName) {
    migrationName = prompt("Enter migration name:") ?? undefined;
    if (!migrationName) {
      console.error("Migration name is required");
      process.exit(1);
    }
  }

  const dbName = getDbName();
  console.log(`Using database: ${dbName}`);
  console.log(`Creating migration: ${migrationName}`);

  // Create empty migration file with wrangler
  const createResult =
    await $`bun wrangler d1 migrations create ${dbName} ${migrationName}`.text();
  console.log(createResult);

  // Parse output to get migration file path
  // Output format: "Successfully created Migration '0003_migration_name'!"
  const match = createResult.match(/Successfully created Migration '(\d+_\w+)'/);
  if (!match) {
    console.error("Failed to parse migration name from wrangler output");
    process.exit(1);
  }

  const migrationFileName = `${match[1]}.sql`;
  const migrationFilePath = `migrations/${migrationFileName}`;
  console.log(`Migration file: ${migrationFilePath}`);

  // Generate migration SQL with prisma migrate diff
  console.log("Generating migration SQL with Prisma...");
  await $`bun prisma migrate diff --from-local-d1 --to-schema-datamodel ./prisma/schema.prisma --script --output ${migrationFilePath}`;

  console.log(`Migration generated successfully: ${migrationFilePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
