import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { env } from "~/env";

export const metadata: Metadata = {
  metadataBase: env.NEXT_PUBLIC_BASE_URL,
  title: {
    default: "Canvas Fingerprint Manager",
    template: "%s | Canvas Manager",
  },
  description: "Capture, render, and manage canvas fingerprints for Camoufox browser spoofing.",
  keywords: [
    "canvas",
    "fingerprint",
    "camoufox",
    "browser",
    "spoofing",
  ],
  icons: [{ rel: "icon", url: "/favicon.png" }],
  robots: {
    index: false,
    follow: false,
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
