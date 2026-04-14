import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Flashcard } from '@/models/Flashcard'
import { ReviewLog } from '@/models/ReviewLog'
import { Deck } from '@/models/Deck'
import { calculateNextReview } from '@/lib/spacedRepetition'

export const runtime = 'nodejs'

// GET /api/review?deckId=xxx — get due cards
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deckId = searchParams.get('deckId')

    if (!deckId) return NextResponse.json({ error: 'deckId required' }, { status: 400 })

    await connectDB()

    const now = new Date()
    const fetchAll = searchParams.get('all') === 'true'

    // If ?all=true, return all cards (for resume/concept-filter mode)
    // Otherwise only return cards due for spaced repetition
    const query: Record<string, unknown> = { deckId }
    if (!fetchAll) query.nextReviewDate = { $lte: now }

    // Get cards due for review (sorted by most overdue first)
    const cards = await Flashcard.find(query)
      .sort({ nextReviewDate: 1 })
      .limit(200)
      .lean()

      const mcqs = cards.filter(card =>
  Array.isArray(card.options) && card.options.length >= 2
)

    // Also get stats
    const totalCards = await Flashcard.countDocuments({ deckId })
    const totalReviews = await ReviewLog.countDocuments({ deckId })
    const correctReviews = await ReviewLog.countDocuments({ deckId, wasCorrect: true })

    return NextResponse.json({
    cards: mcqs.map(c => ({ ...c, _id: c._id.toString() })),
    stats: {
    dueCount: mcqs.length,
    totalCards,
    accuracy: totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0,
      },
    })
  } catch (err) {
    console.error('Review GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
  }
}

// POST /api/review — submit a rating
export async function POST(req: NextRequest) {
  try {
    const { flashcardId, deckId, rating } = await req.json()

    if (!flashcardId || !deckId || rating === undefined) {
      return NextResponse.json({ error: 'flashcardId, deckId, and rating required' }, { status: 400 })
    }

    if (rating < 0 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 0-5' }, { status: 400 })
    }

    await connectDB()

    const card = await Flashcard.findById(flashcardId)
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

    const result = calculateNextReview(
      {
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
        nextReviewDate: card.nextReviewDate,
      },
      rating
    )

    // Update card with new SM-2 values
    await Flashcard.findByIdAndUpdate(flashcardId, {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReviewDate: result.nextReviewDate,
    })

    // Log the review
    await ReviewLog.create({
      flashcardId,
      deckId,
      rating,
      wasCorrect: result.wasCorrect,
      reviewedAt: new Date(),
    })

    // Update deck's last reviewed time
    await Deck.findByIdAndUpdate(deckId, { lastReviewedAt: new Date() })

    return NextResponse.json({
      success: true,
      nextReviewDate: result.nextReviewDate,
      interval: result.interval,
      wasCorrect: result.wasCorrect,
    })
  } catch (err) {
    console.error('Review POST error:', err)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
