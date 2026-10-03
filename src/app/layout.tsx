import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans for everything but numbers (design note 33), self-hosted at build time by
// next/font/google (node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md,
// "variable"); Geist Mono stays for references, counts and timestamps.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
// flash of the other mode; the html element may then differ from the server's markup, which
// suppressHydrationWarning allows for that one element
// (react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors).
const MODE_SCRIPT = `(function(){try{var s=localStorage.getItem("smesay-mode");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
