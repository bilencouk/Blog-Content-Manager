import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Blog } from '@/lib/types'

function isBase64DataUrl(s: string) {
  return s?.startsWith('data:')
}

export async function POST(req: NextRequest) {
  try {
    const { blogId, post } = await req.json()

    // Always fetch fresh blog data from Supabase — never trust client-sent credentials
    const supabase = await createClient()
    const { data: blogData, error: blogError } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single()

    if (blogError || !blogData) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const blog = blogData as Blog

    if (blog.type === 'wordpress') {
      let featuredMediaId: number | undefined

      if (post.cover_image_url) {
        try {
          let imgBuffer: ArrayBuffer
          if (isBase64DataUrl(post.cover_image_url)) {
            const base64 = post.cover_image_url.split(',')[1]
            imgBuffer = Buffer.from(base64, 'base64').buffer
          } else {
            imgBuffer = await fetch(post.cover_image_url).then((r) => r.arrayBuffer())
          }
          const mediaRes = await fetch(`${blog.wp_api_url}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${blog.wp_api_key}`,
              'Content-Disposition': `attachment; filename="cover.png"`,
              'Content-Type': 'image/png',
            },
            body: imgBuffer,
          })
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json()
            featuredMediaId = mediaData.id
          }
        } catch {
          // image upload failed — continue without featured media
        }
      }

      const payload: Record<string, unknown> = {
        title: post.title,
        excerpt: post.excerpt,
        content: post.body,
        status: 'publish',
        categories: post.category_id ? [post.category_id] : [],
        tags: [],
      }

      if (featuredMediaId) payload.featured_media = featuredMediaId

      if (post.keywords?.length) {
        const tagIds: number[] = []
        for (const kw of post.keywords) {
          const tagRes = await fetch(`${blog.wp_api_url}/wp-json/wp/v2/tags`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${blog.wp_api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: kw }),
          })
          if (tagRes.ok) {
            const tagData = await tagRes.json()
            tagIds.push(tagData.id)
          }
        }
        if (tagIds.length) payload.tags = tagIds
      }

      const res = await fetch(`${blog.wp_api_url}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${blog.wp_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        let msg = `WordPress publish failed (HTTP ${res.status})`
        try {
          const parsed = JSON.parse(text)
          const code = parsed.code ? `[${parsed.code}] ` : ''
          msg = `${code}${parsed.message || msg}`
        } catch { msg = text || msg }
        console.error('[publish/wordpress] status:', res.status, 'body:', text.slice(0, 500))
        return NextResponse.json({ error: msg }, { status: 500 })
      }

      const data = await res.json()
      return NextResponse.json({ url: data.link })
    }

    if (blog.type === 'custom') {
      const token = blog.wp_api_key ?? ''

      // Upload base64 cover image to remote S3 via bcm/upload endpoint
      let coverImageUrl = post.cover_image_url || null
      if (coverImageUrl && isBase64DataUrl(coverImageUrl)) {
        try {
          const mimeMatch = coverImageUrl.match(/^data:([^;]+);/)
          const mimeType = mimeMatch?.[1] || 'image/png'
          const uploadRes = await fetch(`${blog.custom_api_url}/bcm/upload`, {
            method: 'POST',
            headers: { 'X-BCM-Token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: coverImageUrl, mimeType }),
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            coverImageUrl = uploadData.url
          } else {
            coverImageUrl = null // image upload failed — publish without image
          }
        } catch {
          coverImageUrl = null
        }
      }

      console.log('[publish/custom] url:', `${blog.custom_api_url}/bcm/posts`)
      console.log('[publish/custom] token length:', token.length, 'first10:', token.slice(0, 10))

      const res = await fetch(`${blog.custom_api_url}/bcm/posts`, {
        method: 'POST',
        headers: {
          'X-BCM-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: post.title,
          excerpt: post.excerpt,
          body: post.body,
          cover_image_url: coverImageUrl,
          keywords: post.keywords,
          category_id: post.category_id,
        }),
      })

      const text = await res.text()
      console.log('[publish/custom] status:', res.status, 'body:', text.slice(0, 500))

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const parsed = JSON.parse(text)
          msg = parsed.message || parsed.error || JSON.stringify(parsed)
        } catch {
          msg = text.slice(0, 300) || msg
        }
        return NextResponse.json({ error: msg }, { status: 500 })
      }

      let data: { url?: string } = {}
      try { data = JSON.parse(text) } catch {
        return NextResponse.json({ error: `API returned non-JSON: ${text.slice(0, 300)}` }, { status: 500 })
      }

      return NextResponse.json({ url: data.url })
    }

    return NextResponse.json({ error: 'Unknown blog type' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[publish]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
