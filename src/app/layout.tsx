import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans for everything but numbers (design note 33), self-hosted at build time by
// next/font/google (node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md:
// "variable"; a variable font needs no weight list, font.md "If loading a variable font, you
// don't need to specify the font weight"). Geist Mono stays for references, counts and timestamps.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMEsay",
  description: "Send the list as a link. Get back who agrees, and why.",
};

// The mode is applied before the first paint: a stored choice from the sidebar toggle
// (localStorage "smesay-mode", src/components/app/mode-toggle.tsx), else the system setting
// (decision 0041). An inline script in the head runs before the body renders, so there is no
// flash of the other mode (node_modules/next/dist/docs/01-app/02-guides/
// preventing-flash-before-hydration.md, "Themes"); the html element may then differ from the
// server's markup, which suppressHydrationWarning allows for that one element (same guide;
// react.dev/reference/react-dom/client/hydrateRoot). With no stored choice the page also
// follows a system change while open. The script is a fixed string and compares the stored
// value with one word. The content security policy (E11-5, src/proxy.ts) lets it run with the
// request's nonce, read from the x-nonce header the proxy sets (node_modules/next/dist/docs/
// 01-app/02-guides/content-security-policy.md, "Reading the nonce"). Reading a request header
// renders every page per request, which the nonce needs anyway (same guide, "Dynamic Rendering
// Requirement").
const MODE_SCRIPT = `(function(){try{var s=localStorage.getItem("smesay-mode");var m=window.matchMedia("(prefers-color-scheme: dark)");var c=document.documentElement.classList;c.toggle("dark",s?s==="dark":m.matches);if(!s&&m.addEventListener)m.addEventListener("change",function(e){if(!localStorage.getItem("smesay-mode"))c.toggle("dark",e.matches);});}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={(await headers()).get("x-nonce") ?? undefined} dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
