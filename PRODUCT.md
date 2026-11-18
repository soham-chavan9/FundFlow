# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone tracking their own personal spending. No narrower segment is targeted. They log expenses as they happen or in a batch. They set a monthly budget per category and check whether they are on track. They want to see where their money went over recent months.

## Product Purpose

FundFlow is a personal expense tracker and budget manager. It does five things: records expenses and income, sets monthly per-category budgets, warns when a category goes over, charts spending over time, keeps a simple shopping list, and answers questions about the user's own spending through an AI assistant.

The rebuild's primary purpose is a **portfolio showcase**: it is shown to recruiters and on GitHub. Success means it reads as production-grade (secure, fast, polished, responsive, accessible) and a visitor understands what it does within seconds of landing.

## Positioning

FundFlow is a focused, single-user money tracker with budgets per category and month and an assistant grounded in the user's own data. No unverified claims about scale, users or savings.

## Operating Context

- Used in a desktop or mobile browser. Expenses are often entered on a phone, and reviews happen on a larger screen.
- The core loop: add expense, see the budget for that category update, notice overspend, review the month in charts.
- Originated as a Northeastern INFO 6150 team project (Team LogicForce). Original course docs live in `docs/original/`.

## Capabilities and Constraints

- Features: auth (email + password), expenses CRUD, income CRUD, monthly per-category budgets, overspend warnings (in-app), dashboard KPIs, insights charts and monthly/yearly reports, shopping list, Gemini-powered assistant, settings (name, currency, language).
- Categories: food, housing, transport, entertainment, medical, self care, travel, other.
- Currencies: USD, EUR, GBP, INR, CNY, MXN, CAD. Amounts are stored in integer cents.
- Languages: English, Spanish, Simplified Chinese.
- Stack is fixed by the codebase: Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui (Radix), MongoDB.
- **No demo account.** Visitors register, and new accounts start empty, so empty states are first-class.
- The assistant needs `GEMINI_API_KEY`. Without it, the app shows a "not configured" state.

## Brand Commitments

- The name is **FundFlow**. The legacy tagline is "Empowering Smart Personal Finances, One Flow at a Time" (it may be kept or retired).
- The original logo and imagery are not binding. The previous pink/purple gradient look is explicitly being replaced.
- Standing preference (user-chosen, 2026-11-18): a clean modern-banking look. That means "calm neutral surfaces, one accent color, sidebar navigation, KPI cards and budget progress bars, light and dark mode", executed straight. Mercury sets the craft bar.

## Evidence on Hand

- Real: the feature set above and the original course materials in `docs/original/`.
- Absent, and not to be fabricated: testimonials, user counts, ratings, press, savings statistics, pricing, customer logos.

## Product Principles

1. Truth about money: numbers are exact, consistent everywhere, and never decorative.
2. The next action is always obvious: adding an expense is one step from anywhere.
3. Empty is a starting point. A new account should feel guided, not broken.
4. Show, don't claim. The landing page earns trust through the product itself, not invented social proof.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast, full keyboard use, visible focus, and screen-reader labels for charts and icon buttons. It works at 375px width. Translated UI in en/es/zh, and currency and date formats follow the user's locale.
