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
    default: "VerhuisWidget — automatische offertes voor verhuisbedrijven",
    template: "%s · VerhuisWidget",
  },
  description:
    "White-label verhuis- en ontruimingswidget met AI-foto-analyse. Plaats 'm op je eigen website en ontvang complete offerteaanvragen.",
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
