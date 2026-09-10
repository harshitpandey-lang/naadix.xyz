import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NaadiX Founder HQ", template: "%s | NaadiX Founder HQ" },
  description: "Private founder operating system for NaadiX.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={GeistSans.variable}><body>{children}</body></html>;
}
