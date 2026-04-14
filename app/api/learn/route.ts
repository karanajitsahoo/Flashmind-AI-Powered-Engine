import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { LearningCard } from '@/models/LearningCard'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deckId = searchParams.get('deckId')

    if (!deckId) return NextResponse.json({ error: 'deckId required' }, { status: 400 })

    await connectDB()

    const cards = await LearningCard.find({ deckId }).sort({ order: 1 }).lean()

    return NextResponse.json({
      cards: cards.map(c => ({ ...c, _id: c._id.toString() })),
    })
  } catch (err) {
    console.error('Learn GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch learning cards' }, { status: 500 })
  }
}
