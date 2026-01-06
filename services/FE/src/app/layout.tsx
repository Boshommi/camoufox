import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { env } from "~/env";

export const metadata: Metadata = {
  metadataBase: env.NEXT_PUBLIC_BASE_URL,
  title: {
    default: "Camoufox Fingerprint Manager",
    template: "%s | Camoufox",
  },
  description: "Capture, manage, and compare browser fingerprints for Camoufox browser spoofing.",
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

function Navigation() {
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center h-12">
          <span className="text-white font-bold mr-8">Camoufox</span>
          <div className="flex gap-1">
            <a
              href="/"
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Capture
            </a>
            <a
              href="/profiles"
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Profiles
            </a>
            <a
              href="/compare"
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Compare
            </a>
            <a
              href="/detect"
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Detect
            </a>
            <a
              href="/canvas"
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Canvas
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

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
        <TRPCReactProvider>
          <Navigation />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
