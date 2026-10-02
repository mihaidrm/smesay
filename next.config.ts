import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The logo upload (stories/E2-5) sends up to 1 MB in a multipart body; the default cap on a
  // server action's body is 1 MB, so an over-size file would hit Next's 413 before the app's own
  // message (node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/
  // serverActions.md, bodySizeLimit). The app checks the size itself (src/lib/logo.ts).
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default nextConfig;
