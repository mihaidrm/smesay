// Two lint rules that keep data access inside src/db/queries/ (stories/E1-3, acceptance 1).
// Written as a local plugin for ESLint's flat config (eslint.org/docs/latest/extend/custom-rules;
// plugins in config objects: eslint.org/docs/latest/use/configure/plugins). The import path is
// resolved against the importing file, so every spelling ("@/db", "@/db/", "../../../db",
// "./db", "@/db/queries/../index", a dynamic import, a require call) is judged by where it lands.
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const DB = path.join(SRC, "db");
const MESSAGE = "Data access goes through src/db/queries/ (stories/E1-3). Import the table helper, not {{what}}.";
const CAST = "A WorkspaceId comes from requireWorkspace(headers, workspaceId), never from a cast (stories/E1-3).";
const REQUIRE = "Load modules with import; require and createRequire are not used in the app (stories/E1-3).";
// Files that may import what the rule otherwise refuses, by what they may import.
// src/lib/ai/client.ts reads the product's spend across workspaces for the cap of decision
// 0036, and its test sets workspace budgets; both through queries/internal, nowhere else.
const EXCEPTIONS = {
  [path.join(SRC, "lib", "workspace.ts")]: ["queries/internal"],
  [path.join(SRC, "lib", "ai", "client.ts")]: ["queries/internal"],
  [path.join(SRC, "lib", "ai", "client.test.ts")]: ["queries/internal"],
  // E9-3: the actions test sets a workspace budget to see the refusal with its estimate.
  [path.join(SRC, "lib", "insights.test.ts")]: ["queries/internal"],
  // E11-2: the removal job reads every deleted workspace and deletes its rows; its test too.
  [path.join(SRC, "lib", "workspace-removal.ts")]: ["queries/internal"],
  [path.join(SRC, "lib", "workspace-removal.test.ts")]: ["queries/internal"],
};

function resolve(spec, fromFile) {
  if (spec.startsWith("@/")) return path.normalize(path.join(SRC, spec.slice(2)));
  if (spec.startsWith(".")) return path.normalize(path.join(path.dirname(fromFile), spec));
  return null;
}

// Returns what the specifier reaches when it must not be imported, else null.
export function forbiddenTarget(spec, fromFile) {
  if (spec === "postgres" || spec === "drizzle-orm" || spec.startsWith("drizzle-orm/")) return "the ORM";
  const abs = resolve(spec, fromFile);
  if (!abs) return null;
  const rel = path.relative(DB, abs).replace(/\\/g, "/");
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const name = rel.replace(/\.(m|c)?(t|j)sx?$/, "").replace(/\/$/, "").replace(/\/index$/, "").replace(/^index$/, "");
  if ((EXCEPTIONS[fromFile] ?? []).includes(name)) return null;
  // A test anywhere may prepare the test database; it never gets the client from it.
  if (name === "test-db" && /\.test\.(m|c)?tsx?$/.test(fromFile)) return null;
  if (name === "types" || name === "queries") return null;
  if (name.startsWith("queries/") && name !== "queries/scoped" && name !== "queries/internal") return null;
  return "the database";
}

const literalOf = (node) => {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
};
const isWorkspaceIdType = (t) => t && ((t.type === "TSTypeReference" && t.typeName.type === "Identifier" && t.typeName.name === "WorkspaceId") || t.type === "TSNeverKeyword");

function sources(context, onSource) {
  const file = context.filename ?? context.getFilename();
  const check = (node, value) => {
    if (typeof value !== "string") return;
    const what = forbiddenTarget(value, file);
    if (what) context.report({ node, messageId: "forbidden", data: { what } });
  };
  const isTest = /\.test\.(m|c)?tsx?$/.test(file);
  return {
    ImportDeclaration: (n) => {
      check(n.source, n.source.value);
      if ((n.source.value === "node:module" || n.source.value === "module") && n.specifiers.some((s) => (s.imported?.name ?? s.imported?.value) === "createRequire")) context.report({ node: n, messageId: "require" });
    },
    ExportNamedDeclaration: (n) => n.source && check(n.source, n.source.value),
    ExportAllDeclaration: (n) => check(n.source, n.source.value),
    ImportExpression: (n) => check(n.source, literalOf(n.source)),
    CallExpression: (n) => {
      const isRequire = (n.callee.type === "Identifier" && n.callee.name === "require") || (n.callee.type === "MemberExpression" && !n.callee.computed && n.callee.property.name === "require");
      if (isRequire) { check(n.arguments[0], literalOf(n.arguments[0])); if (n.callee.type === "MemberExpression") context.report({ node: n, messageId: "require" }); }
    },
    // `x as WorkspaceId` and `x as never` would hand a helper an id the session did not check.
    TSAsExpression: (n) => { if (!isTest && isWorkspaceIdType(n.typeAnnotation)) context.report({ node: n, messageId: "cast" }); },
    TSTypeAssertion: (n) => { if (!isTest && isWorkspaceIdType(n.typeAnnotation)) context.report({ node: n, messageId: "cast" }); },
    ...onSource,
  };
}

export const dbAccess = {
  meta: { type: "problem", docs: { description: "data access only through src/db/queries/" }, messages: { forbidden: MESSAGE, cast: CAST, require: REQUIRE }, schema: [] },
  create: (context) => sources(context, {}),
};

// Inside src/db/queries/, nothing hands the client out again: no `export { db }` under any
// name, no `export * from "@/db"`, no default export, no `export const x = db`. A function that
// returns the client would get past this; that is what the reviewer's reading of the folder is
// for (stories/E1-3, acceptance 5).
export const noDbReexport = {
  meta: { type: "problem", docs: { description: "src/db/queries/ never re-exports the database client" }, messages: { reexport: "src/db/queries/ never exports the database client (stories/E1-3)." }, schema: [] },
  create: (context) => {
    const file = context.filename ?? context.getFilename();
    return {
      ExportAllDeclaration: (n) => { if (typeof n.source.value === "string" && forbiddenTarget(n.source.value, file)) context.report({ node: n, messageId: "reexport" }); },
      ExportDefaultDeclaration: (n) => context.report({ node: n, messageId: "reexport" }),
      ExportNamedDeclaration: (n) => {
        for (const s of n.specifiers ?? []) { if ((s.exported.name ?? s.exported.value) === "db" || s.local?.name === "db") context.report({ node: s, messageId: "reexport" }); }
        if (n.declaration?.type === "VariableDeclaration") for (const d of n.declaration.declarations) {
          if (d.id.type === "Identifier" && d.id.name === "db") context.report({ node: d, messageId: "reexport" });
          if (d.init?.type === "Identifier" && d.init.name === "db") context.report({ node: d, messageId: "reexport" });
        }
      },
    };
  },
};

// The Anthropic SDK is imported in src/lib/ai/ only (stories/E4-1, acceptance 1), by any
// spelling: import, export from, import(), require. And src/lib/ai/client.ts, the module
// that holds the key, is never imported from a file that starts with "use client": that
// file's imports go into a client bundle. Tested by src/lib/ai/lint-rule.test.ts.
const AI_DIR = path.join(SRC, "lib", "ai");
const SDK = "The Anthropic SDK is used in src/lib/ai/ only (stories/E4-1).";
const CLIENT_FILE = "A client component never imports src/lib/ai/client (stories/E4-1): call it from a server action or a route.";
const isSdk = (spec) => typeof spec === "string" && (spec === "@anthropic-ai/sdk" || spec.startsWith("@anthropic-ai/sdk/"));
const isAiClient = (spec, fromFile) => {
  const abs = typeof spec === "string" ? resolve(spec, fromFile) : null;
  return abs !== null && abs.replace(/\.(m|c)?(t|j)sx?$/, "") === path.join(AI_DIR, "client");
};
export const aiSdk = {
  meta: { type: "problem", docs: { description: "the Anthropic SDK only in src/lib/ai/" }, messages: { sdk: SDK, client: CLIENT_FILE }, schema: [] },
  create: (context) => {
    const file = context.filename ?? context.getFilename();
    const inAi = !path.relative(AI_DIR, file).startsWith("..") && !path.isAbsolute(path.relative(AI_DIR, file));
    const body = context.sourceCode.ast.body;
    const useClient = body.length > 0 && body[0].type === "ExpressionStatement" && body[0].directive === "use client";
    const check = (node, value) => {
      if (isSdk(value) && !inAi) context.report({ node, messageId: "sdk" });
      if (useClient && isAiClient(value, file)) context.report({ node, messageId: "client" });
    };
    return {
      ImportDeclaration: (n) => check(n.source, n.source.value),
      ExportNamedDeclaration: (n) => n.source && check(n.source, n.source.value),
      ExportAllDeclaration: (n) => check(n.source, n.source.value),
      ImportExpression: (n) => check(n.source, literalOf(n.source)),
      CallExpression: (n) => { if (n.callee.type === "Identifier" && n.callee.name === "require") check(n.arguments[0], literalOf(n.arguments[0])); },
    };
  },
};

const plugin = { rules: { "db-access": dbAccess, "no-db-reexport": noDbReexport, "ai-sdk": aiSdk } };
export default plugin;
