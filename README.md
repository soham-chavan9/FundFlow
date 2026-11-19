# FundFlow

FundFlow is a personal expense tracker and budget manager. You log what you spend and earn, give each category a monthly limit, and see whether every budget is on track for the days left in the month. Reports break spending down by month and year, and an optional AI assistant answers questions about your own numbers.

It works in English, Spanish and Simplified Chinese, in light and dark mode, on phones and desktops.

## Features

- **Expenses and income.** Add, edit and delete entries from any screen. Search, filter by category, sort, page through, and export a month to CSV. Amounts can be typed as `12.50` or `12,50`.
- **Budgets that know what day it is.** Each category gets a monthly limit. A line on its bar marks where spending should be today. A budget running ahead of the month turns amber, and one that's over turns red. Fixed bills like rent are only flagged when they go over. Last month's limits can be copied in one click.
- **Overspend warnings.** Saving an expense that pushes a category over its limit shows a warning straight away.
- **Overview.** Spent, budgeted, what's left and the day of the month; budget bars; a six-month trend; recent expenses.
- **Insights.** A monthly report by category compared with last month and your budget, income against spending, and a yearly month-by-month report.
- **Assistant.** Ask questions like "Which budget is most at risk?". Google Gemini answers from a summary of your last three months, in your language. Nothing is stored.
- **Shopping list** with instant check-off.
- **Settings.** Name, currency, language, password change (signs out your other devices) and account deletion.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, Turbopack), React 19, TypeScript
- Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com) (Radix), Recharts, lucide icons
- MongoDB (official Node driver), zod validation
- Sessions as signed HS256 JWT cookies (`jose`), passwords hashed with bcrypt
- [next-intl](https://next-intl.dev) for translations
- `@google/genai` for the assistant
- Vitest for unit tests, Playwright for end-to-end tests, GitHub Actions CI

## Getting started

You need Node.js 20.9 or newer, and Docker (or any MongoDB 7 you can reach).

```bash
git clone https://github.com/soham-chavan9/FundFlow.git
cd FundFlow
npm ci
docker compose up -d          # MongoDB on 127.0.0.1:27017
cp .env.example .env.local    # then set AUTH_SECRET (see below)
npm run dev                   # http://localhost:3000
```

Generate a session secret and paste it into `.env.local`:

```bash
openssl rand -base64 32
```

### Environment variables

| Variable         | Required | What it does                                                                                                                                    |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`    | yes      | MongoDB connection string. `mongodb://127.0.0.1:27017` with the bundled `docker-compose.yml`.                                                   |
| `MONGODB_DB`     | no       | Database name. Defaults to `fundflow`.                                                                                                          |
| `AUTH_SECRET`    | yes      | Signs session cookies. At least 32 characters.                                                                                                  |
| `GEMINI_API_KEY` | no       | Turns on the assistant. Get one at [Google AI Studio](https://aistudio.google.com/apikey). Without it, the assistant page says it isn't set up. |
| `GEMINI_MODEL`   | no       | Overrides the Gemini model. Defaults to `gemini-4-hydrogen`.                                                                                    |

## Scripts

| Command                       | What it does                                         |
| ----------------------------- | ---------------------------------------------------- |
| `npm run dev`                 | Development server                                   |
| `npm run build` / `npm start` | Production build and server                          |
| `npm run lint`                | ESLint                                               |
| `npm run typecheck`           | Generates route types, then runs `tsc`               |
| `npm test`                    | Unit tests (Vitest)                                  |
| `npm run test:e2e`            | End-to-end tests (Playwright; needs MongoDB running) |
| `npm run format`              | Prettier                                             |

## How it's built

```
src/
  app/            routes: (auth) sign-in and registration, (app) the signed-in screens,
                  api/assistant (streaming chat), and the landing page
  components/     UI by feature (entries, budgets, charts, settings, assistant, landing) plus shadcn/ui
  lib/            pure logic with unit tests: money, dates, budget pace, reports, CSV, validation
  server/         database reads, Server Actions and the Gemini client (server-only)
  i18n/           locale resolution and message types
messages/         en.json, es.json, zh.json
e2e/              Playwright tests
```

Some decisions worth knowing:

- **Money is stored in integer cents.** Amounts are parsed from text, never through floating point. Totals and reports are computed in pure functions with unit tests.
- **Every read and write is scoped to the signed-in user.** The user id always comes from the session cookie on the server, never from the browser. `proxy.ts` handles redirects for signed-out visitors, and every page and action checks the session again.
- **Session cookies are httpOnly, SameSite=Lax, and Secure in production.** Changing your password bumps a session version that signs out every other device.
- **CSV export guards against formula injection.** Assistant prompts keep your data in a fenced block that user-entered text can't break out of, and the assistant is rate-limited per user.
- **Translations are checked by a test.** A missing key or a dropped placeholder in Spanish or Chinese fails CI.

## Testing

```bash
npm test                         # unit tests
npx playwright install chromium  # once
npm run test:e2e                 # builds, starts on port 3100 and runs the browser tests
```

CI runs lint, typecheck, unit tests, the production build and the end-to-end tests on Node 22 and 26.

## History

FundFlow started as a team project for INFO 6150 at Northeastern University, built by Team LogicForce. This version is a full rebuild on a current stack, with a fixed security model, a new interface and a working assistant. The original course materials are in [`docs/original`](docs/original).

## License

[MIT](LICENSE)
