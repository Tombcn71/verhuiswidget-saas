import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { nlNL } from "@clerk/localizations";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Move Ai — automatische offertes voor verhuizers en ontruimers",
    template: "%s · Move Ai",
  },
  description:
    "White-label AI-widget voor verhuis- en ontruimingsbedrijven. Klanten uploaden foto's, de AI berekent het volume en de prijs, jij ontvangt een complete offerteaanvraag.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider localization={nlNL}>
      <html lang="nl" className={`${geistSans.variable} h-full antialiased`}>
        <body className="min-h-full bg-white text-slate-900">{children}</body>
      </html>
    </ClerkProvider>
  );
}
