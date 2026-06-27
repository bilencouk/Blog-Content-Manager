import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
  try {
    const { title, excerpt } = await req.json()

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    const imagePrompt = `A high-quality photorealistic cover image for a blog article titled "${title}". ${excerpt ? `The article is about: ${excerpt}` : ''} Editorial style, suitable for a professional blog header. Absolutely no text, words, letters, numbers, watermarks, or captions anywhere in the image. Photorealistic, well-lit, sharp focus.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: imagePrompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    })

    const parts = response.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'))

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json({ error: 'No image was returned by Gemini' }, { status: 500 })
    }

    const mimeType = imagePart.inlineData.mimeType ?? 'image/png'
    return NextResponse.json({ imageBase64: `data:${mimeType};base64,${imagePart.inlineData.data}` })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate/image]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
