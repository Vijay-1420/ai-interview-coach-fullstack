import { ArrowUpRight, BrainCircuit, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const year = new Date().getFullYear()

const Footer = () => (
  <footer className="mt-20 border-t border-white/10 bg-[#18231d] text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <Link to="/" className="mb-3 inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E8B68]">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span className="font-bold tracking-tight">InterviewAI</span>
        </Link>
        <p className="max-w-md text-sm leading-relaxed text-white/55">
          A calmer, smarter way to prepare. Practice with purpose, learn from every answer, and show up ready.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/65">
        <Link to="/dashboard" className="transition hover:text-white">Dashboard</Link>
        <Link to="/interview/setup" className="transition hover:text-white">Practice</Link>
        <Link to="/history" className="transition hover:text-white">History</Link>
        <Link to="/analytics" className="transition hover:text-white">Analytics</Link>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} InterviewAI. Built for your next big moment.</span>
        <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Practice. Reflect. Improve. <ArrowUpRight className="h-3.5 w-3.5" /></span>
      </div>
    </div>
  </footer>
)

export default Footer
