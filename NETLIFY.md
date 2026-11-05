# Upload Career Nexus to Netlify

This app is Next.js with server routes, login cookies, and PostgreSQL. It is not a static site.

Do not use Netlify’s “drag and drop a folder” deploy. That only publishes static files and will not run login, the database, or the API.

## 1. Database first

Create a free Postgres database on Neon (https://neon.tech) or Supabase.

Copy the connection string. It must start with `postgresql://`.

From your computer, after unzipping this project:

```bash
npm install
# put the Neon/Supabase URL in .env as DATABASE_URL=...
npx drizzle-kit push
```

That creates the tables. The app seeds the demo account on first boot.

## 2. Put the code on Netlify

Unzip this download, then either:

**Git (recommended)**

1. Create a GitHub repository and push this folder.
2. In Netlify: Add new site → Import an existing project → pick that repo.
3. Build command: `npm run build`
4. Publish directory: `.next`
5. The `netlify.toml` file already sets this and adds `@netlify/plugin-nextjs`.

**Netlify CLI**

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --build --prod
```

## 3. Environment variables

In Netlify: Site configuration → Environment variables. Add at least:

- `DATABASE_URL` — the hosted Postgres URL (required)
- `NODE_VERSION` — `22` (already set in netlify.toml)

Optional:

- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` — real LLM answers. Without one, Nexus AI uses the built-in guidance engine and says so.
- `RESEND_API_KEY` and `EMAIL_FROM` — password-reset email. Without them, use Settings → Recovery code.
- `FRAME_ANCESTORS` — set to `'self'` on your own domain.

Redeploy after saving variables.

## 4. After deploy

Open your Netlify URL in a normal browser tab (not only inside another site’s frame).

Demo login, after the database has been seeded by the first visit:

- Email: `demo@careernexus.app`
- Password: `Demo1234!`

Registering a new account also works.

## Limits on Netlify

- File uploads are stored on the function disk. A new deploy can wipe them. Use a persistent volume or object storage if you need uploads to last.
- There is no email until `RESEND_API_KEY` is set.
- There is no external AI model until an API key is set.
