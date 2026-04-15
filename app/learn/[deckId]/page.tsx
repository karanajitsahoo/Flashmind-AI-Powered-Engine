'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface LearningCard {
  _id: string
  title: string
  content: string
  example: string
  difficulty: 'easy' | 'medium' | 'hard'
  concept: string
  order: number
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

const difficultyIcons = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
}

export default function LearnPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const router = useRouter()

  const [cards, setCards] = useState<LearningCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [regenerating, setRegenerating] = useState(false)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId }),
      })
      if (!res.ok) throw new Error('Failed')
      setCurrentIndex(0)
      await fetchCards()
    } catch {
      // silent
    } finally {
      setRegenerating(false)
    }
  }

  const fetchCards = useCallback(async () => {
    if (!deckId) return
    try {
      const res = await fetch(`/api/learn?deckId=${deckId}`)
      if (!res.ok) throw new Error('Failed to load')
      let data

try {
  data = await res.json()
} catch (err) {
  const text = await res.text()
  console.error("RAW RESPONSE:", text)
  throw new Error("Server returned invalid response")
}
      setCards(data.cards || [])
    } catch {
      setError('Failed to load learning cards.')
    } finally {
      setLoading(false)
    }
  }, [deckId])

  useEffect(() => { fetchCards() }, [fetchCards])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentIndex, cards.length])

  const next = () => setCurrentIndex(i => Math.min(i + 1, cards.length - 1))
  const prev = () => setCurrentIndex(i => Math.max(i - 1, 0))

  const card = cards[currentIndex]
  const hasNext = currentIndex < cards.length - 1
  const hasPrev = currentIndex > 0
  const progress = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">

        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            <p className="text-ink-400">Loading learning cards…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-ink-400 mb-4">{error}</p>
            <button onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-ink text-cream rounded-xl text-sm font-medium">
              ← Dashboard
            </button>
          </div>
        )}

        {!loading && !error && cards.length === 0 && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📚</p>
            <h2 className="font-display text-2xl text-ink mb-2">No learning cards found</h2>
            <p className="text-ink-400 mb-6">Try re-generating this deck.</p>
            <button onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-ink text-cream rounded-xl text-sm font-medium">
              ← Dashboard
            </button>
          </div>
        )}

        {!loading && !error && card && (
          <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl text-ink">Learn</h1>
                <p className="text-ink-400 text-sm mt-0.5">Card {currentIndex + 1} of {cards.length}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/review/${deckId}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-ink text-cream rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
                >
                  Practice →
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-ink-300">{progress}% through</span>
                <span className="text-xs text-ink-300">{cards.length - currentIndex - 1} remaining</span>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl border border-ink-100 shadow-lg overflow-hidden">

              {/* Card header */}
              <div className="px-7 pt-7 pb-4 border-b border-ink-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-ink-300 uppercase tracking-widest mb-2">Concept</p>
                    <h2 className="font-display text-2xl text-ink leading-tight">{card.title}</h2>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${difficultyColors[card.difficulty]}`}>
                      {difficultyIcons[card.difficulty]} {card.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-ink-50 text-ink-500 text-xs font-medium rounded-full border border-ink-100">
                      {card.concept}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="px-7 py-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">💡</span>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Explanation</p>
                </div>
                <p className="text-ink text-base leading-relaxed">{card.content}</p>
              </div>

              {/* Example */}
              {card.example && (
                <div className="mx-7 mb-7 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🌍</span>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Real-world Example</p>
                  </div>
                  <p className="text-blue-900 text-sm leading-relaxed">{card.example}</p>
                </div>
              )}
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentIndex
                      ? 'w-6 h-2.5 bg-ink'
                      : i < currentIndex
                      ? 'w-2.5 h-2.5 bg-ink-300'
                      : 'w-2.5 h-2.5 bg-ink-100'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={prev}
                disabled={!hasPrev}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-ink-200 text-ink rounded-xl text-sm font-medium hover:border-ink-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              {/* Concept pills */}
              <div className="hidden md:flex gap-1 flex-wrap justify-center flex-1">
                {Array.from(new Set(cards.map(c => c.concept))).slice(0, 4).map(concept => (
                  <span key={concept} className="px-2 py-0.5 bg-ink-50 text-ink-400 text-xs rounded-full border border-ink-100">
                    {concept}
                  </span>
                ))}
              </div>

              {hasNext ? (
                <button
                  onClick={next}
                  className="flex items-center gap-2 px-5 py-3 bg-ink text-cream rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/review/${deckId}`)}
                  className="flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Start Practice →
                </button>
              )}
            </div>

            {/* Keyboard hint */}
            <p className="text-center text-xs text-ink-300">
              Use <kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono text-ink-400">←</kbd> <kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono text-ink-400">→</kbd> arrow keys to navigate
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
