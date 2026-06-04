import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType } = await req.json()

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 })
    }

    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
    const publicUrl = `${R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ presignedUrl, publicUrl, key })
  } catch (err) {
    console.error('[r2-presign]', err)
    return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 })
  }
}
