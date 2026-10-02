// `npm run db:seed`: node --env-file-if-exists=.env.local --import tsx src/db/seed/index.ts
// (nodejs.org/api/cli.html, --env-file-if-exists; tsx.is/node-enhancement for --import tsx).
// A migrated database is expected: run `npm run db:migrate` first (docs/setup.md).
import { seedSample } from "./sample-seed";

seedSample()
  .then((r) => {
    console.log(r.status === "created"
      ? `Seeded the Marlow Group sample into workspace ${r.workspaceId}.`
      : `The sample already exists in workspace Marlow Group (${r.workspaceId}). Nothing changed.`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("The seed did not finish; nothing of it was kept. " + (error instanceof Error ? error.message : String(error)));
    console.error("Check that the database is migrated (npm run db:migrate) and reachable at DATABASE_URL, then run it again.");
    process.exit(1);
  });
