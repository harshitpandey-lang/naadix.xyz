import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "NaadiX Founder HQ", template: "%s | NaadiX Founder HQ" },
  description: "Private founder operating system for NaadiX.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={geist.variable}><body>{children}</body></html>;
}
