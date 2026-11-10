import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { nlNL } from "@clerk/localizations";
// Clerk-onderdelen volgen de shadcn-kleuren, ook in de donkere modus van het dashboard.
import { shadcn } from "@clerk/themes";
import "./globals.css";
import { THEME_SCRIPT } from "@/components/theme";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · moverAI",
  },
  description: SITE_DESCRIPTION,
  // Op het iPhone-startscherm: schermvullend, met de naam moverAI onder het icoon.
  appleWebApp: { capable: true, title: "moverAI", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#1a73e8" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider localization={nlNL} appearance={{ theme: shadcn }}>
      <html lang="nl" suppressHydrationWarning className={`${geistSans.variable} h-full antialiased`}>
        <body className="min-h-full bg-background text-foreground">
          {/* Licht of donker zoals het systeem staat, vóór de eerste weergave (geen flits). */}
          <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />{children}
          {/* Bezoekersstatistieken van Vercel (zonder cookies). */}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
