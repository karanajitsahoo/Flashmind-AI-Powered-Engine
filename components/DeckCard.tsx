'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'


interface DeckCardProps {
  id: string
  title: string
  totalCards: number
  dueCount: number
  accuracy: number | null
  progress?: number
  lastReviewedAt?: string
  createdAt: string
  onDelete: (id: string) => void

  strong: number
  shaky: number
  weak: number
}

export default function DeckCard({
  id, title, totalCards, dueCount, accuracy, lastReviewedAt, createdAt, onDelete, strong,
  shaky, weak
}: DeckCardProps) {
  const lastReviewed = lastReviewedAt
    ? formatDistanceToNow(new Date(lastReviewedAt), { addSuffix: true })
    : 'Never reviewed'

  const created = formatDistanceToNow(new Date(createdAt), { addSuffix: true })

  return (
    <div className="group bg-[#EDE2CC] border font-sans border-[#1C3D2E]/20 transition-colors rounded-sm duration-150 hover:bg-[#E6DAC2]">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-serif text-xl text-[#1C3D2E] leading-tight line-clamp-2 flex-1">
            {title}
          </h3>
          <button
            onClick={() => onDelete(id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#1C3D2E]/40 hover:text-rose-500 shrink-0"
            title="Delete deck"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center font-sans gap-6 mb-3">
          <p className="text-xs text-[#1C3D2E]/50 mb-3">
            {totalCards} cards · {lastReviewedAt ? `Last studied ${lastReviewed}` : `Created ${created}`}
          </p>
          {accuracy !== null && (
            <>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-5 font-sans">
          {/* Progress bar */}
          <div className="w-full h-1 bg-[#1C3D2E]/20">
            <div
              className="h-1 bg-[#1C3D2E]"
              style={{ width: `${totalCards > 0 ? ((totalCards - dueCount) / totalCards) * 100 : 0}%` }}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between text-xs text-[#1C3D2E]/50 mt-1">
            <span>{accuracy ?? 0}% complete</span>
            <span>{dueCount} due</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/learn/${id}`}
            className="flex-1 text-center py-2 text-xs uppercase font-sans tracking-widest hover:bg-[#1C3D2E]/90 border border-[#1C3D2E]/30 rounded text-[#EDE2CC] bg-[#1C3D2E]/100 transition"
          >
            Learn
          </Link>
          <Link
            href={`/review/${id}`}
            className={`flex-1 text-center py-2 text-xs uppercase tracking-widest rounded border transition ${dueCount > 0
              ? 'border-[#1C3D2E] text-[#1C3D2E] hover:bg-[#1C3D2E]/10'
              : 'border-[#1C3D2E]/20 text-[#1C3D2E]/40'
              }`}
          >
            {dueCount > 0 ? `Practice` : 'Practice'}
          </Link>
        </div>
      </div>
    </div>
  )
}
