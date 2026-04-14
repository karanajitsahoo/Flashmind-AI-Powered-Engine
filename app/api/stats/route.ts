import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ReviewLog } from '@/models/ReviewLog'
import { Flashcard } from '@/models/Flashcard'
import { Deck } from '@/models/Deck'

export const runtime = 'nodejs'

function buildDailyActivity(logs: { reviewedAt: Date; wasCorrect: boolean }[], daysBack: number) {
  const activity: Record<string, { questionsSolved: number; correct: number }> = {}
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    activity[key] = { questionsSolved: 0, correct: 0 }
  }
  for (const log of logs) {
    const key = new Date(log.reviewedAt).toISOString().split('T')[0]
    if (activity[key]) {
      activity[key].questionsSolved++
      if (log.wasCorrect) activity[key].correct++
    }
  }
  return Object.entries(activity).map(([date, data]) => ({ date, ...data }))
}

function buildMonthlyActivity(logs: { reviewedAt: Date; wasCorrect: boolean }[], monthsBack: number) {
  const activity: Record<string, { questionsSolved: number; correct: number }> = {}
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    activity[key] = { questionsSolved: 0, correct: 0 }
  }
  for (const log of logs) {
    const d = new Date(log.reviewedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (activity[key]) {
      activity[key].questionsSolved++
      if (log.wasCorrect) activity[key].correct++
    }
  }
  return Object.entries(activity).map(([date, data]) => ({ date, ...data }))
}

function buildYearlyActivity(logs: { reviewedAt: Date; wasCorrect: boolean }[]) {
  const activity: Record<string, { questionsSolved: number; correct: number }> = {}
  for (const log of logs) {
    const key = String(new Date(log.reviewedAt).getFullYear())
    if (!activity[key]) activity[key] = { questionsSolved: 0, correct: 0 }
    activity[key].questionsSolved++
    if (log.wasCorrect) activity[key].correct++
  }
  return Object.entries(activity).sort().map(([date, data]) => ({ date, ...data }))
}

export async function GET() {
  try {
    await connectDB()

    const totalDecks = await Deck.countDocuments({ userId: 'default' })
    const totalCards = await Flashcard.countDocuments()
    const totalReviews = await ReviewLog.countDocuments()
    const correctReviews = await ReviewLog.countDocuments({ wasCorrect: true })
    const now = new Date()
    const dueCards = await Flashcard.countDocuments({ nextReviewDate: { $lte: now } })

    // Fetch logs for different windows
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const allRecentLogs = await ReviewLog.find({ reviewedAt: { $gte: oneYearAgo } }).lean()

    const daily7 = buildDailyActivity(allRecentLogs, 7)
    const daily30 = buildDailyActivity(allRecentLogs, 30)
    const monthly12 = buildMonthlyActivity(allRecentLogs, 12)
    const yearly = buildYearlyActivity(allRecentLogs)

    // Streak (based on 7-day daily)
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    for (const day of [...daily7].reverse()) {
      if (day.questionsSolved > 0) streak++
      else if (day.date !== today) break
    }

    return NextResponse.json({
      totalDecks,
      totalCards,
      totalReviews,
      correctReviews,
      dueCards,
      accuracy: totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0,
      streak,
      // Legacy field (dashboard bar chart)
      dailyActivity: daily7.map(d => ({ date: d.date, reviews: d.questionsSolved, correct: d.correct })),
      // New activity stats for line graph
      activityStats: {
        daily: daily7,
        weekly: daily30,   // 30 individual days = ~4 weeks
        monthly: monthly12,
        yearly,
      },
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
