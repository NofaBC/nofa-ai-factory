export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#06060a] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center gap-4 text-sm text-zinc-600">
        <p className="text-center">
          NOFA AI Factory™ is a division of{" "}
          <a
            href="https://nofabusinessconsulting.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            NOFA Business Consulting, LLC
          </a>
          .
        </p>
        <a
          href="mailto:supportdesk@nofabusinessconsulting.com"
          className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
        >
          supportdesk@nofabusinessconsulting.com
        </a>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span>© {new Date().getFullYear()} NOFA AI Factory™ — All rights reserved.</span>
          <span className="hidden sm:inline text-zinc-800">·</span>
          <span>Built on Firestore · Deployed on Vercel · Powered by Next.js</span>
        </div>
      </div>
    </footer>
  );
}
