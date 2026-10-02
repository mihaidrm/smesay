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
const FOR_USER = "requireWorkspaceForUser takes a user id the caller already trusts; a route calls requireWorkspace(headers, workspaceId) (stories/E1-3).";
const WORKSPACE_MODULE = path.join(SRC, "lib", "workspace");

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
  if (name === "types" || name === "queries") return null;
  if (name.startsWith("queries/") && name !== "queries/scoped") return null;
  return "the database";
}

function sources(context, onSource) {
  const file = context.filename ?? context.getFilename();
  const check = (node, value) => {
    if (typeof value !== "string") return;
    const what = forbiddenTarget(value, file);
    if (what) context.report({ node, messageId: "forbidden", data: { what } });
  };
  const checkForUser = (n) => {
    if (typeof n.source?.value !== "string") return;
    const abs = resolve(n.source.value, file);
    if (!abs || abs.replace(/\.(m|c)?ts$/, "") !== WORKSPACE_MODULE) return;
    for (const s of n.specifiers ?? []) {
      const name = s.imported?.name ?? s.imported?.value;
      if (name === "requireWorkspaceForUser") context.report({ node: s, messageId: "forUser" });
    }
  };
  return {
    ImportDeclaration: (n) => { check(n.source, n.source.value); checkForUser(n); },
    ExportNamedDeclaration: (n) => n.source && check(n.source, n.source.value),
    ExportAllDeclaration: (n) => check(n.source, n.source.value),
    ImportExpression: (n) => n.source.type === "Literal" && check(n.source, n.source.value),
    CallExpression: (n) => {
      if (n.callee.type === "Identifier" && n.callee.name === "require" && n.arguments[0]?.type === "Literal") check(n.arguments[0], n.arguments[0].value);
    },
    ...onSource,
  };
}

export const dbAccess = {
  meta: { type: "problem", docs: { description: "data access only through src/db/queries/" }, messages: { forbidden: MESSAGE, forUser: FOR_USER }, schema: [] },
  create: (context) => sources(context, {}),
};

// Inside src/db/queries/, nothing hands the client out again: no `export { db }`, no
// `export * from "@/db"`.
export const noDbReexport = {
  meta: { type: "problem", docs: { description: "src/db/queries/ never re-exports the database client" }, messages: { reexport: "src/db/queries/ never exports the database client (stories/E1-3)." }, schema: [] },
  create: (context) => {
    const file = context.filename ?? context.getFilename();
    return {
      ExportAllDeclaration: (n) => { if (typeof n.source.value === "string" && forbiddenTarget(n.source.value, file)) context.report({ node: n, messageId: "reexport" }); },
      ExportNamedDeclaration: (n) => {
        for (const s of n.specifiers ?? []) { if ((s.exported.name ?? s.exported.value) === "db") context.report({ node: s, messageId: "reexport" }); }
        if (n.declaration?.type === "VariableDeclaration") for (const d of n.declaration.declarations) { if (d.id.type === "Identifier" && d.id.name === "db") context.report({ node: d, messageId: "reexport" }); }
      },
    };
  },
};

const plugin = { rules: { "db-access": dbAccess, "no-db-reexport": noDbReexport } };
export default plugin;
