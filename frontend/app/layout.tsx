import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Udyog-Saarthi | Rural Enterprise Advisory",
  description: "A simpler path from a business idea to a bank-ready plan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
