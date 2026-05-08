import { NextRequest, NextResponse } from 'next/server'

// Increase body size limit to handle base64-encoded images
export const maxDuration = 60 // seconds

const PROMPT = `Look at this AI avatar image carefully. Generate:
1. An IMAGE PROMPT: A detailed text-to-image prompt that would recreate this exact image. Include: lighting, composition, style, outfit, setting, mood, camera angle. Make it detailed and specific.
2. A MOTION PROMPT: A video motion prompt for Seedance/Kling AI to animate this image. Describe subtle natural movements: head tilt, breathing, eye movement, hair movement, background motion.

Return ONLY a JSON object like this, no other text:
{
  "image_prompt": "...",
  "motion_prompt": "..."
}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
  }

  let imageData: string
  let mimeType: string

  try {
    const body = await req.json()
    imageData = body.imageData
    mimeType = body.mimeType ?? 'image/jpeg'
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!imageData) {
    return NextResponse.json({ error: 'imageData is required' }, { status: 400 })
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageData },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  })

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('[generate-prompts] Anthropic API error:', errText)
    return NextResponse.json({ error: `Anthropic API error: ${anthropicRes.status}` }, { status: 500 })
  }

  const data = await anthropicRes.json()
  const text: string = data.content?.[0]?.text ?? ''

  // Extract the JSON object from the response (Claude sometimes adds extra text)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    console.error('[generate-prompts] Could not find JSON in response:', text)
    return NextResponse.json({ error: 'Could not parse AI response', raw: text }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(match[0])
    return NextResponse.json({
      image_prompt: parsed.image_prompt ?? '',
      motion_prompt: parsed.motion_prompt ?? '',
    })
  } catch {
    return NextResponse.json({ error: 'JSON parse failed', raw: text }, { status: 500 })
  }
}
