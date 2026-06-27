'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BlogCard } from '@/components/blog-card'
import { AddBlogModal } from '@/components/add-blog-modal'
import { createClient } from '@/lib/supabase/client'
import type { Blog } from '@/lib/types'

export default function DashboardPage() {
  const supabase = createClient()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    loadBlogs()
  }, [])

  async function loadBlogs() {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { toast.error('Failed to load blogs'); return }
    setBlogs(data as Blog[])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this blog and all its posts?')) return
    const { error } = await supabase.from('blogs').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setBlogs((prev) => prev.filter((b) => b.id !== id))
    toast.success('Blog removed')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog Content Manager</h1>
          <p className="text-sm text-gray-600">{blogs.length} blog{blogs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="size-4" /> Add Blog
        </Button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <p className="text-gray-600 text-lg">No blogs yet</p>
            <p className="text-gray-600 text-sm">Add your first blog to start generating content.</p>
            <Button onClick={() => setShowAdd(true)} className="gap-1.5 mt-2">
              <Plus className="size-4" /> Add Blog
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((blog) => (
              <BlogCard
              key={blog.id}
              blog={blog}
              onDelete={handleDelete}
              onUpdated={(updated) => setBlogs((prev) => prev.map((b) => b.id === updated.id ? updated : b))}
            />
            ))}
          </div>
        )}
      </main>

      <AddBlogModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={(blog) => setBlogs((prev) => [blog, ...prev])}
      />
    </div>
  )
}
