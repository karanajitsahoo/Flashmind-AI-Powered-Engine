'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center group-hover:bg-accent transition-colors duration-200">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#f9f7f3"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#f9f7f3" opacity="0.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#f9f7f3" opacity="0.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#f9f7f3"/>
            </svg>
          </div>
          <span className="font-display text-lg text-ink">Flashcard Engine</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                pathname === link.href
                  ? 'bg-ink text-cream'
                  : 'text-ink-500 hover:text-ink hover:bg-ink-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
