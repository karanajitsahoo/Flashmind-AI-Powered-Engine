'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Cormorant_Garamond, Pinyon_Script, DM_Sans } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})
const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

interface LearningCard {
  _id: string
  title: string
  content: string
  example: string
  difficulty: 'easy' | 'medium' | 'hard'
  concept: string
  order: number
}

export default function LearnPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const router = useRouter()

  const [cards, setCards] = useState<LearningCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deckTitle, setDeckTitle] = useState('')

  // Derived concepts
  const concepts = Array.from(new Set(cards.map(c => c.concept || 'General')))

  const fetchCards = useCallback(async () => {
    if (!deckId) return
    try {
      const res = await fetch(`/api/learn?deckId=${deckId}`)
      if (!res.ok) throw new Error('Failed to load')
      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('Server returned invalid response')
      }
      setCards(data.cards || [])

      const deckRes = await fetch('/api/decks')
      const deckData = await deckRes.json()
      const currentDeck = deckData.decks.find((d: any) => d._id === deckId)
      if (currentDeck) setDeckTitle(currentDeck.title)
    } catch {
      setError('Failed to load learning cards.')
    } finally {
      setLoading(false)
    }
  }, [deckId])

  useEffect(() => { fetchCards() }, [fetchCards])

  const next = () => setCurrentIndex(i => Math.min(i + 1, cards.length - 1))
  const prev = () => setCurrentIndex(i => Math.max(i - 1, 0))

  const card = cards[currentIndex]
  const hasNext = currentIndex < cards.length - 1
  const hasPrev = currentIndex > 0

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { if (hasNext) setCurrentIndex(i => i + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { if (hasPrev) setCurrentIndex(i => i - 1) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [hasNext, hasPrev])

  const progressPct = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0

  // ── LOADING ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#1C3D2E] flex items-center justify-center ${dmSans.className}`}>
        <Navbar />
        <div className="text-center">
          <div className="w-12 h-px bg-[#C9A96E] mx-auto mb-6 animate-pulse" />
          <p className={`${cormorant.className} text-[#F2E8D5] text-2xl`}>Loading concepts…</p>
          <p className={`${dmSans.className} text-[#C9A96E]/60 text-[10px] tracking-[0.2em] uppercase mt-2`}>Preparing your deck</p>
        </div>
      </div>
    )
  }

  // ── ERROR ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`min-h-screen bg-[#1C3D2E] flex items-center justify-center ${dmSans.className}`}>
        <Navbar />
        <div className="text-center">
          <p className={`${cormorant.className} text-[#F2E8D5] text-2xl mb-4`}>Something went wrong</p>
          <p className="text-[#F2E8D5]/40 text-sm font-light mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 border border-[#F2E8D5]/20 text-[#F2E8D5]/60 text-[10px] tracking-[0.2em] uppercase rounded-sm hover:border-[#F2E8D5]/40 transition-all"
          >
            ← Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#1C3D2E] ${dmSans.className}`}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Top nav row ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[#F2E8D5]/40 text-[10px] tracking-[0.2em] uppercase hover:text-[#F2E8D5]/70 transition-colors"
          >
            ← Back
          </button>
          <div className="text-right">
            <p className="text-[#C9A96E] text-[10px] tracking-[0.2em] uppercase font-light">{deckTitle}</p>
            <p className={`${cormorant.className} text-[#F2E8D5] text-xl mt-0.5`}>
              Concept {currentIndex + 1} <span className="text-[#F2E8D5]/30">of {cards.length}</span>
            </p>
          </div>
        </div>

        {/* ── Progress line ────────────────────────────────────────── */}
        <div className="w-full h-px bg-[#F2E8D5]/10 relative mb-12">
          <div
            className="absolute top-0 left-0 h-px bg-[#C9A96E] transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#C9A96E] rounded-full transition-all duration-500 ease-out"
            style={{ left: `${progressPct}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* ── Main grid ───────────────────────────────────────────── */}
        {card && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

            {/* LEFT: card + nav */}
            <div className="flex flex-col gap-5">

              {/* Concept card */}
              <div className="bg-[#EDE2CC] rounded-sm border border-[#D4C4A0] p-7">

                {/* Tag row */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="border border-[#C9A96E]/40 px-3 py-1 rounded-sm">
                    <p className="text-[9px] tracking-[0.25em] uppercase text-[#A88850] font-light">
                      Concept · Definition
                    </p>
                  </div>
                  {/* difficulty dot */}
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    card.difficulty === 'easy'
                      ? 'bg-[#4A7C5E]'
                      : card.difficulty === 'medium'
                      ? 'bg-[#C9A96E]'
                      : 'bg-[#A0522D]/70'
                  }`} />
                  <p className="text-[9px] tracking-[0.15em] uppercase text-[#A88850]/60">{card.difficulty}</p>
                </div>

                {/* Title */}
                <h2 className={`${cormorant.className} text-[#1C3D2E] leading-tight mb-5`}
                  style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 500 }}>
                  {card.title}
                </h2>

                {/* Content body */}
                <p className={`${dmSans.className} text-[#1C3D2E]/75 text-sm leading-relaxed font-light mb-6`}>
                  {card.content}
                </p>

                {/* Related / Example callout */}
                {card.example && (
                  <div className="border-l-2 border-[#C9A96E] bg-[#D8CBB2] pl-4 pr-4 py-3.5 rounded-r-sm">
                    <p className="text-[9px] tracking-[0.2em] uppercase text-[#A88850] mb-1.5 font-light">
                      Related to
                    </p>
                    <p className={`${dmSans.className} text-[#1C3D2E]/70 text-sm font-light leading-relaxed`}>
                      {card.example}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={!hasPrev}
                  className="px-6 py-2 border border-[#F2E8D5]/15 text-[#F2E8D5]/40 text-[10px] tracking-[0.2em] uppercase rounded-sm hover:border-[#F2E8D5]/30 hover:text-[#F2E8D5]/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>

                <span className={`${cormorant.className} text-[#F2E8D5]/30 text-base`}>
                  {currentIndex + 1} / {cards.length}
                </span>

                <button
                  onClick={hasNext ? next : () => router.push(`/review/${deckId}`)}
                  className="px-8 py-2 bg-[#C9A96E] text-[#1C3D2E] text-[10px] tracking-[0.2em] uppercase font-medium rounded-sm hover:bg-[#D4B98A] transition-all"
                >
                  {hasNext ? 'Next →' : 'Start Practice →'}
                </button>
              </div>
            </div>

            {/* RIGHT: concept tracker */}
            <div className="border border-[#F2E8D5]/10 rounded-sm p-5 sticky top-24">

              <div className="flex items-center gap-3 mb-6">
                <p className="text-[#C9A96E] text-[11px] tracking-[0.3em] uppercase font-light whitespace-nowrap">
                  Concept Tracker
                </p>
                <div className="flex-1 border-t border-dotted border-[#F2E8D5]/10" />
                <p className="text-[#F2E8D5]/20 text-[9px]">{concepts.length}</p>
              </div>

              {concepts.length === 0 ? (
                <p className="text-[#F2E8D5]/20 text-xs font-light">No concepts found</p>
              ) : (
                <div className="space-y-px">
                  {concepts.map((c, i) => {
                    const isActive = (card?.concept || 'General') === c
                    // Find which card index this concept starts at
                    const conceptStartIdx = cards.findIndex(cd => (cd.concept || 'General') === c)
                    // How many cards in this concept
                    const conceptCardCount = cards.filter(cd => (cd.concept || 'General') === c).length
                    // How many in this concept have been seen (index passed)
                    const seenInConcept = cards
                      .slice(0, currentIndex + 1)
                      .filter(cd => (cd.concept || 'General') === c).length
                    const conceptDone = seenInConcept >= conceptCardCount

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (conceptStartIdx !== -1) setCurrentIndex(conceptStartIdx)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-all group
                          ${isActive
                            ? 'bg-[#C9A96E]/10 border border-[#C9A96E]/20'
                            : 'border border-transparent hover:border-[#F2E8D5]/10'
                          }`}
                      >
                        {/* Status dot */}
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all bg-[#F2E8D5]/50`} />

                        <span className={`text-[12px] font- flex-1 leading-tight transition-all ${
                          isActive
                            ? 'text-[#C9A96E]'
                            : conceptDone
                            ? 'text-[#F2E8D5]/50'
                            : 'text-[#F2E8D5]/35 group-hover:text-[#F2E8D5]/55'
                        }`}>
                          {c}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Jump to practice CTA at bottom of sidebar */}
              <div className="mt-6 pt-5 border-t border-[#F2E8D5]/8">
                <button
                  onClick={() => router.push(`/review/${deckId}`)}
                  className="w-full py-2 bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] text-[9px] tracking-[0.2em] uppercase rounded-sm hover:bg-[#C9A96E]/15 transition-all"
                >
                  Skip to Practice →
                </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  )
}