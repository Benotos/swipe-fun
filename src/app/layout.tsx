import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SWIPE.FUN | Spend your SOL on real things",
  description: "A simpler way to turn SOL into real world digital goods. No wallet connection. No unnecessary steps.",
  openGraph: {
    title: "SWIPE.FUN | Your SOL. Real world.",
    description: "Turn SOL into the things you actually want.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SWIPE.FUN | Your SOL. Real world.",
    description: "Turn SOL into the things you actually want."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
