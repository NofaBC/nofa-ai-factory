"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [ready, setReady] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    // Wait for Firebase Auth to restore its state from localStorage.
    // No write to Firestore or Storage should happen before this resolves.
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Firebase says no authenticated user — redirect to login
        router.replace("/admin/login");
      }
      setReady(true);
    });

    return unsub;
  }, [isLoginPage, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
