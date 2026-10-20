/**
 * Admin layout — Server Component.
 *
 * Exports `dynamic = 'force-dynamic'` so Next.js never pre-renders any admin
 * page at build time. This prevents Firebase client SDK initialization errors
 * caused by missing NEXT_PUBLIC_FIREBASE_* environment variables during
 * the production build.
 *
 * At runtime on Vercel, env vars are present and Firebase initializes normally.
 */
export const dynamic = "force-dynamic";

import AdminAuthGuard from "./AdminAuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
