# Beyblade X Tracker

A public, shareable Next.js app to track Beyblade X parts, combos, photos, battles, and simple win/loss results.

## Table of Contents

- [Development](#development)
- [Usage](#usage)
- [Local setup](#local-setup)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Development

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000 by default.

## Usage

- Sign up or sign in from the auth pages.
- Upload parts, create combos, and record battles from the dashboard.
- Use the chat page to create combos or log 1v1 battles in one sentence, such as `Wizard Rod 1-60 Hexa vs Phoenix Wing 3-60 Rush 1-0`.

## Footer links

Footer links are managed in `lib/footer-links.ts`.

To add a link, add another object to the `footerLinks` array:

```ts
{ href: "/your-page", label: "Your Label" }
```

Use internal paths like `/reports` for app pages, or a full URL for an external site.

## Local setup

1. Copy the example environment:

```bash
cp .env.example .env
```

2. Add your hosted Postgres connection string to `.env`:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

For Neon, copy the pooled or direct PostgreSQL connection string from the Neon dashboard and use it as `DATABASE_URL`.

For local Docker Postgres instead, use:

```bash
DATABASE_URL="postgresql://beyuser:beypass@localhost:5432/beyblade_x?schema=public"
```

3. Start the PostgreSQL container if you are using the local Docker database:

```bash
docker compose up -d postgres
```

4. Install dependencies:

```bash
npm install
```

5. Apply database migrations and seed the catalog:

```bash
npm run db:migrate
npm run db:deploy
npm run db:seed
```

`db:seed` creates the default admin account and loads the competitive meta parts catalog.

If you deploy to Vercel or another host, ensure `DATABASE_URL` is set and migrations run (`npm run db:deploy` is included in the production build).

6. Start the app:

```bash
npm run dev
```

Default local admin credentials:

- Login: `admin`
- Password: `123456789`

If you use Google auth, set these values in `.env`:

```bash
GOOGLE_AUTH_ENABLED="true"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Inactive non-admin accounts with no activity heartbeat for 90 days are deleted by the cleanup job. Run the cleanup endpoint daily from Vercel Cron or another scheduler:

```text
GET /api/cron/cleanup-inactive
Authorization: Bearer YOUR_CRON_SECRET
```

Set `CRON_SECRET` in production to protect that endpoint.

If you enable AI-backed chat, keep provider keys in `.env` only:

```bash
GROQ_API_KEY=""
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
```

Do not put real API keys in `.env.example` or any committed file. Local `.env` files are ignored by Git.

## API

Server routes live under `app/api/`. Endpoints include auth, battles, combos, parts, and upload.

## Contributing

Please open a topic branch, run lint/tests locally, and open a PR against `main` when ready.

## License

MIT
