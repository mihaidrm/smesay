// ESLint flat config as the Next 16 docs show it (nextjs.org/docs/app/api-reference/config/eslint),
// plus the typescript rule set from the same page and the prototype scripts ignored.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import smesay from "./eslint-rules/db-access.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Data access goes through src/db/queries/ (stories/E1-3): outside src/db/, nothing imports
  // the database client, the schema or the ORM, by any path. src/lib/auth.ts is the one
  // exception, it hands the client to better-auth's adapter. The rules are in
  // eslint-rules/db-access.mjs and tested by src/db/queries/lint-rule.test.ts.
  {
    files: ["src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    ignores: ["src/db/**", "src/lib/auth.ts"],
    plugins: { smesay },
    rules: { "smesay/db-access": "error" },
  },
  {
    files: ["src/db/queries/**/*.{ts,tsx}"],
    plugins: { smesay },
    rules: { "smesay/no-db-reexport": "error" },
  },
  // The Anthropic SDK is imported in src/lib/ai/ only (stories/E4-1, acceptance 1): the key
  // and every call stay in one place, out of every client bundle. no-restricted-imports with
  // patterns and a message: eslint.org/docs/latest/rules/no-restricted-imports. Tested by
  // src/lib/ai/lint-rule.test.ts.
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    ignores: ["src/lib/ai/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@anthropic-ai/sdk", "@anthropic-ai/sdk/*"], message: "The Anthropic SDK is used in src/lib/ai/ only (stories/E4-1)." }] }],
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
