// ESLint flat config as the Next 16 docs show it (nextjs.org/docs/app/api-reference/config/eslint),
// plus the typescript rule set from the same page and the prototype scripts ignored.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "docs/design-notes/prototype-01/**",
  ]),
]);

export default eslintConfig;
