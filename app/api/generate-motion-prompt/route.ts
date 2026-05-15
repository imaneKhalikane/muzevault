import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

function buildPrompt(imagePrompt: string): string {
  return `You are an expert motion prompt writer for Studio LumAI. Based on this image and its image prompt below, write a cinematic motion prompt following this exact style:

Image prompt: ${imagePrompt}

MOTION PROMPT STYLE EXAMPLE:
15-second ultra-realistic luxury beach editorial video based on the reference image; starts in an extreme close-up of her face — wet skin, blinking between flashes, subtle jaw movement — cut to macro details: water droplets on her collarbone, fingers gripping texture, strands of wet hair against her cheek; transition to a slow push-in close-up as she shifts her gaze off-camera; cut to a wide full-body shot; finish with a zoom-out or drone-style pullback; style is Vogue editorial meets behind-the-scenes realism, 4K detail, natural lighting, visible skin texture, slight handheld imperfections, no dialogue.

RULES:
- Always specify duration (10-15 seconds)
- Start with extreme close-up details
- Progress from close to wide shots
- Include micro details: skin, hair, fabric movement
- End with 4K realism, editorial aesthetic
- Match Vogue editorial cinematic style
- Return ONLY the motion prompt text, no JSON needed`
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
  }

  let imageData: string
  let mimeType: string
  let imagePrompt: string

  try {
    const body = await req.json()
    imageData = body.imageData
    mimeType = body.mimeType ?? 'image/jpeg'
    imagePrompt = body.imagePrompt ?? ''
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
            { type: 'text', text: buildPrompt(imagePrompt) },
          ],
        },
      ],
    }),
  })

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('[generate-motion-prompt] Anthropic error:', errText)
    return NextResponse.json({ error: `Anthropic API error: ${anthropicRes.status}` }, { status: 500 })
  }

  const data = await anthropicRes.json()
  const motionPrompt: string = data.content?.[0]?.text?.trim() ?? ''

  return NextResponse.json({ motion_prompt: motionPrompt })
}
