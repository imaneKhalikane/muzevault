import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60 // seconds

const PROMPT = `You are an expert AI avatar prompt writer for Studio LumAI. You write prompts in a very specific professional style. Study these examples carefully and match the EXACT structure, vocabulary, and level of detail:

=== IMAGE PROMPT EXAMPLES ===

EXAMPLE 1:
Ultra-realistic luxury fashion editorial portrait of a woman at the beach, framed from waist up, shot from a slightly low angle with an immersive, fashion-campaign composition. She wears a sleek black-and-white vertical stripe one-piece swimsuit with a plunging neckline and a sculptural, body-hugging fit. She holds a large red Chanel logo lifebuoy ring above her head with both arms raised, the bold graphic object creating a striking visual frame around her. Her hair is styled in long, wet-look beach waves — dark chestnut brown, slightly damp and gleaming, pulled half-back with loose strands framing her face. Makeup is sun-glam: defined brows, warm copper and terracotta eyeshadow, mascara-lengthened lashes, bronzed and highlighted cheeks, and a warm barely-there lip gloss. Sun-kissed skin with a natural healthy sheen. The background is a hazy, overexposed white beach sky with soft blurred ocean behind her — minimal and fashion-forward.

EXAMPLE 2:
Ultra-realistic, high-fashion selfie of a woman lounging outdoors on a cushioned sunbed, captured from a slightly elevated arm's-length angle. She is reclined with one arm resting behind her head, fingers lightly touching her hair, creating a relaxed yet confident pose. She has long, voluminous dark brunette hair, softly styled, with a warm, bronzed skin tone and natural glam makeup (defined brows, soft contour, nude matte lips, subtle highlight). She wears slim, rectangular dark-tinted sunglasses with thin gold frames, and statement gold sunburst earrings. Lighting is strong natural sunlight casting sharp architectural shadows across her body and the light stone floor behind her, creating contrast and depth. Shot on a 35mm lens, ultra-detailed, 4K realism, natural skin texture (visible pores, no smoothing), warm color grading, editorial influencer aesthetic.

=== MOTION PROMPT EXAMPLES ===

EXAMPLE 1:
15-second ultra-realistic luxury beach editorial video based on the reference image; starts in an extreme close-up of her face — wet skin, blinking between flashes, subtle jaw movement — cut to macro details: water droplets on her collarbone, fingers gripping the lifebuoy texture, strands of wet hair against her cheek; jump to a tight mid shot where hair and makeup quickly enter frame to adjust her hair and tap her cheek, then step out; transition to a slow push-in close-up as she lowers the lifebuoy slightly and shifts her gaze off-camera; cut to a wide full-body shot revealing the full beach environment; then a tracking side shot of her walking along the water; add a low angle shot looking up at her against the sky for power and scale; finish with a zoom-out or drone-style pullback; style is Vogue editorial meets behind-the-scenes realism, 4K detail, natural sunlight, visible skin texture, slight handheld imperfections, ambient waves with shutter clicks fading out, no dialogue.

EXAMPLE 2:
Ultra-realistic POV selfie video of the woman lounging on a luxury sun bed. She looks directly into the lens with confident, engaging energy, subtle smile, natural hand movement. Ultra-realistic facial expressions, clean lip sync, 4K realism, editorial influencer aesthetic.

=== YOUR TASK ===

Now analyze the provided image and write:

1. IMAGE PROMPT rules to follow:
- Always start with "Ultra-realistic"
- Describe framing and camera angle first
- Then outfit in detail (fabric, fit, color, neckline)
- Then hair (length, color, texture, style)
- Then makeup (brows, eyes, lips, skin)
- Then lighting and background
- End with: shot on 35mm lens, 4K realism, natural skin texture, editorial aesthetic
- Use em dashes (—) for flow like the examples
- Be very specific about colors and textures

2. MOTION PROMPT rules to follow:
- Always specify duration (10-15 seconds)
- Describe camera movements: close-up → mid shot → wide
- Include micro details: skin texture, hair movement, fabric movement
- Include mood and style reference
- End with: 4K realism, natural lighting, editorial aesthetic
- Match the cinematic, editorial Vogue style

Return ONLY this JSON, no other text:
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
      max_tokens: 2048,
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
