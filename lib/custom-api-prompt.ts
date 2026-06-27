export function getCustomApiPrompt(blogName: string): string {
  return `I need you to build a REST API for my blog "${blogName}" so it can connect to my Blog Content Manager app.

The API needs these endpoints:

---

GET /bcm/categories
Returns all categories.
Response: [{ "id": 1, "name": "Tech", "slug": "tech" }, ...]

---

POST /bcm/posts
Creates and publishes a post immediately.
Request body:
{
  "title": "string",
  "excerpt": "string",
  "body": "string (HTML)",
  "cover_image_url": "string",
  "keywords": ["string"],
  "category_id": number
}
Response: { "id": "string or number", "url": "https://..." }

---

Security: Protect both endpoints with a Bearer token header: Authorization: Bearer <token>

The token value can be anything — set it in your environment and return it to me so I can add it to the Blog Content Manager.

Please return:
1. The full API implementation
2. The base URL where it will be hosted (e.g. https://myblog.com/api)
3. The Bearer token to use`
}
