export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#06060a] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
        <span>
          © {new Date().getFullYear()} NOFA AI Factory™ — All rights reserved.
        </span>
        <span>
          Built on Firestore · Deployed on Vercel · Powered by Next.js
        </span>
      </div>
    </footer>
  );
}
