import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NOFA AI Factory™ | AI Product Showroom",
  description: "Explore AI products, working prototypes, and intelligent assistants built to solve real business problems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
              <span className="text-xl font-bold tracking-tight font-mono">NOFA<span className="text-emerald-500">FACTORY</span></span>
              <a href="https://usejudy.com" target="_blank" rel="noopener noreferrer" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-all">
                Talk to Judy
              </a>
            </nav>
          </header>
          <main className="flex-grow">{children}</main>
          <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 mt-20">
            <div className="mx-auto max-w-7xl px-6 py-12 text-center">
              <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} NOFA AI Factory™. Not Just One Product. A Production System.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
