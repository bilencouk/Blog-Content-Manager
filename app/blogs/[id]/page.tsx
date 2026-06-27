'use client'

import { use, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IdeasPanel } from '@/components/ideas-panel'
import { PostEditor } from '@/components/post-editor'
import { createClient } from '@/lib/supabase/client'
import type { Blog, PostIdea } from '@/lib/types'

export default function BlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [ideas, setIdeas] = useState<PostIdea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<PostIdea | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlog()
  }, [id])

  async function loadBlog() {
    const [blogRes, ideasRes] = await Promise.all([
      supabase.from('blogs').select('*').eq('id', id).single(),
      supabase.from('post_ideas').select('*').eq('blog_id', id).order('created_at', { ascending: false }),
    ])
    if (blogRes.error) { toast.error('Blog not found'); return }
    setBlog(blogRes.data as Blog)
    setIdeas((ideasRes.data as PostIdea[]) || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!blog) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
              <ArrowLeft className="size-4" /> Blogs
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-gray-900">{blog.name}</h1>
            <Badge variant={blog.type === 'wordpress' ? 'default' : 'secondary'} className="text-xs">
              {blog.type === 'wordpress' ? 'WordPress' : 'Custom'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="bg-gray-50">
            <IdeasPanel
              blog={blog}
              ideas={ideas}
              onIdeasChange={setIdeas}
              onSelectIdea={(idea) => setSelectedIdea(idea)}
            />
          </div>
          <div>
            <PostEditor
              blog={blog}
              selectedIdea={selectedIdea}
              onClearIdea={() => setSelectedIdea(null)}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
