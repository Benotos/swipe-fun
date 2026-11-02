import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SWIPE.FUN | Your SOL. Real World.",
  description: "Spend SOL on real things. No wallet connection. No complications."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
