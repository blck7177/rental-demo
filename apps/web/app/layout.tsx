import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NYC Rental Intelligence Demo",
  description: "AI-powered NYC rental workflow: search, analyze, compare, decide",
};

const navLinks = [
  { href: "/", label: "Intake" },
  { href: "/runs", label: "Run Studio" },
  { href: "/listings", label: "Listings" },
  { href: "/query", label: "NL Query" },
  { href: "/compare", label: "Compare" },
  { href: "/notify", label: "Push" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-slate-900 text-white px-6 py-3 flex items-center gap-8 shadow-md">
          <Link href="/" className="font-bold text-lg tracking-tight text-emerald-400">
            🏙️ NYC Rental Intel
          </Link>
          <div className="flex gap-5 text-sm">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-slate-300 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">
              Demo Mode
            </span>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer className="bg-slate-900 text-slate-500 text-center py-4 text-xs mt-16">
          NYC Rental Intelligence Demo — AI workflow from natural language to personalized recommendations
        </footer>
      </body>
    </html>
  );
}
