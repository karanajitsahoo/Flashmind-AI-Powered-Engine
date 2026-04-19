import connectDB from '@/lib/mongodb'
import Deck from '@/models/Deck'

export async function GET() {
  await connectDB()

  const decks = await Deck.find({ isSample: true })

  return Response.json({ decks })
}