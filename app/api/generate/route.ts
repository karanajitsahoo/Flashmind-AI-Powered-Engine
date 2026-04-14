import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { generateFlashcardsFromChunk, generateDeckTitle, generateLearningCards } from '@/lib/groq'
import { chunkText, getDefaultSM2 } from '@/lib/spacedRepetition'
import { Deck } from '@/models/Deck'
import { Flashcard } from '@/models/Flashcard'
import { LearningCard } from '@/models/LearningCard'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const { text, filename } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text content required' }, { status: 400 })
    }

    await connectDB()

    const title = await generateDeckTitle(text)

    const deck = await Deck.create({
      userId: 'default',
      title,
      description: `Generated from ${filename ?? 'PDF'}`,
      tags: [],
      totalCards: 0,
    })

    const deckId = deck._id.toString()

    // ── Run both generators in parallel ──────────────────────────────────────
    const chunks = chunkText(text)

    if (chunks.length === 0) {
      await Deck.findByIdAndDelete(deck._id)
      return NextResponse.json({ error: 'No processable content found' }, { status: 422 })
    }

    // Practice cards (chunked)
    const allPracticeCards: {
      type: string; question: string; answer: string; options: string[]
      correctAnswer: string; explanation: string; difficulty: string
      concept: string; topic: string; tags: string[]
    }[] = []

    for (let i = 0; i < chunks.length; i++) {
      try {
        const cards = await generateFlashcardsFromChunk(chunks[i], i, chunks.length)
        allPracticeCards.push(...cards)
      } catch (err) {
        console.error(`Error processing chunk ${i}:`, err)
      }
    }

    // Learning cards (whole text)
    let learningCardsRaw = await generateLearningCards(text)

    if (allPracticeCards.length === 0 && learningCardsRaw.length === 0) {
      await Deck.findByIdAndDelete(deck._id)
      return NextResponse.json({ error: 'Failed to generate content. Please try again.' }, { status: 500 })
    }

    // ── Deduplicate practice cards ────────────────────────────────────────────
    const seen = new Set<string>()
    const uniquePractice = allPracticeCards.filter(card => {
      const key = card.question.toLowerCase().slice(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // ── Insert practice flashcards ────────────────────────────────────────────
    const defaults = getDefaultSM2()
    if (uniquePractice.length > 0) {
      await Flashcard.insertMany(
        uniquePractice.map(card => ({
          deckId,
          type: card.type === 'mcq' ? 'mcq' : 'flashcard',
          question: card.question,
          answer: card.answer,
          options: Array.isArray(card.options) ? card.options : [],
          correctAnswer: card.correctAnswer || card.answer,
          explanation: card.explanation || '',
          difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
          concept: card.concept || 'General',
          topic: card.topic || card.concept || 'General',
          tags: Array.isArray(card.tags) ? card.tags : [],
          ...defaults,
        }))
      )
    }

    // ── Insert learning cards ─────────────────────────────────────────────────
    if (learningCardsRaw.length > 0) {
      await LearningCard.insertMany(
        learningCardsRaw.map((card, i) => ({
          deckId,
          title: card.title,
          content: card.content,
          example: card.example || '',
          difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
          concept: card.concept || 'General',
          order: i,
        }))
      )
    }

    await Deck.findByIdAndUpdate(deck._id, { totalCards: uniquePractice.length })

    // ── Build conceptSummary ──────────────────────────────────────────────────
    const conceptMap: Record<string, number> = {}
    for (const card of uniquePractice) {
      const c = card.concept || 'General'
      conceptMap[c] = (conceptMap[c] || 0) + 1
    }
    const conceptSummary = Object.entries(conceptMap).map(([concept, total]) => ({
      concept, totalQuestions: total, correctAnswers: 0, accuracy: 0, level: 'weak',
    }))

    return NextResponse.json({
      deckId,
      title,
      cardCount: uniquePractice.length,
      learningCardCount: learningCardsRaw.length,
      conceptSummary,
      overallStats: { totalQuestions: uniquePractice.length, attempted: 0, correct: 0, accuracy: 0 },
    })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 })
  }
}
