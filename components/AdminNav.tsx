"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const NAV_LINKS = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/customize", label: "NOFA Customize™" },
  { href: "/admin/leads", label: "Leads" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    document.cookie = "admin_auth=; max-age=0; path=/";
    router.push("/admin/login");
  }

  return (
    <div className="border-b border-white/[0.06] bg-[#0d1117] px-4 sm:px-6 lg:px-8 mb-8">
      <div className="mx-auto max-w-7xl flex items-center justify-between h-12">
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
