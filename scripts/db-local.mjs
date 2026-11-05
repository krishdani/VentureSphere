// Starts a local Postgres (no install needed) via the `embedded-postgres` package.
// Data lives in ./.pgdata (gitignored). Leave this running in its own terminal.
//   npm run db:local        -> postgres://postgres:postgres@localhost:5433/venturesphere
import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const port = Number(process.env.PGPORT_LOCAL || 5433);
const databaseDir = path.resolve(".pgdata");
const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
  onLog: () => {},
});

if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
  console.log("Initialising a new local Postgres cluster in .pgdata …");
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase("venturesphere");
  console.log("Created database 'venturesphere'.");
} catch {
  // already exists
}
console.log(`Local Postgres ready: postgresql://postgres:postgres@localhost:${port}/venturesphere`);
console.log("Press Ctrl+C to stop.");

const shutdown = async () => {
  await pg.stop().catch(() => {});
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
setInterval(() => {}, 1 << 30);
