import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Dynamic import to avoid edge runtime issues
    const pdfParse = (await import('pdf-parse')).default
    const pdfData = await pdfParse(buffer)

    const text = pdfData.text?.trim()

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Make sure it contains readable text.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      text,
      pages: pdfData.numpages,
      filename: file.name,
      size: file.size,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 })
  }
}
