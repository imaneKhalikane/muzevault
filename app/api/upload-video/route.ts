import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/uploadToR2'

export const maxDuration = 60

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
const MAX_SIZE = 500 * 1024 * 1024 // 500 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    // Allow any video/* type generously
    if (!file.type.startsWith('video/') && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed. Use MP4, MOV, or WEBM.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 500 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2(buffer, file.name, file.type)

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[upload-video]', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
