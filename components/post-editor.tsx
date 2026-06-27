'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Wand2, Send, RefreshCw, ExternalLink, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Blog, PostIdea, WPCategory } from '@/lib/types'

interface Props {
  blog: Blog
  selectedIdea: PostIdea | null
  onClearIdea: () => void
}

export function PostEditor({ blog, selectedIdea, onClearIdea }: Props) {
  const supabase = createClient()
  const [categories, setCategories] = useState<WPCategory[]>([])

  // Form state
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaNotes, setIdeaNotes] = useState('')

  // Generated fields
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordsRaw, setKeywordsRaw] = useState('')
  const [category, setCategory] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()

  const [generating, setGenerating] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState('')
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedIdea) {
      setIdeaTitle(selectedIdea.title)
      setIdeaNotes(selectedIdea.description || '')
      // clear previous generation
      setTitle('')
      setExcerpt('')
      setBody('')
      setCoverImage('')
      setKeywords([])
      setKeywordsRaw('')
      setCategory('')
      setCategoryId(undefined)
      setPublishedUrl('')
      setGenerated(false)
    }
  }, [selectedIdea])

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: blog.type,
          wpApiUrl: blog.wp_api_url,
          wpApiKey: blog.wp_api_key,
          customApiUrl: blog.custom_api_url,
        }),
      })
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch {
      // categories optional — user can type manually
    }
  }

  async function handleGenerate() {
    if (!ideaTitle.trim()) { toast.error('Add a title first'); return }
    setGenerating(true)
    setGenerated(false)
    setPublishedUrl('')
    try {
      const res = await fetch('/api/generate/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ideaTitle,
          description: ideaNotes,
          blogName: blog.name,
          blogDescription: blog.description,
          categories,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const p = data.post
      setTitle(p.title)
      setExcerpt(p.excerpt)
      setBody(p.body)
      setKeywords(p.keywords || [])
      setKeywordsRaw((p.keywords || []).join(', '))
      setCategory(p.category)

      // match category to id
      const match = categories.find(
        (c) => c.name.toLowerCase() === p.category.toLowerCase() || c.slug === p.category.toLowerCase()
      )
      setCategoryId(match?.id)

      setGenerated(true)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateImage() {
    if (!title) { toast.error('Generate the article first'); return }
    setGeneratingImage(true)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCoverImage(data.imageBase64)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Image generation failed')
    } finally {
      setGeneratingImage(false)
    }
  }

  function handleKeywordsChange(raw: string) {
    setKeywordsRaw(raw)
    setKeywords(raw.split(',').map((k) => k.trim()).filter(Boolean))
  }

  function handleCategorySelect(value: string | null) {
    if (!value) return
    setCategory(value)
    const match = categories.find((c) => c.slug === value)
    setCategoryId(match?.id)
  }

  async function handlePublish() {
    if (!title) { toast.error('No article to publish'); return }
    setPublishing(true)
    try {
      // Save to supabase first
      const { data: savedPost, error } = await supabase
        .from('posts')
        .insert({
          blog_id: blog.id,
          idea_id: selectedIdea?.id || null,
          title,
          excerpt,
          body,
          cover_image_url: coverImage,
          keywords,
          category,
          category_id: categoryId,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error

      // Publish
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogId: blog.id,
          post: { title, excerpt, body, cover_image_url: coverImage, keywords, category, category_id: categoryId },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Update status in supabase
      await supabase
        .from('posts')
        .update({ status: 'published', published_url: data.url })
        .eq('id', savedPost.id)

      setPublishedUrl(data.url)
      toast.success('Published!')
      onClearIdea()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-900">Post Editor</h2>

      {/* Idea input */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="space-y-1.5">
          <Label>Title / Idea</Label>
          <Input
            value={ideaTitle}
            onChange={(e) => setIdeaTitle(e.target.value)}
            placeholder="What should this article be about?"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Notes <span className="text-gray-600 font-normal">(optional)</span></Label>
          <Textarea
            value={ideaNotes}
            onChange={(e) => setIdeaNotes(e.target.value)}
            placeholder="Dump your thoughts, angles, research, key points — anything that should shape the article."
            rows={3}
          />
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
          <Wand2 className="size-4" />
          {generating ? 'Generating...' : 'Generate Article'}
        </Button>
      </div>

      {/* Generated content */}
      {generated && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label>Article Body (HTML)</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="font-mono text-xs min-h-[320px] max-h-[520px] overflow-y-auto resize-y"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cover Image</Label>
            {coverImage ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <Image src={coverImage} alt="Cover" width={800} height={450} className="w-full object-cover" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 gap-1.5"
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                >
                  <RefreshCw className="size-3.5" />
                  {generatingImage ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleGenerateImage} disabled={generatingImage} className="w-full gap-2">
                <ImageIcon className="size-4" />
                {generatingImage ? 'Generating image...' : 'Generate Cover Image'}
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Keywords</Label>
            <Input
              value={keywordsRaw}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              placeholder="keyword one, keyword two, ..."
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            {categories.length > 0 ? (
              <Select value={categories.find((c) => c.name === category)?.slug || ''} onValueChange={handleCategorySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category name" />
            )}
          </div>

          {publishedUrl ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">Published successfully</p>
                <p className="text-sm text-green-600 truncate max-w-xs">{publishedUrl}</p>
              </div>
              <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5 border-green-300 text-green-700 hover:bg-green-100">
                  View <ExternalLink className="size-3.5" />
                </Button>
              </a>
            </div>
          ) : (
            <Button onClick={handlePublish} disabled={publishing} className="w-full gap-2 mb-8" size="lg">
              <Send className="size-4" />
              {publishing ? 'Publishing...' : 'Publish Article'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
