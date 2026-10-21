import { useEffect, useState } from 'react'
import { BrainCircuit, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Practice', to: '/interview/setup' },
  { label: 'AI Chats', to: '/chat-interviews' },
  { label: 'History', to: '/history' },
  { label: 'Analytics', to: '/analytics' },
]

const Navbar = () => {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24)
  const [menuOpen, setMenuOpen] = useState(false)
  const isLanding = location.pathname === '/'

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-[#174D3A]' : 'text-[#777B73] hover:text-[#282A27]'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        !isLanding || scrolled
          ? 'border-[#E8E6DF]/80 bg-white/85 shadow-[0_8px_30px_rgba(23,77,58,0.05)] backdrop-blur-xl'
          : 'border-transparent bg-[#FAF8F3]/55 backdrop-blur-md'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-6" aria-label="Main navigation">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="InterviewAI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#174D3A] text-white shadow-[0_8px_20px_rgba(23,77,58,0.2)] transition duration-300 group-hover:-rotate-6 group-hover:scale-105 group-hover:bg-[#2E8B68]">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.04em] text-[#282A27]">
            Interview<span className="text-[#2E8B68]">AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/interview/setup"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#174D3A] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(23,77,58,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#22664c] hover:shadow-[0_12px_25px_rgba(23,77,58,0.22)]"
          >
            Start practicing
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">↗</span>
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E6DF] bg-white/80 text-[#174D3A] md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-[#E8E6DF] bg-white/95 px-5 py-4 shadow-lg backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={`${linkClass} rounded-xl px-3 py-3`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/interview/setup"
              className="mt-2 rounded-xl bg-[#174D3A] px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setMenuOpen(false)}
            >
              Start practicing
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
