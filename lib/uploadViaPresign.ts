/**
 * Upload a file directly from the browser to Cloudflare R2 using a presigned URL.
 * Flow: Browser → /api/r2-presign (get URL) → PUT directly to R2 (no Vercel size limit)
 */
export async function uploadViaPresign(file: File): Promise<string> {
  // Step 1: Get a presigned PUT URL from our API
  const res = await fetch('/api/r2-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  })
  const { presignedUrl, publicUrl, error } = await res.json()
  if (!res.ok || error) throw new Error(error ?? 'Failed to get upload URL')

  // Step 2: PUT the file directly to R2 — bypasses Vercel entirely
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!uploadRes.ok) throw new Error(`R2 upload failed: ${uploadRes.status}`)

  // Step 3: Return the permanent public URL
  return publicUrl
}
