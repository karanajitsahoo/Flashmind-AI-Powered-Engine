import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Deck } from '@/models/Deck'
import { Flashcard } from '@/models/Flashcard'
import { ReviewLog } from '@/models/ReviewLog'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await connectDB()

    const decks = await Deck.find({ userId: 'default' }).sort({ createdAt: -1 }).lean()

    const now = new Date()

    const decksWithStats = await Promise.all(
      decks.map(async (deck) => {
      const deckId = (deck._id as any).toString()

        const dueCount = await Flashcard.countDocuments({
          deckId,
          nextReviewDate: { $lte: now },
        })

        const totalReviews = await ReviewLog.countDocuments({ deckId })
        const correctReviews = await ReviewLog.countDocuments({ deckId, wasCorrect: true })

        return {
          ...deck,
          _id: deckId,
          dueCount,
          accuracy: totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : null,
        }
      })
    )

    return NextResponse.json({ decks: decksWithStats })
  } catch (err) {
    console.error('Decks GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch decks' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deckId = searchParams.get('id')

    if (!deckId) return NextResponse.json({ error: 'Missing deck ID' }, { status: 400 })

    await connectDB()
    await Deck.findByIdAndDelete(deckId)
    await Flashcard.deleteMany({ deckId })
    await ReviewLog.deleteMany({ deckId })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Decks DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 })
  }
}
