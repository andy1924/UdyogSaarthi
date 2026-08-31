import type { Metadata, Viewport } from "next";
import { Tiro_Devanagari_Hindi, Inter, Fragment_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/design-tokens/tokens.css";
import { tokens } from "@/lib/design-tokens/tokens";

const tiro = Tiro_Devanagari_Hindi({
  subsets: ["latin", "devanagari"],
  weight: ["400"],
  variable: "--font-tiro",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-fragment",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UdyogSaarthi — Sarkaar Ledger",
  description:
    "Hyper-local business feasibility + deterministic scheme math. Paper that kills middlemen.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: tokens.color.ink,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${tiro.variable} ${inter.variable} ${fragmentMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-paper)] text-[var(--color-ink)] font-[var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
