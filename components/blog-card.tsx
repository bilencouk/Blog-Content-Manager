'use client'

import { useState } from 'react'
import { Trash2, Globe, ArrowRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditBlogModal } from '@/components/edit-blog-modal'
import type { Blog } from '@/lib/types'
import Link from 'next/link'

interface Props {
  blog: Blog
  onDelete: (id: string) => void
  onUpdated: (blog: Blog) => void
}

export function BlogCard({ blog, onDelete, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-gray-600 shrink-0 mt-0.5" />
            <h3 className="font-semibold text-gray-900 leading-snug">{blog.name}</h3>
          </div>
          <Badge variant={blog.type === 'wordpress' ? 'default' : 'secondary'} className="shrink-0 text-xs">
            {blog.type === 'wordpress' ? 'WordPress' : 'Custom'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{blog.description}</p>

        <div className="flex items-center gap-2 pt-1">
          <Link href={`/blogs/${blog.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              Open <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(blog.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <EditBlogModal
        blog={blog}
        open={editing}
        onClose={() => setEditing(false)}
        onUpdated={(updated) => { onUpdated(updated); setEditing(false) }}
      />
    </>
  )
}
