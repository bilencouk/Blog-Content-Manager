'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCustomApiPrompt } from '@/lib/custom-api-prompt'
import { createClient } from '@/lib/supabase/client'
import type { Blog } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (blog: Blog) => void
}

export function AddBlogModal({ open, onClose, onCreated }: Props) {
  const supabase = createClient()
  const [type, setType] = useState<'wordpress' | 'custom'>('wordpress')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [wpApiUrl, setWpApiUrl] = useState('')
  const [wpUsername, setWpUsername] = useState('')
  const [wpAppPassword, setWpAppPassword] = useState('')
  const [customApiUrl, setCustomApiUrl] = useState('')
  const [customApiKey, setCustomApiKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  function reset() {
    setName('')
    setDescription('')
    setWpApiUrl('')
    setWpUsername('')
    setWpAppPassword('')
    setCustomApiUrl('')
    setCustomApiKey('')
    setType('wordpress')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(getCustomApiPrompt(name || 'My Blog'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Blog name is required'); return }
    if (!description.trim()) { toast.error('Blog description is required'); return }
    if (type === 'wordpress') {
      if (!wpApiUrl.trim()) { toast.error('WordPress API URL is required'); return }
      if (!wpUsername.trim() || !wpAppPassword.trim()) { toast.error('WordPress credentials are required'); return }
    } else {
      if (!customApiUrl.trim()) { toast.error('Custom API URL is required'); return }
      if (!customApiKey.trim()) { toast.error('API Bearer token is required'); return }
    }

    setSaving(true)
    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        description: description.trim(),
        type,
      }

      if (type === 'wordpress') {
        payload.wp_api_url = wpApiUrl.trim().replace(/\/$/, '')
        payload.wp_api_key = btoa(`${wpUsername.trim()}:${wpAppPassword.trim()}`)
      } else {
        payload.custom_api_url = customApiUrl.trim().replace(/\/$/, '')
        // store Bearer token in wp_api_key field for simplicity
        payload.wp_api_key = customApiKey.trim()
      }

      const { data, error } = await supabase
        .from('blogs')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      toast.success('Blog added')
      onCreated(data as Blog)
      handleClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save blog')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o, eventDetails) => {
        if (!o && eventDetails.reason !== 'escape-key' && eventDetails.reason !== 'outside-press') handleClose()
      }}
      disablePointerDismissal
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Blog</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Blog Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome Blog" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this blog about? What does it aim to achieve? Be detailed — this shapes every article generated."
              rows={4}
              className="max-h-[120px] overflow-y-auto resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as 'wordpress' | 'custom')}>
              <TabsList className="w-full">
                <TabsTrigger value="wordpress" className="flex-1">WordPress</TabsTrigger>
                <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="wordpress" className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label>WordPress Site URL</Label>
                  <Input
                    value={wpApiUrl}
                    onChange={(e) => setWpApiUrl(e.target.value)}
                    placeholder="https://myblog.com"
                  />
                  <p className="text-xs text-gray-600">The root URL of your WordPress site (not the /wp-json path).</p>
                </div>
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
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  />
                  <p className="text-xs text-gray-600">Generate one in WordPress → Users → Profile → Application Passwords.</p>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-3 pt-2">
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 space-y-2">
                  <p className="text-sm text-amber-800 font-medium">Your custom blog needs an API</p>
                  <p className="text-xs text-amber-700">Copy the prompt below and paste it into Claude. It will build the API endpoints this app needs.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPrompt}
                    className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100"
                  >
                    {copied ? <><Check className="size-3.5" /> Copied!</> : <><Copy className="size-3.5" /> Copy Claude Prompt</>}
                  </Button>
                </div>
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
                    placeholder="your-secret-token"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Add Blog'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
