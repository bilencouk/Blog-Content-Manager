export type BlogType = 'wordpress' | 'custom'

export interface Blog {
  id: string
  name: string
  description: string
  type: BlogType
  wp_api_url?: string
  wp_api_key?: string
  custom_api_url?: string
  created_at: string
}

export interface PostIdea {
  id: string
  blog_id: string
  title: string
  description?: string
  created_at: string
}

export interface Post {
  id: string
  blog_id: string
  idea_id?: string
  title: string
  excerpt?: string
  body?: string
  cover_image_url?: string
  keywords?: string[]
  category?: string
  category_id?: number
  status: 'draft' | 'published'
  published_url?: string
  created_at: string
}

export interface WPCategory {
  id: number
  name: string
  slug: string
}
