// ESLint flat config as the Next 16 docs show it (nextjs.org/docs/app/api-reference/config/eslint),
// plus the typescript rule set from the same page and the prototype scripts ignored.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Data access goes through src/db/queries/ (stories/E1-3): outside src/db/, nothing imports
  // the database client, the schema or the ORM. src/lib/auth.ts is the one exception, it hands
  // the client to better-auth's adapter. Rule options (patterns, group, message):
  // eslint.org/docs/latest/rules/no-restricted-imports.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/db/**", "src/lib/auth.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          // "@/db", "@/db/schema", "@/db/auth-schema" and their relative forms; "@/db/queries/*"
          // and "@/db/types" stay allowed. A gitignore-style group would match the whole folder,
          // so this one is a regex.
          { regex: "^(@|\\.\\.|\\.\\./\\.\\.)/db(/(index|schema|auth-schema))?$", message: "Data access goes through src/db/queries/ (stories/E1-3). Import the helper, not the database." },
          { group: ["drizzle-orm", "postgres"], message: "Queries are written in src/db/queries/ only (stories/E1-3)." },
        ],
      }],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "docs/design-notes/prototype-01/**",
  ]),
]);

export default eslintConfig;
