import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { type, wpApiUrl, wpApiKey, customApiUrl } = await req.json()

  if (type === 'wordpress') {
    const res = await fetch(`${wpApiUrl}/wp-json/wp/v2/categories?per_page=100`, {
      headers: { Authorization: `Basic ${wpApiKey}` },
    })
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch WP categories' }, { status: 500 })
    const data = await res.json()
    const categories = data.map((c: { id: number; name: string; slug: string }) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }))
    return NextResponse.json({ categories })
  }

  if (type === 'custom') {
    const res = await fetch(`${customApiUrl}/bcm/categories`, {
      headers: { Authorization: `Bearer ${wpApiKey}` },
    })
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch custom categories' }, { status: 500 })
    const categories = await res.json()
    return NextResponse.json({ categories })
  }

  return NextResponse.json({ error: 'Unknown blog type' }, { status: 400 })
}
