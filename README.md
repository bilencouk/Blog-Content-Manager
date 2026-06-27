# Blog Content Manager

Manage multiple blogs from one dashboard — generate AI-written posts with DeepSeek, create matching cover images via Google Gemini, and publish directly to WordPress or any custom API.

> **Vibe coded with [Claude](https://claude.ai).** This is a local-only tool — it has no authentication. Run it on your machine and access it at `localhost:3000`. Do not expose it to the public internet.

## Features

- **Multi-blog dashboard** — add and manage as many blogs as you want from a single interface
- **AI post ideas** — generate 8 tailored article ideas per blog using DeepSeek
- **AI content generation** — write full posts (title, excerpt, body, keywords, category) with DeepSeek
- **AI cover images** — generate photorealistic cover images with Google Gemini's image model
- **One-click publish** — push posts directly to WordPress (via REST API) or any custom endpoint
- **Draft management** — save, edit, and review posts before publishing
- **Category sync** — fetch and assign categories from your WordPress install or custom API

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router, React 19
- [Supabase](https://supabase.com/) — database and server-side auth
- [DeepSeek API](https://platform.deepseek.com/) — content and idea generation
- [Google Gemini API](https://aistudio.google.com/) — cover image generation (`gemini-2.5-flash-image`)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — UI components
- TypeScript throughout

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- A [DeepSeek](https://platform.deepseek.com/api_keys) API key
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key

### 1. Clone and install

```bash
git clone https://github.com/your-username/blog-content-manager.git
cd blog-content-manager
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
# Supabase — https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# DeepSeek — https://platform.deepseek.com/api_keys
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Set up the database

Run the schema against your Supabase project via the [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql) — paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it.

This creates three tables: `blogs`, `post_ideas`, and `posts`.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding a Blog

Click **Add Blog** and fill in:

| Field | Required | Notes |
|---|---|---|
| Name | Yes | Display name |
| Description | Yes | Used to guide AI generation |
| Type | Yes | `wordpress` or `custom` |
| WP API URL | WordPress only | e.g. `https://yourblog.com` |
| WP Application Password | WordPress only | Base64-encoded `username:app_password` |
| Custom API URL | Custom only | Your publish endpoint |

### WordPress Application Password

1. In your WordPress admin go to **Users → Profile**
2. Scroll to **Application Passwords**, create one
3. Base64-encode `username:application_password` — e.g. in a terminal:
   ```bash
   echo -n "admin:xxxx xxxx xxxx xxxx xxxx xxxx" | base64
   ```
4. Paste the result into the **WP Application Password** field

## Workflow

1. Open a blog → click **Generate Ideas** to get 8 AI-suggested article titles
2. Pick an idea → click **Generate Post** to produce a full draft
3. Review and edit the post in the editor
4. Click **Generate Image** to create a cover image
5. Select a category, then click **Publish**

## Project Structure

```
app/
  api/
    categories/     # fetch categories from WP or custom API
    generate/
      ideas/        # DeepSeek: generate post ideas
      post/         # DeepSeek: generate full post content
      image/        # Gemini: generate cover image
    publish/        # push post to WordPress or custom endpoint
  blogs/[id]/       # individual blog view
  page.tsx          # dashboard (blog list)
components/
  blog-card.tsx
  post-editor.tsx
  ideas-panel.tsx
  add-blog-modal.tsx
  edit-blog-modal.tsx
lib/
  supabase/         # Supabase client (browser + server)
  types.ts
supabase/
  schema.sql        # database schema
```

## Custom API Integration

Set blog type to `custom` and provide an endpoint URL. The publish route will `POST` to that URL with the following JSON body:

```json
{
  "title": "Post title",
  "excerpt": "Short description",
  "body": "<p>HTML content...</p>",
  "cover_image_url": "data:image/png;base64,...",
  "keywords": ["keyword1", "keyword2"],
  "category": "Category Name",
  "status": "publish"
}
```

See [`lib/custom-api-prompt.ts`](lib/custom-api-prompt.ts) for the expected response format your endpoint should return.

## License

MIT
