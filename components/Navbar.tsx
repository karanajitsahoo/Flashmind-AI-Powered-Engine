'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { serif } from '@/lib/fonts'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1C3D2E] border-b border-[#F2E8D5]/20">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex flex-col leading-none">
          <h1 className="text-[#F2E8D5] text-xl font-serif tracking-wide">
            FlashMind
          </h1>
          <span className="text-[10px] tracking-[0.2em] font-sans uppercase text-[#C9A96E] mt-[2px]">
            AI Learning Engine
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex gap-6">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs uppercase font-sans tracking-[0.1em] transition ${pathname === link.href
                  ? 'text-[#F2E8D5]'
                  : 'text-[#F2E8D5]/70 hover:text-[#F2E8D5]'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link href="/upload">
          <button className="bg-[#C9A96E] text-[#1C3D2E] text-xs uppercase ${serif.className} tracking-[0.em] px-6 py-2 rounded-sm font-sans hover:bg-[#D4B98A] transition">
            Start Learning
          </button>
        </Link>

      </div>
    </nav>
  )
}