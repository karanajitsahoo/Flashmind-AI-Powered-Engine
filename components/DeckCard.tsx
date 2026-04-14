'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface DeckCardProps {
  id: string
  title: string
  totalCards: number
  dueCount: number
  accuracy: number | null
  lastReviewedAt?: string
  createdAt: string
  onDelete: (id: string) => void
}

export default function DeckCard({
  id, title, totalCards, dueCount, accuracy, lastReviewedAt, createdAt, onDelete
}: DeckCardProps) {
  const lastReviewed = lastReviewedAt
    ? formatDistanceToNow(new Date(lastReviewedAt), { addSuffix: true })
    : 'Never reviewed'

  const created = formatDistanceToNow(new Date(createdAt), { addSuffix: true })

  return (
    <div className="group bg-white rounded-2xl border border-ink-100 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
      {/* Due indicator stripe */}
      {dueCount > 0 && (
        <div className="h-1 bg-accent" />
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="font-display text-lg text-ink leading-tight line-clamp-2 flex-1">
            {title}
          </h3>
          <button
            onClick={() => onDelete(id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-light text-ink-300 hover:text-rose-soft shrink-0"
            title="Delete deck"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="text-center">
            <p className="text-2xl font-display text-ink">{totalCards}</p>
            <p className="text-xs text-ink-400">cards</p>
          </div>
          <div className="w-px h-8 bg-ink-100" />
          <div className="text-center">
            <p className={`text-2xl font-display ${dueCount > 0 ? 'text-accent' : 'text-ink-300'}`}>{dueCount}</p>
            <p className="text-xs text-ink-400">due</p>
          </div>
          {accuracy !== null && (
            <>
              <div className="w-px h-8 bg-ink-100" />
              <div className="text-center">
                <p className="text-2xl font-display text-ink">{accuracy}%</p>
                <p className="text-xs text-ink-400">accuracy</p>
              </div>
            </>
          )}
        </div>

        {/* Meta */}
        <p className="text-xs text-ink-300 mb-4">
          {lastReviewedAt ? `Reviewed ${lastReviewed}` : `Created ${created}`}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/learn/${id}`}
            className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 bg-ink-50 text-ink hover:bg-ink-100 border border-ink-200"
          >
            📖 Learn
          </Link>
          <Link
            href={`/review/${id}`}
            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              dueCount > 0
                ? 'bg-ink text-cream hover:bg-accent'
                : 'bg-ink-50 text-ink-400 hover:bg-ink-100'
            }`}
          >
            {dueCount > 0 ? `✏️ Practice` : '✏️ Practice'}
          </Link>
        </div>
      </div>
    </div>
  )
}
