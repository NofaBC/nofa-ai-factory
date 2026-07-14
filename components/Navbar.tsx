"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Catalog" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#06060a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight"
        >
          <span className="text-blue-400">⚙️</span>
          <span>
            NOFA{" "}
            <span className="text-blue-400">AI Factory</span>
            <span className="text-zinc-600">™</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="mailto:supportdesk@nofabusinessconsulting.com"
            className="hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Contact
          </a>
          <Link
            href="/catalog"
            className="ml-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Explore AI →
          </Link>
        </div>
      </div>
    </nav>
  );
}
