import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NYC Rental Intelligence",
  description: "AI-powered NYC rental advisory workspace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-0 flex items-center gap-4 h-12">
          <Link href="/workspace" className="font-semibold text-sm text-gray-900 flex-shrink-0">
            NYC Rental Intel
          </Link>
          <span className="text-gray-200 text-sm">|</span>
          <Link
            href="/workspace"
            className="text-sm text-blue-600 font-medium px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Workspace
          </Link>
          {/* Dev pages — collapsed by default, available via direct URL */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-gray-400 text-xs hidden sm:block">NYC Rental Intel</span>
            <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full border border-gray-200 font-medium">
              Demo
            </span>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
