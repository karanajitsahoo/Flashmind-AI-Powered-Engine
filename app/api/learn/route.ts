import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { LearningCard } from '@/models/LearningCard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deckId = searchParams.get('deckId')

    if (!deckId) return NextResponse.json({ error: 'deckId required' }, { status: 400 })

    await connectDB()

    console.log("Fetching learning cards for deckId:", deckId)

    const cards = await LearningCard.find({ deckId: deckId.toString() })
      .sort({ order: 1 })
      .lean()

    console.log("Learning cards found:", cards.length)

    return NextResponse.json({
      cards: cards.map(c => ({ ...c, _id: c._id.toString() })),
    })
  } catch (err) {
    console.error('Learn GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch learning cards' }, { status: 500 })
  }
}
