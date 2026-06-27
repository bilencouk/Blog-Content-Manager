'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { Blog } from '@/lib/types'

interface Props {
  blog: Blog
  open: boolean
  onClose: () => void
  onUpdated: (blog: Blog) => void
}

export function EditBlogModal({ blog, open, onClose, onUpdated }: Props) {
  const supabase = createClient()
  const [name, setName] = useState(blog.name)
  const [description, setDescription] = useState(blog.description)

  // WordPress fields
  const [wpApiUrl, setWpApiUrl] = useState(blog.wp_api_url ?? '')
  const [wpUsername, setWpUsername] = useState('')
  const [wpAppPassword, setWpAppPassword] = useState('')

  // Custom fields
  const [customApiUrl, setCustomApiUrl] = useState(blog.custom_api_url ?? '')
  const [customApiKey, setCustomApiKey] = useState('')

  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) { toast.error('Blog name is required'); return }
    if (!description.trim()) { toast.error('Blog description is required'); return }

    setSaving(true)
    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        description: description.trim(),
      }

      if (blog.type === 'wordpress') {
        payload.wp_api_url = wpApiUrl.trim().replace(/\/$/, '')
        // only update credentials if user typed new ones
        if (wpUsername.trim() && wpAppPassword.trim()) {
          payload.wp_api_key = btoa(`${wpUsername.trim()}:${wpAppPassword.trim()}`)
        }
      } else {
        payload.custom_api_url = customApiUrl.trim().replace(/\/$/, '')
        if (customApiKey.trim()) {
          payload.wp_api_key = customApiKey.trim()
        }
      }

      const { data, error } = await supabase
        .from('blogs')
        .update(payload)
        .eq('id', blog.id)
        .select()
        .single()

      if (error) throw error
      toast.success('Blog updated')
      onUpdated(data as Blog)
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update blog')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o, eventDetails) => {
        if (!o && eventDetails.reason !== 'escape-key' && eventDetails.reason !== 'outside-press') onClose()
      }}
      disablePointerDismissal
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Blog</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Blog Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          {blog.type === 'wordpress' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>WordPress Site URL</Label>
                <Input
                  value={wpApiUrl}
                  onChange={(e) => setWpApiUrl(e.target.value)}
                  placeholder="https://myblog.com"
                />
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-3 space-y-3">
                <p className="text-sm text-gray-600">Update credentials — leave blank to keep existing</p>
                <div className="space-y-1.5">
                  <Label>Username</Label>
                  <Input value={wpUsername} onChange={(e) => setWpUsername(e.target.value)} placeholder="admin" />
                </div>
                <div className="space-y-1.5">
                  <Label>Application Password</Label>
                  <Input
                    type="password"
                    value={wpAppPassword}
                    onChange={(e) => setWpAppPassword(e.target.value)}
                    placeholder="Leave blank to keep existing"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>API Base URL</Label>
                <Input
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  placeholder="https://myblog.com/api"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Leave blank to keep existing"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
