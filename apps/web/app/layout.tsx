import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NYC Rental Intelligence Demo",
  description: "AI-powered NYC rental workflow",
};

const navLinks: { href: string; label: string; highlight?: boolean }[] = [
  { href: "/workspace", label: "Workspace", highlight: true },
  { href: "/", label: "Intake" },
  { href: "/runs", label: "Run Studio" },
  { href: "/listings", label: "Listings" },
  { href: "/query", label: "NL Query" },
  { href: "/recommendations", label: "Top 3" },
  { href: "/compare", label: "Compare" },
  { href: "/notify", label: "Push" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-6 py-0 flex items-center gap-6 h-14">
          <Link href="/" className="font-bold text-base tracking-tight text-emerald-400 flex-shrink-0 flex items-center gap-2">
            <span className="text-lg">🏙️</span>
            <span>NYC Rental Intel</span>
          </Link>
          <div className="flex gap-1 text-sm overflow-x-auto">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition-colors whitespace-nowrap px-3 py-1.5 rounded-lg text-sm ${
                  l.highlight
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold hover:bg-emerald-500/25"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex-shrink-0 flex items-center gap-3">
            <span className="text-slate-500 text-xs hidden sm:block">NYC Rental Intel</span>
            <span className="bg-slate-700/80 text-slate-400 text-xs px-2.5 py-1 rounded-full border border-white/10 font-medium hidden sm:inline">
              Agent Mode
            </span>
            <span className="bg-emerald-500/15 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/25 font-medium">
              Demo
            </span>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-white/5 text-slate-600 text-center py-5 text-xs mt-16">
          NYC Rental Intelligence Demo · AI-powered workflow
        </footer>
      </body>
    </html>
  );
}
