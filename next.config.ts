import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The logo upload (stories/E2-5, 1 MB) and the list upload (stories/E3-2, 5 MB) send a
  // multipart body; the default cap on a server action's body is 1 MB, so an over-size file would
  // hit Next's 413 before the app's own message (node_modules/next/dist/docs/01-app/
  // 03-api-reference/05-config/01-next-config-js/serverActions.md, bodySizeLimit). The app
  // checks the sizes itself (src/lib/logo.ts, src/lib/uploads.ts); 6 MB leaves room for the
  // multipart framing around a 5 MB file.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  // The PDF summary reads its fonts from src/lib/export/fonts at run time (stories/E10-3), which
  // output tracing does not see; outputFileTracingIncludes carries them with the export route
  // (node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md).
  outputFileTracingIncludes: { "/api/projects/[projectId]/export/[file]": ["./src/lib/export/fonts/**/*"] },
};

export default nextConfig;
