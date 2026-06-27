import { NextRequest, NextResponse } from 'next/server'

const STOP_SLOP_RULES = `
Writing rules — follow every one of these without exception:
- Active voice only. Every sentence needs a human subject doing something.
- No filler phrases: no "it's important to note", "in today's world", "in conclusion", "at the end of the day", "when it comes to", "the fact that", "needless to say", "it goes without saying".
- No adverbs. Cut them entirely.
- No passive constructions. No inanimate objects performing human actions.
- Be specific. Name the specific thing. No vague declaratives.
- Vary rhythm. Mix sentence lengths. Two items beat three.
- No em-dashes.
- No rhetorical questions.
- No pull-quotes or punchy one-liners designed to be shared.
- No throat-clearing openers. Start with substance.
- Trust readers. State facts directly. Skip softening and hand-holding.
- No binary contrasts ("not X, it's Y"). State Y directly.
`

export async function POST(req: NextRequest) {
  const { title, description, blogName, blogDescription, categories } = await req.json()

  const categoryList = categories?.length
    ? `Choose one category from this list: ${categories.map((c: { name: string }) => c.name).join(', ')}`
    : 'Suggest an appropriate category name'

  const prompt = `You are writing a blog article for "${blogName}".

Blog context: ${blogDescription}

Article brief:
- Title hint: ${title}
${description ? `- Additional notes: ${description}` : ''}

${STOP_SLOP_RULES}

Write the full article. Then respond ONLY with a JSON object containing these fields:
- "title": the final article title (string)
- "excerpt": a 1-2 sentence excerpt that makes readers want to keep reading (no spoilers, no "in this article") (string)
- "body": the full article body in clean HTML — use <h2>, <h3>, <p>, <ul>, <ol>, <strong> tags. No inline styles. (string)
- "keywords": 5-8 SEO keywords as an array of strings (array)
- "category": ${categoryList} (string)

No extra text, no markdown wrapper, just the JSON object.`

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'DeepSeek request failed' }, { status: 500 })
  }

  const data = await res.json()
  const raw = data.choices[0].message.content.trim()

  try {
    const post = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json({ post })
  } catch {
    return NextResponse.json({ error: 'Failed to parse post', raw }, { status: 500 })
  }
}
