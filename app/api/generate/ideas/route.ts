import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { blogName, blogDescription } = await req.json()

  const prompt = `You manage a blog called "${blogName}".

Blog description: ${blogDescription}

Generate 8 article ideas for this blog. Each idea needs a punchy, specific title — no vague or generic titles. Think about what a reader would actually search for or share.

Respond ONLY with a JSON array of objects. Each object must have:
- "title": the article title (string)
- "description": 1-2 sentences explaining the angle and what the reader gets from reading it (string)

No extra text, no markdown, just the JSON array.`

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'DeepSeek request failed' }, { status: 500 })
  }

  const data = await res.json()
  const raw = data.choices[0].message.content.trim()

  try {
    const ideas = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json({ ideas })
  } catch {
    return NextResponse.json({ error: 'Failed to parse ideas', raw }, { status: 500 })
  }
}
