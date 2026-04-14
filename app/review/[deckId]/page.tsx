'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

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

type SessionState = 'loading' | 'reviewing' | 'complete' | 'empty' | 'regenerating'

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

// ─── localStorage helpers ──────────────────────────────────────────────────
function saveProgress(deckId: string, index: number, states: Record<string, CardState>) {
  try {
    localStorage.setItem(`practice_progress_${deckId}`, JSON.stringify({ index, states }))
  } catch { /* ignore */ }
}

function loadProgress(deckId: string): { index: number; states: Record<string, CardState> } | null {
  try {
    const raw = localStorage.getItem(`practice_progress_${deckId}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function clearProgress(deckId: string) {
  try { localStorage.removeItem(`practice_progress_${deckId}`) } catch { /* ignore */ }
}

export default function ReviewPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const router = useRouter()

  const [allCards, setAllCards] = useState<Card[]>([])           // full deck
  const [cards, setCards] = useState<Card[]>([])                 // active set (may be filtered by concept)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [deckStats, setDeckStats] = useState<ReviewStats | null>(null)
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({})
  const [conceptStats, setConceptStats] = useState<Record<string, ConceptStat>>({})
  const [submitting, setSubmitting] = useState(false)

  // Feature 2: Concepts panel
  const [showConcepts, setShowConcepts] = useState(false)
  const [activeConcept, setActiveConcept] = useState<string | null>(null) // null = all

  const fetchCards = useCallback(async (resumeProgress = true) => {
    try {
      // Always fetch ALL cards so resume + concept filter work correctly
      const res = await fetch(`/api/review?deckId=${deckId}&all=true`)
      if (!res.ok) throw new Error('Failed to load cards')
      const data: { stats: ReviewStats; cards: Card[] } = await res.json()

      setDeckStats(data.stats)

      if (!data.cards || data.cards.length === 0) {
        setSessionState('empty')
        return
      }

      setAllCards(data.cards)

      // Init concept stats from full deck
      const cs: Record<string, ConceptStat> = {}
      for (const card of data.cards) {
        const c = card.concept || 'General'
        if (!cs[c]) cs[c] = { concept: c, total: 0, correct: 0 }
        cs[c].total++
      }
      setConceptStats(cs)

      // Feature 3: Resume progress from localStorage
      const saved = resumeProgress ? loadProgress(deckId) : null
      if (saved && saved.states && Object.keys(saved.states).length > 0) {
        // Restore saved state — use all cards (no concept filter when resuming)
        setCards(data.cards)
        setActiveConcept(null)
        setCardStates(saved.states)
        // Restore correct counts into conceptStats
        const restoredCs: Record<string, ConceptStat> = { ...cs }
        for (const [, state] of Object.entries(saved.states)) {
          // We don't know which concept each saved card belongs to from state alone
          // so we recompute from cards + states
        }
        // Recompute concept correct counts from restored states
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
        setCards(data.cards)
        setActiveConcept(null)
        setCardStates({})
        setCurrentIndex(0)
        setSessionState('reviewing')
      }
    } catch {
      setSessionState('empty')
    }
  }, [deckId])

  useEffect(() => { fetchCards(true) }, [fetchCards])

  // Feature 3: Auto-save progress whenever index or cardStates change
  useEffect(() => {
    if (sessionState === 'reviewing' && cards.length > 0) {
      saveProgress(deckId, currentIndex, cardStates)
    }
  }, [currentIndex, cardStates, sessionState, deckId, cards.length])

  // Feature 2: Filter cards by concept
  const filterByConcept = (concept: string | null) => {
    setActiveConcept(concept)
    setShowConcepts(false)
    const filtered = concept ? allCards.filter(c => c.concept === concept) : allCards
    setCards(filtered)
    setCurrentIndex(0)
    setSessionState('reviewing')
    clearProgress(deckId) // Clear saved progress when switching concept filter
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (sessionState !== 'reviewing') return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
      const card = cards[currentIndex]
      if (e.key === ' ' && card?.type === 'flashcard' && !cardStates[card._id]?.answered) {
        e.preventDefault()
        revealFlashcard(card._id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cards, currentIndex, cardStates, sessionState])

  const goNext = () => {
    if (currentIndex < cards.length - 1) setCurrentIndex(i => i + 1)
    else if (allAnswered) setSessionState('complete')
  }

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

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

  // Feature 2: unique concepts from full deck
  const allConcepts = [...new Set(allCards.map(c => c.concept || 'General'))]

  const revealFlashcard = (cardId: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { ...(prev[cardId] ?? { answered: false, selectedOption: null, isCorrect: null, rating: null }), answered: false },
    }))
  }

  const handleRate = async (rating: number) => {
    if (submitting || !currentCard) return
    setSubmitting(true)
    const isCorrect = rating >= 2
    setCardStates(prev => ({
      ...prev,
      [currentCard._id]: { answered: true, selectedOption: null, isCorrect, rating },
    }))
    if (isCorrect) {
      const concept = currentCard.concept || 'General'
      setConceptStats(prev => ({
        ...prev,
        [concept]: { ...prev[concept], correct: (prev[concept]?.correct || 0) + 1 },
      }))
    }
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: currentCard._id, deckId, rating }),
      })
    } catch { /* continue */ }
    setSubmitting(false)
    if (hasNext) setTimeout(() => setCurrentIndex(i => i + 1), 400)
    else setTimeout(() => setSessionState('complete'), 400)
  }

  const handleMCQSelect = async (option: string) => {
    if (currentState?.answered || submitting || !currentCard) return
    setSubmitting(true)
    const isCorrect = option === currentCard.correctAnswer
    setCardStates(prev => ({
      ...prev,
      [currentCard._id]: { answered: true, selectedOption: option, isCorrect, rating: isCorrect ? 5 : 1 },
    }))
    if (isCorrect) {
      const concept = currentCard.concept || 'General'
      setConceptStats(prev => ({
        ...prev,
        [concept]: { ...prev[concept], correct: (prev[concept]?.correct || 0) + 1 },
      }))
    }
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: currentCard._id, deckId, rating: isCorrect ? 5 : 1 }),
      })
    } catch { /* continue */ }
    setSubmitting(false)
  }

  const handleRegenerate = async () => {
    setSessionState('regenerating')
    clearProgress(deckId)
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId }),
      })
      if (!res.ok) throw new Error('Regeneration failed')
      await fetchCards(false)
    } catch {
      setSessionState('reviewing')
    }
  }

  const getOptionStyle = (option: string) => {
    if (!currentState?.answered) return 'border-ink-200 bg-white hover:border-ink hover:bg-ink-50 cursor-pointer'
    if (option === currentCard?.correctAnswer) return 'border-green-500 bg-green-50 text-green-800'
    if (option === currentState.selectedOption && option !== currentCard?.correctAnswer) return 'border-red-500 bg-red-50 text-red-800'
    return 'border-ink-100 bg-ink-50 text-ink-300'
  }

  const getConceptLevel = (stat: ConceptStat) => {
    if (stat.total === 0) return { level: 'weak', emoji: '❌', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' }
    const acc = (stat.correct / stat.total) * 100
    if (acc >= 75) return { level: 'strong', emoji: '✅', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' }
    if (acc >= 40) return { level: 'shaky', emoji: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' }
    return { level: 'weak', emoji: '❌', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* LOADING / REGENERATING */}
        {(sessionState === 'loading' || sessionState === 'regenerating') && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            <p className="text-ink-400">{sessionState === 'regenerating' ? 'Generating fresh questions…' : 'Loading your cards…'}</p>
          </div>
        )}

        {/* EMPTY */}
        {sessionState === 'empty' && (
          <div className="text-center py-24 animate-fade-in">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display text-3xl text-ink mb-3">All caught up!</h2>
            <p className="text-ink-400 mb-2">No cards are due for review right now.</p>
            <p className="text-ink-300 text-sm mb-8">{deckStats ? `This deck has ${deckStats.totalCards} cards total.` : ''}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-white border border-ink-200 text-ink rounded-xl font-medium text-sm hover:border-ink-400 transition-colors">← Dashboard</button>
              <button onClick={() => { setSessionState('loading'); fetchCards(false) }} className="px-5 py-2.5 bg-ink text-cream rounded-xl font-medium text-sm hover:bg-accent transition-colors">Review all anyway</button>
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {sessionState === 'complete' && (() => {
          // Feature 4: Group concepts by performance level
          const strong = Object.values(conceptStats).filter(s => s.total > 0 && (s.correct / s.total) >= 0.75)
          const shaky  = Object.values(conceptStats).filter(s => s.total > 0 && (s.correct / s.total) >= 0.40 && (s.correct / s.total) < 0.75)
          const weak   = Object.values(conceptStats).filter(s => s.total === 0 || (s.correct / s.total) < 0.40)

          return (
            <div className="animate-fade-in">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">{accuracy >= 80 ? '🏆' : accuracy >= 50 ? '🙌' : '💪'}</div>
                <h2 className="font-display text-4xl text-ink mb-2">Session complete!</h2>
                <p className="text-ink-400 mb-6">Great work on staying consistent.</p>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                  {[
                    { label: 'Attempted', value: answeredCount },
                    { label: 'Correct', value: correctCount },
                    { label: 'Accuracy', value: `${accuracy}%` },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-ink-100 p-4">
                      <p className="font-display text-2xl text-ink">{s.value}</p>
                      <p className="text-xs text-ink-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature 4: Concept Performance — Strong / Shaky / Weak */}
              {Object.keys(conceptStats).length > 0 && (
                <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-6">
                  <h3 className="font-semibold text-ink mb-5 text-sm uppercase tracking-wide">Concept Performance</h3>

                  {strong.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">✅ Strong Concepts</p>
                      <div className="space-y-1.5">
                        {strong.map(s => (
                          <div key={s.concept} className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                            <span className="text-sm font-medium text-ink">{s.concept}</span>
                            <span className="text-xs text-green-600 font-semibold">{Math.round((s.correct / s.total) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {shaky.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">⚠️ Shaky Concepts</p>
                      <div className="space-y-1.5">
                        {shaky.map(s => (
                          <div key={s.concept} className="flex items-center justify-between px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-lg">
                            <span className="text-sm font-medium text-ink">{s.concept}</span>
                            <span className="text-xs text-yellow-600 font-semibold">{Math.round((s.correct / s.total) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {weak.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">❌ Weak Concepts</p>
                      <div className="space-y-1.5">
                        {weak.map(s => (
                          <div key={s.concept} className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                            <span className="text-sm font-medium text-ink">{s.concept}</span>
                            <button
                              onClick={() => filterByConcept(s.concept)}
                              className="text-xs text-red-500 font-semibold hover:underline"
                            >
                              Practice →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-white border border-ink-200 text-ink rounded-xl font-medium text-sm hover:border-ink-400 transition-colors">← Dashboard</button>
                <button onClick={() => router.push(`/learn/${deckId}`)} className="px-5 py-2.5 bg-white border border-ink-200 text-ink rounded-xl font-medium text-sm hover:border-ink-400 transition-colors">📖 Review Concepts</button>
                <button onClick={() => { clearProgress(deckId); setCardStates({}); setCurrentIndex(0); setActiveConcept(null); setCards(allCards); setSessionState('reviewing') }} className="px-5 py-2.5 bg-ink text-cream rounded-xl font-medium text-sm hover:bg-accent transition-colors">Practice again</button>
              </div>
            </div>
          )
        })()}

        {/* REVIEWING */}
        {sessionState === 'reviewing' && currentCard && currentState && (
          <div className="flex flex-col gap-6 animate-fade-in">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl text-ink">
                  Practice {activeConcept && <span className="text-ink-400 text-lg">· {activeConcept}</span>}
                </h1>
                <p className="text-ink-400 text-sm mt-0.5">
                  {answeredCount} of {cards.length} answered · {correctCount} correct
                </p>
              </div>
              <div className="flex gap-2">
                {/* Feature 2: Concepts button */}
                <button
                  onClick={() => setShowConcepts(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-ink-200 text-ink-500 rounded-xl text-xs font-medium hover:border-ink hover:text-ink transition-colors"
                >
                  🗂️ Concepts
                </button>
              </div>
            </div>

            {/* Feature 2: Concepts panel */}
            {showConcepts && (
              <div className="bg-white rounded-2xl border border-ink-100 shadow-lg p-4 animate-fade-in">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Filter by Concept</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => filterByConcept(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      activeConcept === null
                        ? 'bg-ink text-cream border-ink'
                        : 'bg-white text-ink border-ink-200 hover:border-ink'
                    }`}
                  >
                    All ({allCards.length})
                  </button>
                  {allConcepts.map(concept => {
                    const count = allCards.filter(c => c.concept === concept).length
                    const stat = conceptStats[concept]
                    const { emoji } = stat ? getConceptLevel(stat) : { emoji: '⬜' }
                    return (
                      <button
                        key={concept}
                        onClick={() => filterByConcept(concept)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          activeConcept === concept
                            ? 'bg-ink text-cream border-ink'
                            : 'bg-white text-ink border-ink-200 hover:border-ink'
                        }`}
                      >
                        {emoji} {concept} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full">
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full bg-ink rounded-full transition-all duration-500" style={{ width: `${cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-ink-300">Card {currentIndex + 1} of {cards.length}</span>
                <span className="text-xs text-ink-300">{accuracy > 0 ? `${accuracy}% accuracy` : 'No answers yet'}</span>
              </div>
            </div>

            {/* Dot navigation */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {cards.map((c, i) => {
                const state = cardStates[c._id]
                return (
                  <button key={i} onClick={() => setCurrentIndex(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === currentIndex ? 'w-6 h-2.5 bg-ink' :
                      state?.isCorrect === true ? 'w-2.5 h-2.5 bg-green-500' :
                      state?.isCorrect === false ? 'w-2.5 h-2.5 bg-red-400' :
                      'w-2.5 h-2.5 bg-ink-100'
                    }`}
                  />
                )
              })}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="px-3 py-1 bg-ink-50 text-ink-500 text-xs font-medium rounded-full border border-ink-100">{currentCard.concept}</span>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${difficultyColors[currentCard.difficulty]}`}>{currentCard.difficulty}</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">
                {currentCard.type === 'mcq' ? '🔵 Multiple Choice' : '🟣 Flashcard'}
              </span>
              {currentState.answered && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${currentState.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {currentState.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              )}
            </div>

            {/* ── FLASHCARD ── */}
            {currentCard.type === 'flashcard' && (
              <div className="w-full max-w-2xl mx-auto">
                <div
                  className={`w-full bg-white rounded-2xl border shadow-lg cursor-pointer min-h-[280px] flex flex-col transition-colors ${
                    currentState.answered && currentState.isCorrect === true ? 'border-green-300' :
                    currentState.answered && currentState.isCorrect === false ? 'border-red-300' :
                    'border-ink-100'
                  }`}
                  onClick={() => !currentState.answered && revealFlashcard(currentCard._id)}
                >
                  <div className="px-6 pt-5 pb-3 border-b border-ink-50 flex items-center justify-between">
                    <span className="text-xs font-mono text-ink-300 uppercase tracking-widest">Question</span>
                    {currentState.answered && <span className="text-lg">{currentState.isCorrect ? '✅' : '❌'}</span>}
                  </div>
                  <div className="flex-1 flex items-center justify-center px-8 py-6">
                    <p className="font-display text-xl md:text-2xl text-ink text-center leading-relaxed">{currentCard.question}</p>
                  </div>
                  {!currentState.answered && (
                    <div className="px-6 pb-5 text-center">
                      <p className="text-xs text-ink-300 font-medium">Click to reveal answer ↓</p>
                    </div>
                  )}
                </div>

                {currentState.answered !== undefined && (
                  <div className="mt-4 w-full bg-ink rounded-2xl min-h-[100px] flex flex-col animate-fade-in">
                    <div className="px-6 pt-5 pb-3 border-b border-white/10">
                      <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Answer</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-8 py-5">
                      <p className="font-body text-base md:text-lg text-cream/90 text-center leading-relaxed">{currentCard.answer}</p>
                    </div>
                    {currentCard.explanation && (
                      <div className="px-6 pb-4 text-center">
                        <p className="text-xs text-white/40">{currentCard.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {!currentState.answered && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <button onClick={() => revealFlashcard(currentCard._id)}
                      className="px-8 py-3.5 bg-ink text-cream rounded-xl font-semibold text-sm hover:bg-accent transition-all">
                      Reveal Answer ↓
                    </button>
                    <p className="text-xs text-ink-300">
                      Press <kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono text-ink-400">Space</kbd> to reveal
                    </p>
                  </div>
                )}

                {currentState.answered === false && (
                  <div className="mt-6 w-full">
                    <p className="text-center text-sm text-ink-400 mb-4 font-medium">How well did you recall this?</p>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { value: 1, label: 'Again', emoji: '😞', bg: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600' },
                        { value: 3, label: 'Hard', emoji: '🤔', bg: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700' },
                        { value: 4, label: 'Good', emoji: '🙂', bg: 'bg-ink-50 hover:bg-ink-100 border-ink-200 text-ink' },
                        { value: 5, label: 'Easy', emoji: '😎', bg: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700' },
                      ].map(r => (
                        <button key={r.value} onClick={() => handleRate(r.value)} disabled={submitting}
                          className={`flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border transition-all active:scale-95 ${r.bg} disabled:opacity-50`}>
                          <span className="text-2xl">{r.emoji}</span>
                          <span className="font-semibold text-sm">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MCQ ── */}
            {currentCard.type === 'mcq' && (
              <div className="w-full max-w-2xl mx-auto">
                <div className="w-full bg-white rounded-2xl border border-ink-100 shadow-lg p-6 mb-4">
                  <p className="font-display text-xl md:text-2xl text-ink text-center leading-relaxed">{currentCard.question}</p>
                </div>
                <div className="space-y-3">
                  {currentCard.options.map((option, i) => {
                    const labels = ['A', 'B', 'C', 'D']
                    const style = getOptionStyle(option)
                    const isCorrect = currentState.answered && option === currentCard.correctAnswer
                    const isWrong = currentState.answered && option === currentState.selectedOption && option !== currentCard.correctAnswer
                    return (
                      <button key={i} onClick={() => handleMCQSelect(option)}
                        disabled={currentState.answered || submitting}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all duration-200 font-medium text-sm ${style} disabled:cursor-not-allowed`}>
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          isCorrect ? 'bg-green-500 border-green-500 text-white' :
                          isWrong ? 'bg-red-500 border-red-500 text-white' :
                          'border-current'
                        }`}>
                          {isCorrect ? '✓' : isWrong ? '✗' : labels[i]}
                        </span>
                        <span className="flex-1">{option}</span>
                      </button>
                    )
                  })}
                </div>
                {currentState.answered && currentCard.explanation && (
                  <div className={`mt-4 p-4 rounded-xl border animate-fade-in ${
                    currentState.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide">
                      {currentState.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </p>
                    <p className="text-sm leading-relaxed">{currentCard.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <button onClick={goPrev} disabled={!hasPrev}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-ink-200 text-ink rounded-xl text-sm font-medium hover:border-ink-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                ← Previous
              </button>

              {hasNext ? (
                <button onClick={goNext}
                  className="flex items-center gap-2 px-5 py-3 bg-ink text-cream rounded-xl text-sm font-semibold hover:bg-accent transition-colors">
                  Next →
                </button>
              ) : (
                <button onClick={() => setSessionState('complete')}
                  className="flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Finish →
                </button>
              )}
            </div>

            <p className="text-center text-xs text-ink-300">
              Use <kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono text-ink-400">←</kbd> <kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono text-ink-400">→</kbd> to navigate
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
