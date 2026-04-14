'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import DeckCard from '@/components/DeckCard'

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
      setDecks(deckData.decks ?? [])
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
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-4xl text-ink mb-1">Dashboard</h1>
            <p className="text-ink-400">
              {loading ? 'Loading…' : `${decks.length} deck${decks.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-cream rounded-xl font-medium text-sm hover:bg-accent transition-all duration-200 self-start sm:self-auto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New deck
          </Link>
        </div>

        {/* Stats banner */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total cards', value: stats.totalCards, accent: false },
              {
                label: 'Due today',
                value: totalDue,
                accent: totalDue > 0,
                sub: totalDue > 0 ? 'needs review' : 'all caught up!',
              },
              {
                label: 'Accuracy',
                value: stats.totalReviews > 0 ? `${stats.accuracy}%` : '—',
                accent: false,
              },
              {
                label: 'Streak',
                value: stats.streak > 0 ? `${stats.streak} 🔥` : '0',
                accent: stats.streak > 0,
              },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-ink-100 shadow-card p-5">
                <p className="text-xs text-ink-400 mb-2 font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`font-display text-3xl ${s.accent ? 'text-accent' : 'text-ink'}`}>
                  {s.value}
                </p>
                {s.sub && <p className="text-xs text-ink-400 mt-1">{s.sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Activity Line Graph */}
        {stats?.activityStats && (() => {
          const viewMap = {
            daily: { data: stats.activityStats.daily, label: '7 Days' },
            weekly: { data: stats.activityStats.weekly, label: '30 Days' },
            monthly: { data: stats.activityStats.monthly, label: '12 Months' },
            yearly: { data: stats.activityStats.yearly, label: 'All Years' },
          }
          const { data } = viewMap[graphView]
          const max = Math.max(...data.map(d => d.questionsSolved), 1)
          const W = 600, H = 160, PAD = { top: 16, right: 16, bottom: 32, left: 36 }
          const innerW = W - PAD.left - PAD.right
          const innerH = H - PAD.top - PAD.bottom

          const pts = data.map((d, i) => ({
            x: PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2),
            y: PAD.top + innerH - (d.questionsSolved / max) * innerH,
            val: d.questionsSolved,
            label: graphView === 'daily' ? new Date(d.date).toLocaleDateString('en', { weekday: 'short' })
              : graphView === 'weekly' ? new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
              : graphView === 'monthly' ? new Date(d.date + '-01').toLocaleDateString('en', { month: 'short' })
              : d.date,
          }))

          const pathD = pts.length > 1
            ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
            : ''

          const areaD = pts.length > 1
            ? `${pathD} L ${pts[pts.length-1].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`
            : ''

          // Y-axis ticks
          const ticks = [0, Math.round(max * 0.5), max]

          return (
            <div className="bg-white rounded-2xl border border-ink-100 shadow-card p-6 mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">Activity — Questions Solved</h2>
                <div className="flex gap-1 bg-ink-50 rounded-lg p-1">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(v => (
                    <button key={v} onClick={() => setGraphView(v)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${graphView === v ? 'bg-white text-ink shadow-sm' : 'text-ink-400 hover:text-ink'}`}>
                      {viewMap[v].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '300px' }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {ticks.map((tick, i) => {
                    const y = PAD.top + innerH - (tick / max) * innerH
                    return (
                      <g key={i}>
                        <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#e5e3de" strokeWidth="1" strokeDasharray={tick === 0 ? '0' : '4 3'} />
                        <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9d9b95">{tick}</text>
                      </g>
                    )
                  })}

                  {/* Area fill */}
                  {areaD && <path d={areaD} fill="url(#areaGrad)" />}

                  {/* Line */}
                  {pathD && <path d={pathD} fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

                  {/* Points + labels */}
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#1a1a2e" strokeWidth="2" />
                      {p.val > 0 && (
                        <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="#1a1a2e" fontWeight="600">{p.val}</text>
                      )}
                      {/* X label — show every nth to avoid clutter */}
                      {(i % Math.ceil(pts.length / 8) === 0 || i === pts.length - 1) && (
                        <text x={p.x} y={PAD.top + innerH + 18} textAnchor="middle" fontSize="9" fill="#9d9b95">{p.label}</text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {data.every(d => d.questionsSolved === 0) && (
                <p className="text-center text-ink-300 text-sm mt-2">No activity yet — start practicing to see your graph! 📈</p>
              )}
            </div>
          )
        })()}

        {/* Search */}
        {decks.length > 0 && (
          <div className="relative mb-6">
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search decks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-ink-100 rounded-xl text-ink placeholder-ink-300 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink-300 transition-all"
            />
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
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
