'use client'

import { useState } from 'react'

interface FlashcardProps {
  question: string
  answer: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  cardNumber: number
  totalCards: number
}

const difficultyColors = {
  easy: 'bg-jade-light text-jade',
  medium: 'bg-amber-light text-amber-soft',
  hard: 'bg-rose-light text-rose-soft',
}

export default function Flashcard({
  question,
  answer,
  topic,
  difficulty,
  cardNumber,
  totalCards,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => setIsFlipped(f => !f)

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Card counter */}
      <div className="flex items-center gap-3 text-sm text-ink-400">
        <span className="font-mono">{cardNumber}</span>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(totalCards, 20) }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i < cardNumber ? 'w-3 bg-ink' : i === cardNumber - 1 ? 'w-4 bg-accent' : 'w-3 bg-ink-200'
              }`}
            />
          ))}
          {totalCards > 20 && <span className="text-ink-300 ml-1">+{totalCards - 20}</span>}
        </div>
        <span className="font-mono">{totalCards}</span>
      </div>

      {/* Topic + difficulty badges */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-ink-50 text-ink-500 text-xs font-medium rounded-full border border-ink-100">
          {topic}
        </span>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${difficultyColors[difficulty]}`}>
          {difficulty}
        </span>
      </div>

      {/* 3D Flip Card */}
      <div
        className="perspective w-full max-w-2xl cursor-pointer"
        style={{ height: '320px' }}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? handleFlip() : null}
        aria-label={isFlipped ? 'Showing answer. Click to see question.' : 'Showing question. Click to reveal answer.'}
      >
        <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Front - Question */}
          <div className="card-face bg-white shadow-flashcard border border-ink-100 flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-ink-50">
              <span className="text-xs font-mono text-ink-300 uppercase tracking-widest">Question</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-ink-100" />
                <div className="w-2.5 h-2.5 rounded-full bg-ink-100" />
                <div className="w-2.5 h-2.5 rounded-full bg-ink-100" />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-8 py-6">
              <p className="font-display text-xl md:text-2xl text-ink text-center leading-relaxed">
                {question}
              </p>
            </div>
            <div className="px-6 pb-5 text-center">
              <p className="text-xs text-ink-300 font-medium">Click to reveal answer ↓</p>
            </div>
          </div>

          {/* Back - Answer */}
          <div className="card-face card-back bg-ink flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-white/10">
              <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Answer</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-8 py-6">
              <p className="font-body text-base md:text-lg text-cream/90 text-center leading-relaxed">
                {answer}
              </p>
            </div>
            <div className="px-6 pb-5 text-center">
              <p className="text-xs text-white/30 font-medium">Rate your recall below</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
