import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Manrope } from "next/font/google";
import { site } from "@/lib/site-config";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--ff-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  keywords: ["PPF kaplama", "boya koruma filmi", "şeffaf koruma filmi", "seramik kaplama", "kendini onaran film", "detailing", site.contact.city],
  openGraph: { title: `${site.name} — ${site.tagline}`, description: site.description, type: "website", locale: "tr_TR" },
};

export const viewport: Viewport = {
  themeColor: site.theme.bg,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const themeVars = {
  "--bg": site.theme.bg,
  "--bg-2": site.theme.bg2,
  "--fg": site.theme.fg,
  "--fg-muted": site.theme.fgMuted,
  "--accent": site.theme.accent,
  "--accent-bright": site.theme.accentBright,
} as CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={sans.variable} style={themeVars}>
      <body>{children}</body>
    </html>
  );
}
