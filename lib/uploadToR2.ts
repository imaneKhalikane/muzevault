import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from './r2'

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  )

  return `${R2_PUBLIC_URL}/${key}`
}
