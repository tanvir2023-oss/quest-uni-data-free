# Eduvanta University Intelligence

A full-stack TanStack Start application for researching official university admissions information, including requirements, English tests, tuition, deadlines, programmes, faculties, documents and scholarships.

## Free architecture

This version is independent of Lovable and Firecrawl:

- **Frontend + server:** TanStack Start on Cloudflare Workers
- **Database + authentication:** Supabase Free
- **AI extraction:** Google Gemini API free tier (`gemini-2.5-flash-lite` by default)
- **Website discovery:** Gemini Google Search grounding when only a university name is supplied
- **Website crawling:** direct HTTP fetch + sitemap + same-domain links; no Firecrawl account required
- **Source code:** GitHub

Free tiers have quotas/rate limits, so this is intended for normal consultancy/internal usage rather than unlimited automated crawling.

## 1. Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with a Supabase project URL/publishable key and a Gemini API key.

## 2. Create the free Supabase project

Create a new project in Supabase and use its **Project URL** and **Publishable key**. Do not use the old `*.lovable.cloud` URL.

Apply the SQL files in `supabase/migrations/` to the new project. The simplest route is the Supabase SQL Editor: run the migration files in filename order.

Then enable the authentication providers you want under Supabase Authentication. Email/password is already supported by the application. For Google sign-in, configure the Google provider and add your deployed application's callback URL in Supabase.

## 3. Create the free Gemini API key

Create an API key in Google AI Studio and put it in:

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
```

The application uses structured JSON output for extraction. Gemini's free tier is rate-limited, so if the limit is reached the UI should be retried later rather than automatically creating paid usage.

## 4. Deploy to Cloudflare Workers

Install Wrangler and authenticate:

```bash
npx wrangler login
```

Add the production secrets:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put GEMINI_API_KEY
```

You can optionally set the model with a Worker variable named `GEMINI_MODEL`.

Build and deploy:

```bash
npm run deploy
```

Cloudflare's TanStack Start integration uses the official Vite plugin and Wrangler configuration in `vite.config.ts` and `wrangler.jsonc`.

## Important: never commit secrets

`.env` is ignored by Git. Commit only `.env.example`.

If an old `.env` or secret was previously pushed to GitHub, rotate that key in the relevant service before publishing this version.

## Research limitations

The free crawler intentionally uses ordinary HTTP requests. Some university sites are heavily JavaScript-rendered, block automated requests, or expose their content only after client-side rendering. When a page cannot be fetched, the application marks it as attempted and continues instead of depending on a paid crawler.

For best results, enter the university's official URL in the research form whenever possible. This avoids spending a Google Search grounding request on website discovery.
