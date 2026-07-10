import Link from "next/link";
import { Search, Factory, Cpu, Briefcase, ArrowRight, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-white dark:bg-gray-950 px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.emerald.100),theme(colors.white))] dark:bg-[radial-gradient(45rem_50rem_at_top,theme(colors.emerald.950),theme(colors.gray.950))] opacity-20"></div>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl font-mono">
            Welcome to <span className="text-emerald-500">NOFA AI Factory™</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Explore AI products, working prototypes, and intelligent assistants built to solve real business problems.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <div className="relative w-full max-w-xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search 200+ AI concepts..." 
                className="w-full rounded-full border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center">
            <a href="https://usejudy.com" target="_blank" rel="noopener noreferrer" className="rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 flex items-center gap-2 transition-all">
              Talk to Judy <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 text-center lg:grid-cols-3">
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide font-mono">AI Concepts</dt>
              <dd className="text-4xl font-bold tracking-tight font-mono text-emerald-500">200+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide font-mono">Interactive Prototypes</dt>
              <dd className="text-4xl font-bold tracking-tight font-mono text-emerald-500">40+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide font-mono">Growth Rate</dt>
              <dd className="text-4xl font-bold tracking-tight font-mono text-emerald-500">Weekly</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Browse by Industry / Problem */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore the Factory Floor</h2>
            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-400">
              Browse our production lines by industry, business challenge, or AI technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/industries" className="group relative flex flex-col items-center justify-center p-8 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/10 bg-white dark:bg-gray-900">
              <Briefcase className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">By Industry</h3>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm">Healthcare, Retail, Logistics, and more.</p>
              <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link href="/business-problems" className="group relative flex flex-col items-center justify-center p-8 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/10 bg-white dark:bg-gray-900">
              <Cpu className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">By Business Problem</h3>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm">Lead Gen, Support, Automation, and more.</p>
              <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link href="/ai-categories" className="group relative flex flex-col items-center justify-center p-8 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/10 bg-white dark:bg-gray-900">
              <Factory className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">By AI Category</h3>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm">Agents, SaaS, Voice AI, Vision, and more.</p>
              <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
