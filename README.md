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

5. Apply database migrations and seed the demo data:

```bash
npm run db:migrate
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

Default local admin credentials:

- Login: `admin`
- Password: `123456789`

If you use Google auth, set these values in `.env`:

```bash
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

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
