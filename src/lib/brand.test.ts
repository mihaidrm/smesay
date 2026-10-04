// The brand save (stories/E2-5, acceptance 1, 2 and 4) on the test database with the memory
// store: an owner's save writes name, accent and the logo object; a member's save is 403; each
// field is validated on the server; a light accent is kept but falls back on the respondent
// side; removing the logo deletes the object.
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { members, workspaces } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import { auth } from "@/lib/auth";
import { accentContrast, BRAND_COPY, DEFAULT_ACCENT, effectiveAccent, FALLBACK_ACCENT, isReadableAccent, saveBrand } from "@/lib/brand";
import { ForbiddenError } from "@/lib/errors";
import { LOGO_COPY } from "@/lib/logo";
import { ONE_PIXEL_PNG } from "@/lib/logo-fixture";
import { memoryOutbox } from "@/lib/mail";
import { getObject } from "@/lib/storage";
import { requireWorkspace } from "@/lib/workspace";
import { WORKSPACE_NAME_ERROR } from "@/lib/workspace-name";
import type { WorkspaceId } from "@/db/types";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const stamp = Date.now();
let owner: { id: string; headers: Headers }, member: { id: string };
let ws: WorkspaceId;

async function signIn(email: string) {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

beforeAll(async () => {
  await prepareTestDatabase();
  owner = await signIn(`brand-owner-${stamp}@example.com`);
  member = await signIn(`brand-member-${stamp}@example.com`);
  const created = await workspaces.create({ name: "Brand", slug: `brand-${stamp}` }, owner.id);
  ws = await requireWorkspace(owner.headers, created.id);
  await members.add(ws, member.id, "member");
}, 60_000);

const base = { name: "Marlow Group", accentHex: "#1F4F7A", logo: null, removeLogo: false };

describe("accent", () => {
  it("measures contrast on white, uses violet when none is set and falls back to ink under 4.5:1", () => {
    expect(accentContrast("#1F4F7A")!.toFixed(2)).toBe("8.54");
    expect(isReadableAccent("#1F4F7A")).toBe(true);
    expect(isReadableAccent("#FFD500")).toBe(false);
    expect(effectiveAccent("#FFD500")).toBe(FALLBACK_ACCENT);
    expect(FALLBACK_ACCENT).toBe("#15131F");
    expect(effectiveAccent("#1f4f7a")).toBe("#1F4F7A");
    expect(effectiveAccent(null)).toBe(DEFAULT_ACCENT);
    expect(effectiveAccent("")).toBe(DEFAULT_ACCENT);
    expect(accentContrast("not a colour")).toBeNull();
  });
});

describe("saveBrand", () => {
  it("as an owner saves the name, the accent and the logo object", async () => {
    expect(await saveBrand({ ws, userId: owner.id }, { ...base, logo: { bytes: ONE_PIXEL_PNG } })).toEqual({ ok: true, tooLight: false });
    const brand = (await workspaces.publicBrand(ws))!;
    expect(brand).toMatchObject({ name: "Marlow Group", accentHex: "#1F4F7A" });
    expect(brand.logoObjectKey).toMatch(new RegExp(`^logos/${ws}/[0-9a-f]{16}\\.png$`));
    expect((await getObject(brand.logoObjectKey!))?.contentType).toBe("image/png");
  });

  it("replaces the logo and removes the old object, and removes the logo on request", async () => {
    const before = (await workspaces.publicBrand(ws))!.logoObjectKey!;
    await saveBrand({ ws, userId: owner.id }, { ...base, logo: { bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>') } });
    const after = (await workspaces.publicBrand(ws))!.logoObjectKey!;
    expect(after).toMatch(/\.svg$/);
    expect(await getObject(before)).toBeNull();
    expect((await getObject(after))?.contentType).toBe("image/svg+xml");
    await saveBrand({ ws, userId: owner.id }, { ...base, removeLogo: true });
    expect((await workspaces.publicBrand(ws))!.logoObjectKey).toBeNull();
    expect(await getObject(after)).toBeNull();
  });

  it("validates every field on the server", async () => {
    expect(await saveBrand({ ws, userId: owner.id }, { ...base, name: " " })).toEqual({ ok: false, error: WORKSPACE_NAME_ERROR, field: "name" });
    expect(await saveBrand({ ws, userId: owner.id }, { ...base, accentHex: "blue" })).toEqual({ ok: false, error: BRAND_COPY.badHex, field: "accentHex" });
    expect(await saveBrand({ ws, userId: owner.id }, { ...base, logo: { bytes: new TextEncoder().encode("GIF89a") } })).toEqual({ ok: false, error: LOGO_COPY.notImage, field: "logo" });
    expect((await workspaces.publicBrand(ws))!.name).toBe("Marlow Group");
  });

  it("keeps a light accent and says so", async () => {
    expect(await saveBrand({ ws, userId: owner.id }, { ...base, accentHex: "#ffd500" })).toEqual({ ok: true, tooLight: true });
    expect((await workspaces.publicBrand(ws))!.accentHex).toBe("#FFD500");
    expect(await saveBrand({ ws, userId: owner.id }, { ...base, accentHex: "" })).toEqual({ ok: true, tooLight: false });
    expect((await workspaces.publicBrand(ws))!.accentHex).toBeNull();
  });

  it("as a member is 403 and changes nothing; an outsider is 404", async () => {
    await expect(saveBrand({ ws, userId: member.id }, { ...base, name: "Hijacked" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(saveBrand({ ws, userId: `user-${randomUUID()}` }, base)).rejects.toMatchObject({ status: 404 });
    expect((await workspaces.publicBrand(ws))!.name).toBe("Marlow Group");
  });

  it("publicBrand answers null for an unknown or malformed id", async () => {
    expect(await workspaces.publicBrand("not-a-uuid")).toBeNull();
    expect(await workspaces.publicBrand(randomUUID())).toBeNull();
  });
});

// stories/E7-7, acceptance 4: on dark the accent is lifted two steps (OKLCH lightness 0.72,
// the hue kept) and drawn with the dark ink; violet 600 and ink take violet 400. A lift that
// still fails would take violet 400 too; a sweep of every sRGB colour that passes 4.5:1 on
// white found none (the second E7-7 audit), so that branch is a guard no input reaches.
describe("the accent on dark", () => {
  it("lifts a readable accent; SMEsay's own colours take violet 400", async () => {
    const { darkAccent, liftAccent, DARK_FALLBACK_ACCENT, DARK_SURFACE, ON_DARK_ACCENT, accentVars } = await import("@/lib/brand-rules");
    const { contrastRatio } = await import("@/lib/contrast");
    // Grey stays grey; design note 33's example comes out near its #6FA8E6.
    expect(liftAccent("#808080")).toBe("#A4A4A4");
    expect(liftAccent("#1F4F7A")).toBe("#78A9DA");
    // Violet 600 and ink are SMEsay's: violet 400, as the design system names it.
    expect([darkAccent("#6D4CF5"), darkAccent("#15131F")]).toEqual([DARK_FALLBACK_ACCENT, DARK_FALLBACK_ACCENT]);
    expect(contrastRatio(DARK_FALLBACK_ACCENT, DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DARK_FALLBACK_ACCENT, ON_DARK_ACCENT)).toBeGreaterThanOrEqual(4.5);
    // A PM's colour keeps its hue, and reads on the dark surface and under the dark ink.
    for (const hex of ["#1F4F7A", "#B00020", "#0B6E4F", "#7A4E00", "#0000FF"]) {
      expect(darkAccent(hex)).toBe(liftAccent(hex));
      expect(contrastRatio(darkAccent(hex), DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(darkAccent(hex), ON_DARK_ACCENT)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(darkAccent("#1F4F7A"), DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
    expect(accentVars("#1F4F7A")).toEqual({ "--brand-accent": "#1F4F7A", "--brand-accent-dark": darkAccent("#1F4F7A") });
  });
});

// stories/E7-7, acceptance 5: "Powered by SMEsay" on the Free plan only.
describe("Powered by SMEsay by plan", () => {
  it("shows on the Free plan and not on a paid one", async () => {
    const { showsPoweredBy } = await import("@/lib/brand-rules");
    expect(showsPoweredBy("free")).toBe(true);
    expect([showsPoweredBy("pro"), showsPoweredBy("team"), showsPoweredBy("enterprise")]).toEqual([false, false, false]);
  });
});
