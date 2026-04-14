'use client'

interface ReviewButtonsProps {
  onRate: (rating: number) => void
  disabled?: boolean
  visible: boolean
}

const ratings = [
  { value: 1, label: 'Again', emoji: '😞', description: 'Total blank', bg: 'bg-rose-light hover:bg-rose-50 border-rose-soft/30', text: 'text-rose-soft' },
  { value: 3, label: 'Hard', emoji: '🤔', description: 'Got it, barely', bg: 'bg-amber-light hover:bg-amber-50 border-amber-soft/30', text: 'text-amber-soft' },
  { value: 4, label: 'Good', emoji: '🙂', description: 'Correct with effort', bg: 'bg-ink-50 hover:bg-ink-100 border-ink-200', text: 'text-ink' },
  { value: 5, label: 'Easy', emoji: '😎', description: 'Perfect recall', bg: 'bg-jade-light hover:bg-jade/10 border-jade/30', text: 'text-jade' },
]

export default function ReviewButtons({ onRate, disabled, visible }: ReviewButtonsProps) {
  if (!visible) return null

  return (
    <div className="animate-slide-up w-full max-w-2xl">
      <p className="text-center text-sm text-ink-400 mb-4 font-medium">How well did you recall this?</p>
      <div className="grid grid-cols-4 gap-3">
        {ratings.map(r => (
          <button
            key={r.value}
            onClick={() => onRate(r.value)}
            disabled={disabled}
            className={`flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border transition-all duration-150 active:scale-95 ${r.bg} ${r.text} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-2xl leading-none">{r.emoji}</span>
            <span className="font-semibold text-sm">{r.label}</span>
            <span className="text-xs opacity-60 hidden md:block text-center">{r.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
