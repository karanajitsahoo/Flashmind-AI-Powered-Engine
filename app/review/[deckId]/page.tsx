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

// ─── Types (unchanged) ────────────────────────────────────────────────────
interface Card {
  _id: string
  type: 'flashcard' | 'mcq'
  question: string
  answer: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  concept: string
  topic: string
  tags: string[]
  repetitions: number
  easeFactor: number
  interval: number
}
interface ReviewStats {
  dueCount: number
  totalCards: number
  accuracy: number
  title?: string
}
interface ConceptStat {
  concept: string
  total: number
  correct: number
}
interface CardState {
  answered: boolean
  selectedOption: string | null
  isCorrect: boolean | null
  rating: number | null
}
type SessionState = 'loading' | 'reviewing' | 'complete' | 'empty'

// ─── localStorage helpers (unchanged) ─────────────────────────────────────
function saveProgress(deckId: string, index: number, states: Record<string, CardState>) {
  try { localStorage.setItem(`practice_progress_${deckId}`, JSON.stringify({ index, states })) } catch { }
}
function loadProgress(deckId: string): { index: number; states: Record<string, CardState> } | null {
  try {
    const raw = localStorage.getItem(`practice_progress_${deckId}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}
function clearProgress(deckId: string) {
  try { localStorage.removeItem(`practice_progress_${deckId}`) } catch { }
}

export default function ReviewPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const router = useRouter()

  const [allCards, setAllCards] = useState<Card[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [deckStats, setDeckStats] = useState<ReviewStats | null>(null)
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({})
  const [conceptStats, setConceptStats] = useState<Record<string, ConceptStat>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deckTitle, setDeckTitle] = useState('')
  const [activeConcept, setActiveConcept] = useState<string | null>(null)

  // ─── All data-fetching & logic completely unchanged ───────────────────
  const fetchCards = useCallback(async (resumeProgress = true) => {
    try {
      const res = await fetch(`/api/review?deckId=${deckId}&all=true`)
      if (!res.ok) throw new Error('Failed to load cards')
      const data: { stats: ReviewStats; cards: Card[] } = await res.json()
      setDeckStats(data.stats)
      setAllCards(data.cards)
      if (data.cards.length > 0) setDeckTitle(data.cards[0].topic || 'Deck')
      if (!data.cards || data.cards.length === 0) { setSessionState('empty'); return }
      const cs: Record<string, ConceptStat> = {}
      for (const card of data.cards) {
        const c = card.concept || 'General'
        if (!cs[c]) cs[c] = { concept: c, total: 0, correct: 0 }
        cs[c].total++
      }
      setConceptStats(cs)
      const saved = resumeProgress ? loadProgress(deckId) : null
      if (saved && saved.states && Object.keys(saved.states).length > 0) {
        setCards(data.cards); setActiveConcept(null); setCardStates(saved.states)
        const restoredCs: Record<string, ConceptStat> = { ...cs }
        for (const card of data.cards) {
          const state = saved.states[card._id]
          if (state?.isCorrect) {
            const c = card.concept || 'General'
            restoredCs[c] = { ...restoredCs[c], correct: (restoredCs[c]?.correct || 0) + 1 }
          }
        }
        setConceptStats(restoredCs)
        setCurrentIndex(Math.min(saved.index, data.cards.length - 1))
        setSessionState('reviewing')
      } else {
        setCards(data.cards); setActiveConcept(null); setCardStates({}); setCurrentIndex(0); setSessionState('reviewing')
      }
    } catch { setSessionState('empty') }
  }, [deckId])

  useEffect(() => { fetchCards(true) }, [fetchCards])

  useEffect(() => {
    if (sessionState === 'reviewing' && cards.length > 0) saveProgress(deckId, currentIndex, cardStates)
  }, [currentIndex, cardStates, sessionState, deckId, cards.length])

  const filterByConcept = (concept: string | null) => {
    setActiveConcept(concept)
    const filtered = concept ? allCards.filter(c => c.concept === concept) : allCards
    setCards(filtered); setCurrentIndex(0); setSessionState('reviewing')
    clearProgress(deckId)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (sessionState !== 'reviewing') return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
      const card = cards[currentIndex]
      if (e.key === ' ' && card?.type === 'flashcard' && !cardStates[card._id]?.answered) {
        e.preventDefault(); revealFlashcard(card._id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cards, currentIndex, cardStates, sessionState])

  const goNext = () => {
    if (currentIndex < cards.length - 1) setCurrentIndex(i => i + 1)
    else if (allAnswered) setSessionState('complete')
  }
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(i => i - 1) }

  const hasNext = currentIndex < cards.length - 1
  const hasPrev = currentIndex > 0
  const currentCard = cards[currentIndex]
  const currentState = currentCard
    ? (cardStates[currentCard._id] ?? { answered: false, selectedOption: null, isCorrect: null, rating: null })
    : null
  const allAnswered = cards.length > 0 && cards.every(c => cardStates[c._id]?.answered)
  const answeredCount = Object.values(cardStates).filter(s => s.answered).length
  const correctCount = Object.values(cardStates).filter(s => s.isCorrect).length
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0

  const revealFlashcard = (cardId: string) => {
    setCardStates(prev => ({ ...prev, [cardId]: { ...(prev[cardId] ?? { answered: false, selectedOption: null, isCorrect: null, rating: null }), answered: false } }))
  }

  const handleRate = async (rating: number) => {
    if (submitting || !currentCard) return
    setSubmitting(true)
    const isCorrect = rating >= 2
    setCardStates(prev => ({ ...prev, [currentCard._id]: { answered: true, selectedOption: null, isCorrect, rating } }))
    if (isCorrect) {
      const concept = currentCard.concept || 'General'
      setConceptStats(prev => ({ ...prev, [concept]: { ...prev[concept], correct: (prev[concept]?.correct || 0) + 1 } }))
    }
    try {
      await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flashcardId: currentCard._id, deckId, rating }) })
    } catch { }
    setSubmitting(false)
    if (hasNext) setTimeout(() => setCurrentIndex(i => i + 1), 400)
    else setTimeout(() => setSessionState('complete'), 400)
  }

  const handleMCQSelect = async (option: string) => {
    if (currentState?.answered || submitting || !currentCard) return
    setSubmitting(true)
    const isCorrect = option === currentCard.correctAnswer
    setCardStates(prev => ({ ...prev, [currentCard._id]: { answered: true, selectedOption: option, isCorrect, rating: isCorrect ? 5 : 1 } }))
    if (isCorrect) {
      const concept = currentCard.concept || 'General'
      setConceptStats(prev => ({ ...prev, [concept]: { ...prev[concept], correct: (prev[concept]?.correct || 0) + 1 } }))
    }
    try {
      await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flashcardId: currentCard._id, deckId, rating: isCorrect ? 5 : 1 }) })
    } catch { }
    setSubmitting(false)
  }

  // ─── Concept level helper ─────────────────────────────────────────────
  const getConceptLevel = (stat: ConceptStat) => {
    if (stat.total === 0) return 'weak'
    const acc = (stat.correct / stat.total) * 100
    if (acc >= 75) return 'strong'
    if (acc >= 40) return 'shaky'
    return 'weak'
  }

  const progressPct = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0

  // ─── LOADING ──────────────────────────────────────────────────────────
  if (sessionState === 'loading') {
    return (
      <div className="min-h-screen bg-[#1C3D2E] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="w-12 h-[1px] bg-[#C9A96E] mx-auto mb-6 animate-pulse" />
          <p className={`${cormorant.className} text-[#F2E8D5] text-2xl`}>Loading your deck…</p>
          <p className={`${dmSans.className} text-[#C9A96E]/60 text-xs tracking-[0.2em] uppercase mt-2`}>Fetching cards</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#1C3D2E] ${dmSans.className}`}>
      <Navbar />

      {/* ══════════════════════ EMPTY STATE ══════════════════════ */}
      {sessionState === 'empty' && (
        <main className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mx-auto mb-8">
            <svg className="w-7 h-7 text-[#C9A96E]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-[#C9A96E] text-[10px] tracking-[0.3em] uppercase mb-4">All Caught Up</p>
          <h2 className={`${cormorant.className} text-[#F2E8D5] text-5xl font-medium mb-4`}>
            Nothing due<br />
            <span className={`${pinyon.className} text-[#C9A96E]`}>right now</span>
          </h2>
          <p className="text-[#F2E8D5]/40 text-sm font-light mb-2">
            {deckStats ? `This deck has ${deckStats.totalCards} cards total.` : 'All cards have been reviewed.'}
          </p>
          <p className="text-[#F2E8D5]/30 text-xs tracking-wide mb-10">Come back later or review everything again.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 border border-[#F2E8D5]/20 text-[#F2E8D5]/60 text-xs tracking-[0.15em] uppercase rounded-sm hover:border-[#F2E8D5]/40 hover:text-[#F2E8D5]/80 transition-all"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => { setSessionState('loading'); fetchCards(false) }}
              className="px-6 py-2.5 bg-[#C9A96E] text-[#1C3D2E] text-xs tracking-[0.15em] uppercase font-medium rounded-sm hover:bg-[#D4B98A] transition-all"
            >
              Review All Anyway
            </button>
          </div>
        </main>
      )}

      {/* ══════════════════════ COMPLETE STATE ══════════════════════ */}
      {sessionState === 'complete' && (() => {
        const strong = Object.values(conceptStats).filter(s => s.total > 0 && (s.correct / s.total) >= 0.75)
        const shaky = Object.values(conceptStats).filter(s => s.total > 0 && (s.correct / s.total) >= 0.40 && (s.correct / s.total) < 0.75)
        const weak = Object.values(conceptStats).filter(s => s.total === 0 || (s.correct / s.total) < 0.40)

        return (
          <main className="max-w-3xl mx-auto px-6 py-16">

            {/* Hero result */}
            <div className="text-center mb-14">
              <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-6">Session Complete</p>
              <h1 className={`${cormorant.className} text-[#F2E8D5] leading-[0.9] mb-3`} style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 500 }}>
                {accuracy >= 80 ? 'Excellent' : accuracy >= 50 ? 'Well done' : 'Keep going'}
              </h1>
              <p className={`${pinyon.className} text-[#C9A96E] mb-8`} style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                {accuracy >= 80 ? 'you nailed it' : accuracy >= 50 ? 'solid progress' : 'practice makes perfect'}
              </p>
              <p className="text-[#F2E8D5]/40 text-xs tracking-[0.1em] font-light">{deckTitle}</p>
            </div>

            {/* Stats row — editorial grid style */}
            <div className="grid grid-cols-3 gap-px bg-[#F2E8D5]/10 border border-[#F2E8D5]/10 rounded-sm mb-12 overflow-hidden">
              {[
                { label: 'Attempted', value: answeredCount },
                { label: 'Correct', value: correctCount },
                { label: 'Accuracy', value: `${accuracy}%` },
              ].map((s, i) => (
                <div key={i} className="bg-[#1C3D2E] px-6 py-8 text-center">
                  <p className="text-[#C9A96E] text-[9px] tracking-[0.3em] uppercase mb-3 font-light">{s.label}</p>
                  <p className={`${cormorant.className} text-[#F2E8D5] font-medium`} style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Concept Performance — Fluencia-styled */}
            {Object.keys(conceptStats).length > 0 && (
              <div className="mb-12">

                {/* Section header with dotted line */}
                <div className="flex items-center gap-4 mb-8">
                  <p className="text-[#C9A96E] text-[11px] tracking-[0.35em] uppercase whitespace-nowrap font-light">Concept Performance</p>
                  <div className="flex-1 border-t border-dotted border-[#F2E8D5]/15" />
                  <p className="text-[#F2E8D5]/40 text-[9px] tracking-[0.2em]">{Object.keys(conceptStats).length} concepts</p>
                </div>

                <div className="space-y-8">

                  {strong.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4A7C5E]" />
                        <p className="text-[9px] tracking-[0.25em] uppercase text-[#4A7C5E] font-medium">Strong</p>
                      </div>
                      <div className="space-y-px">
                        {strong.map(s => (
                          <div key={s.concept} className="flex items-center justify-between px-4 py-3 bg-[#2A5040] border-l-2 border-[#4A7C5E]">
                            <span className={`${dmSans.className} text-[#F2E8D5]/80 text-sm font-light`}>{s.concept}</span>
                            <span className={`${cormorant.className} text-[#4A7C5E] text-lg`}>{Math.round((s.correct / s.total) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {shaky.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
                        <p className="text-[9px] tracking-[0.25em] uppercase text-[#C9A96E] font-medium">Shaky</p>
                      </div>
                      <div className="space-y-px">
                        {shaky.map(s => (
                          <div key={s.concept} className="flex items-center justify-between px-4 py-3 bg-[#C9A96E]/10 border-l-2 border-[#C9A96E]">
                            <span className={`${dmSans.className} text-[#F2E8D5]/80 text-sm font-light`}>{s.concept}</span>
                            <span className={`${cormorant.className} text-[#C9A96E] text-lg`}>{Math.round((s.correct / s.total) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {weak.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#A0522D]/70" />
                        <p className="text-[9px] tracking-[0.25em] uppercase text-[#A0522D]/80 font-medium">Needs Work</p>
                      </div>
                      <div className="space-y-px">
                        {weak.map(s => (
                          <div key={s.concept} className="flex items-center justify-between px-4 py-3 bg-[#A0522D]/8 border-l-2 border-[#A0522D]/40">
                            <span className={`${dmSans.className} text-[#F2E8D5]/70 text-sm font-light`}>{s.concept}</span>
                            <button
                              onClick={() => filterByConcept(s.concept)}
                              className="text-[9px] tracking-[0.2em] uppercase text-[#F2E8D5]/80 hover:text-[#C9A96E] transition-colors"
                            >
                              Practice →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap pt-8 border-t border-[#F2E8D5]/10">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2.5 border border-[#F2E8D5]/15 text-[#F2E8D5]/50 text-[10px] tracking-[0.2em] uppercase rounded-sm hover:border-[#F2E8D5]/30 hover:text-[#F2E8D5]/70 transition-all"
              >
                ← Dashboard
              </button>
              <button
                onClick={() => router.push(`/learn/${deckId}`)}
                className="px-6 py-2.5 border border-[#F2E8D5]/15 text-[#F2E8D5]/50 text-[10px] tracking-[0.2em] uppercase rounded-sm hover:border-[#F2E8D5]/30 hover:text-[#F2E8D5]/70 transition-all"
              >
                Review Concepts
              </button>
              <button
                onClick={() => { clearProgress(deckId); setCardStates({}); setCurrentIndex(0); setActiveConcept(null); setCards(allCards); setSessionState('reviewing') }}
                className="px-6 py-2.5 bg-[#C9A96E] text-[#1C3D2E] text-[10px] tracking-[0.2em] uppercase font-medium rounded-sm hover:bg-[#D4B98A] transition-all"
              >
                Practice Again
              </button>
            </div>

          </main>
        )
      })()}

      {/* ══════════════════════ REVIEWING STATE ══════════════════════ */}
      {sessionState === 'reviewing' && currentCard && currentState && (
        <main className="max-w-5xl mx-auto px-6 py-10">

          {/* Top nav row */}
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
                Card {currentIndex + 1} <span className="text-[#F2E8D5]/30">of {cards.length}</span>
              </p>
            </div>
          </div>

          {/* Progress line */}
          <div className="w-full h-px bg-[#F2E8D5]/10 relative mb-12">
            <div
              className="absolute top-0 left-0 h-px bg-[#C9A96E] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#C9A96E] rounded-full transition-all duration-500"
              style={{ left: `${progressPct}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

            {/* ── LEFT: Question card ─────────────────────────────── */}
            <div className="flex flex-col gap-5">

              <div className="bg-[#EDE2CC] rounded-sm p-7 border border-[#D4C4A0]">

                {/* Card meta tag */}
                <div className="flex items-center gap-3 mb-7">
                  <div className="border border-[#C9A96E]/40 px-3 py-1 rounded-sm">
                    <p className="text-[9px] tracking-[0.25em] uppercase text-[#A88850] font-light">
                      {currentCard.type === 'mcq' ? 'MCQ' : 'Flashcard'} · {currentCard.concept}
                    </p>
                  </div>
                  {/* difficulty dot */}
                  <div className={`w-1.5 h-1.5 rounded-full ${currentCard.difficulty === 'easy' ? 'bg-[#4A7C5E]' : currentCard.difficulty === 'medium' ? 'bg-[#C9A96E]' : 'bg-[#A0522D]/70'}`} />
                  <p className="text-[9px] tracking-[0.15em] uppercase text-[#A88850]/60">{currentCard.difficulty}</p>
                </div>

                {/* Question */}
                <h2 className={`${cormorant.className} text-[#1C3D2E] text-center leading-snug mb-9`}
                  style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 500 }}>
                  {currentCard.question}
                </h2>

                {/* ── MCQ Options ── */}
                {currentCard.type === 'mcq' && (
                  <div className="space-y-2.5">
                    {currentCard.options.map((option, i) => {
                      const labels = ['A', 'B', 'C', 'D']
                      const isCorrect = option === currentCard.correctAnswer
                      const isSelected = option === currentState.selectedOption

                      let optionClass = ''
                      if (!currentState.answered) {
                        optionClass = 'border-[#C9A96E]/20 bg-[#FAF6EE] hover:border-[#1C3D2E]/40 hover:bg-[#F2E8D5] cursor-pointer'
                      } else if (isCorrect) {
                        optionClass = 'border-[#4A7C5E] bg-[#2A5040]/10'
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'border-[#A0522D]/60 bg-[#A0522D]/8'
                      } else {
                        optionClass = 'border-[#C9A96E]/10 bg-[#F2E8D5]/50 opacity-50'
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleMCQSelect(option)}
                          disabled={currentState.answered || submitting}
                          className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-sm border text-left transition-all duration-150 ${optionClass}`}
                        >
                          {/* Letter circle */}
                          <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 transition-all
                            ${currentState.answered && isCorrect
                              ? 'border-[#4A7C5E] text-[#4A7C5E]'
                              : currentState.answered && isSelected && !isCorrect
                                ? 'border-[#A0522D]/60 text-[#A0522D]'
                                : 'border-[#1C3D2E]/25 text-[#1C3D2E]/40'
                            }`}>
                            {labels[i]}
                          </span>
                          <span className={`${dmSans.className} text-sm font-light flex-1
                            ${currentState.answered && isCorrect ? 'text-[#2A5040]' : currentState.answered && isSelected && !isCorrect ? 'text-[#7A3B1E]' : 'text-[#1C3D2E]'}`}>
                            {option}
                          </span>
                          {/* Result icon */}
                          {currentState.answered && isCorrect && (
                            <svg className="w-4 h-4 text-[#4A7C5E] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                          {currentState.answered && isSelected && !isCorrect && (
                            <svg className="w-4 h-4 text-[#A0522D]/70 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* ── Flashcard reveal ── */}
                {currentCard.type === 'flashcard' && !currentState.answered && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => revealFlashcard(currentCard._id)}
                      className="px-8 py-2.5 border border-[#1C3D2E]/20 text-[#1C3D2E]/50 text-[10px] tracking-[0.2em] uppercase rounded-sm hover:border-[#1C3D2E]/40 hover:text-[#1C3D2E]/80 transition-all"
                    >
                      Reveal Answer (Space)
                    </button>
                  </div>
                )}

                {/* Flashcard answer + rating */}
                {currentCard.type === 'flashcard' && currentState.answered === false && currentState.selectedOption !== null && (
                  <div className="mt-6 pt-6 border-t border-[#C9A96E]/20">
                    <p className="text-[9px] tracking-[0.2em] uppercase text-[#A88850] mb-3 font-light">Answer</p>
                    <p className={`${cormorant.className} text-[#1C3D2E] text-lg leading-relaxed mb-6`}>{currentCard.answer}</p>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-[#A88850] mb-3 font-light">How did you do?</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Again', rating: 0, cls: 'border-[#A0522D]/30 text-[#A0522D]/70 hover:bg-[#A0522D]/8' },
                        { label: 'Hard', rating: 1, cls: 'border-[#C9A96E]/40 text-[#A88850] hover:bg-[#C9A96E]/8' },
                        { label: 'Good', rating: 3, cls: 'border-[#1C3D2E]/20 text-[#1C3D2E]/60 hover:bg-[#1C3D2E]/6' },
                        { label: 'Easy', rating: 5, cls: 'bg-[#C9A96E] text-[#1C3D2E] border-[#C9A96E] hover:bg-[#D4B98A]' },
                      ].map(r => (
                        <button
                          key={r.label}
                          onClick={() => handleRate(r.rating)}
                          disabled={submitting}
                          className={`py-2.5 border rounded-sm text-[10px] tracking-[0.15em] uppercase transition-all ${r.cls}`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={goPrev}
                  disabled={!hasPrev}
                  className="px-6 py-2 border border-[#F2E8D5]/15 text-[#F2E8D5]/40 text-[10px] tracking-[0.2em] uppercase rounded-sm hover:border-[#F2E8D5]/30 hover:text-[#F2E8D5]/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>

                <span className={`${cormorant.className} text-[#F2E8D5]/50 text-base`}>
                  {currentIndex + 1} / {cards.length}
                </span>

                {hasNext ? (
                  <button
                    onClick={goNext}
                    className="px-8 py-2 bg-[#C9A96E] text-[#1C3D2E] text-[10px] tracking-[0.2em] uppercase font-medium rounded-sm hover:bg-[#D4B98A] transition-all"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => setSessionState('complete')}
                    className="px-8 py-2 bg-[#C9A96E] text-[#1C3D2E] text-[10px] tracking-[0.2em] uppercase font-medium rounded-sm hover:bg-[#D4B98A] transition-all"
                  >
                    Finish →
                  </button>
                )}
              </div>

            </div>

            {/* ── RIGHT PANEL ─────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sticky top-24">

              {/* Session stats */}
              <div className="border border-[#F2E8D5]/10 rounded-sm p-5">
                <p className="text-[#C9A96E] text-[11px] tracking-[0.3em] uppercase mb-5 font-light">Session</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#F2E8D5]/50 text-xs font-light">Correct</span>
                    <span className={`${cormorant.className} text-[#4A7C5E] text-2xl`}>{correctCount}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#F2E8D5]/50 text-xs font-light">Wrong</span>
                    <span className={`${cormorant.className} text-[#A0522D]/80 text-2xl`}>{answeredCount - correctCount}</span>
                  </div>
                  <div className="pt-3">
                    <div className="w-full h-[2px] bg-[#F2E8D5]/10 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-[#C9A96E] transition-all duration-500"
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-[#F2E8D5]/50 text-xs font-light">Accuracy</span>
                      <span className={`${cormorant.className} text-[#C9A96E] text-2xl`}>{accuracy}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation panel */}
              <div className="border border-[#F2E8D5]/10 rounded-sm p-5">
                <p className="text-[#C9A96E] text-[11px] tracking-[0.3em] uppercase mb-4 font-light">Explanation</p>
                {!currentState.answered ? (
                  <p className="text-[#F2E8D5]/20 text-xs font-light leading-relaxed">
                    Answer to reveal…
                  </p>
                ) : (
                  <p className="text-[#F2E8D5]/65 text-[13px] font-light leading-relaxed">
                    {currentCard.explanation || 'No explanation available.'}
                  </p>
                )}
              </div>

              {/* Concept tracker — mini */}
              {Object.keys(conceptStats).length > 0 && (
                <div className="border border-[#F2E8D5]/10 rounded-sm p-5">
                  <p className="text-[#C9A96E] text-[11px] tracking-[0.3em] uppercase mb-4 font-light">Concepts</p>
                  <div className="space-y-2.5">
                    {Object.values(conceptStats).slice(0, 6).map(stat => {
                      const level = getConceptLevel(stat)
                      const acc = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : null
                      return (
                        <div key={stat.concept} className="flex items-center gap-2">
                          <div className={`w-1 h-1 rounded-full flex-shrink-0 bg-[#F2E8D5]/50`} />
                          <span className="text-[#F2E8D5]/55 text-[12px] flex-1 truncate">{stat.concept}</span>
                          {acc !== null && (
                            <span className={`${cormorant.className} text-sm text-[#F2E8D5]/60`}>
                              {acc}%
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      )}
    </div>
  )
}