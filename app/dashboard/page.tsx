'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import DeckCard from '@/components/DeckCard'
import { Cormorant_Garamond } from 'next/font/google'


const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})
interface Deck {
  strong: number
  shaky: number
  weak: number
}

interface Deck {
  _id: string
  title: string
  totalCards: number
  dueCount: number
  accuracy: number | null
  lastReviewedAt?: string
  createdAt: string
}

interface ActivityPoint {
  date: string
  questionsSolved: number
  correct: number
}

interface Stats {
  totalDecks: number
  totalCards: number
  totalReviews: number
  accuracy: number
  dueCards: number
  streak: number
  dailyActivity: { date: string; reviews: number; correct: number }[]
  activityStats: {
    daily: ActivityPoint[]
    weekly: ActivityPoint[]
    monthly: ActivityPoint[]
    yearly: ActivityPoint[]
  }
}

export default function DashboardPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [graphView, setGraphView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [deckRes, statsRes] = await Promise.all([
        fetch('/api/decks'),
        fetch('/api/stats'),
      ])
      const deckData = await deckRes.json()
      const statsData = await statsRes.json()
      setDecks(deckData.decks.map((d: any) => ({
        ...d,
        strong: d.strong,
        shaky: d.shaky,
        weak: d.weak
      })))
      setStats(statsData)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this deck and all its cards?')) return
    try {
      await fetch(`/api/decks?id=${id}`, { method: 'DELETE' })
      setDecks(d => d.filter(deck => deck._id !== id))
      toast.success('Deck deleted')
    } catch {
      toast.error('Failed to delete deck')
    }
  }

  const filtered = decks.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  const totalDue = decks.reduce((sum, d) => sum + d.dueCount, 0)

  return (
    <div className="min-h-screen bg-[#f4ede2]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="mb-3">
              {/* Small top text */}
              <p className="text-xs tracking-[0.25em] text-[#1C3D2E]/50 uppercase font-sans mb-1">
                Welcome back
              </p>

              {/* Main heading */}
              <h1 className="text-[#1C3D2E] leading-tight -mt-3">
                <span className="text-4xl font-serif mr-2">Your</span>{' '}
                <span
                  className="text-[#C9A96E]"
                  style={{
                    fontFamily: 'Pinyon Script, cursive',
                    fontSize: '3.2rem'
                  }}
                >
                  library
                </span>
              </h1>
              <div className="w-full h-px bg-[#1C3D2E]/20 my-4 mx-1"></div>
            </div>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-7 py-2.5 bg-[#C9A96E] text-[#1C3D2E]/75 rounded font-sans uppercase tracking-[0.15em] text-xs hover:bg-[#d3ba8b] transition-all duration-200 self-start sm:self-auto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New deck
          </Link>
        </div>

        {/* Stats banner */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 border font-sans border-[#1C3D2E]/20 mb-10">
            {[
              { label: 'Total cards', value: stats.totalCards, accent: false },
              {
                label: 'Due today',
                value: totalDue,
                accent: totalDue > 0,
                sub: totalDue > 0 ? 'cards' : 'all caught up!',
              },
              {
                label: 'Accuracy',
                value: stats.totalReviews > 0 ? `${stats.accuracy} ` : '—',
                accent: false,
              },
              {
                label: 'Day streak',
                value: stats.streak > 0 ? `${stats.streak}days` : '0',
                accent: stats.streak > 0,
              },
            ].map((s, i) => (
              <div key={i} className="p-6 border-r last:border-r-0 border-[#1C3D2E]/10">
                <p className="text-[10px] uppercase tracking-widest text-[#1C3D2E]/40">{s.label}</p>
                <p className={`text-4xl text-[#1C3D2E] mt-3 ${cormorant.className}`}>
                  {s.label === 'Day streak' && typeof s.value === 'string' ? (
                    <>
                      {s.value.replace('days', '')}
                      <span className="text-sm font-sans text-black/30 ml-2">days</span>
                    </>
                  ) : s.label === 'Accuracy' && typeof s.value === 'string' ? (
                    <>
                      {s.value.replace('%', '')}
                      <span className="text-sm font-serif text-black/35">%</span>
                    </>
                  ) : (
                    s.value
                  )}
                </p>
                {s.sub && <p className="text-xs text-ink-400 mt-1">{s.sub}</p>}
              </div>
            ))}
          </div>
        )}


        {/* Deck grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-ink-100 p-6 h-52">
                <div className="shimmer h-4 rounded-lg mb-3 w-2/3" />
                <div className="shimmer h-3 rounded-lg mb-6 w-1/3" />
                <div className="flex gap-6 mb-6">
                  <div className="shimmer h-8 w-12 rounded-lg" />
                  <div className="shimmer h-8 w-12 rounded-lg" />
                </div>
                <div className="shimmer h-10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            {decks.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-300">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-ink mb-2">No decks yet</h3>
                <p className="text-ink-400 mb-6">Upload a PDF to generate your first flashcard deck.</p>
                <Link href="/upload" className="px-6 py-3 bg-ink text-cream rounded-xl font-medium text-sm hover:bg-accent transition-colors">
                  Upload PDF →
                </Link>
              </>
            ) : (
              <>
                <h3 className="font-display text-xl text-ink mb-2">No results for "{search}"</h3>
                <button onClick={() => setSearch('')} className="text-accent text-sm hover:underline">
                  Clear search
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(deck => (
              <DeckCard
                key={deck._id}
                id={deck._id}
                title={deck.title}
                totalCards={deck.totalCards}
                dueCount={deck.dueCount}
                accuracy={deck.accuracy}
                lastReviewedAt={deck.lastReviewedAt}
                createdAt={deck.createdAt}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
