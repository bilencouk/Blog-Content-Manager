'use client'

import { useState } from 'react'
import { Lightbulb, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { Blog, PostIdea } from '@/lib/types'

interface Props {
  blog: Blog
  ideas: PostIdea[]
  onIdeasChange: (ideas: PostIdea[]) => void
  onSelectIdea: (idea: PostIdea) => void
}

export function IdeasPanel({ blog, ideas, onIdeasChange, onSelectIdea }: Props) {
  const supabase = createClient()
  const [generating, setGenerating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogName: blog.name, blogDescription: blog.description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const toInsert = data.ideas.map((idea: { title: string; description: string }) => ({
        blog_id: blog.id,
        title: idea.title,
        description: idea.description,
      }))

      const { data: inserted, error } = await supabase
        .from('post_ideas')
        .insert(toInsert)
        .select()

      if (error) throw error
      onIdeasChange([...(inserted as PostIdea[]), ...ideas])
      toast.success(`${inserted!.length} ideas generated`)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to generate ideas')
    } finally {
      setGenerating(false)
    }
  }

  async function handleAddManual() {
    if (!newTitle.trim()) { toast.error('Title is required'); return }
    setAdding(true)
    try {
      const { data, error } = await supabase
        .from('post_ideas')
        .insert({ blog_id: blog.id, title: newTitle.trim(), description: newDesc.trim() || null })
        .select()
        .single()
      if (error) throw error
      onIdeasChange([data as PostIdea, ...ideas])
      setNewTitle('')
      setNewDesc('')
      toast.success('Idea added')
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('post_ideas').delete().eq('id', id)
    onIdeasChange(ideas.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Lightbulb className="size-4 text-amber-500" /> Ideas
        </h2>
        <Button size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5">
          <Sparkles className="size-3.5" />
          {generating ? 'Generating...' : 'Generate Ideas'}
        </Button>
      </div>

      {/* Manual add */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
        <Label className="text-xs text-gray-600">Add idea manually</Label>
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Article title"
          className="text-sm"
        />
        <Textarea
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Optional notes or angle..."
          rows={2}
          className="text-sm"
        />
        <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={handleAddManual} disabled={adding}>
          <Plus className="size-3.5" /> Add Idea
        </Button>
      </div>

      {/* Ideas list */}
      <div className="space-y-2">
        {ideas.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-4">No ideas yet. Generate some or add one above.</p>
        )}
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 cursor-pointer group"
            onClick={() => onSelectIdea(idea)}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 leading-snug">{idea.title}</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(idea.id) }}
                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            {idea.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{idea.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
