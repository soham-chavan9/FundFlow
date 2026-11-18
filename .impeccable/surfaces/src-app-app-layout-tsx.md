---
version: 1
slug: "src-app-app-layout-tsx"
primary_target: "src/app/(app)/layout.tsx"
related_targets: ["src/app/(app)/dashboard/page.tsx","src/app/(auth)/layout.tsx"]
---

## Scope

Signed-in app shell and its screens (dashboard, expenses, income, budgets, insights, shopping, assistant, settings), plus the auth pages. Visitor mode: **Operate**. The landing page gets its own Persuade brief.

## Audience and task

Anyone tracking personal spend. The core loop: add an expense, see that category's budget update, notice pacing or overspend, and review the month. The data is often empty for a new account, so the empty states teach the loop.

## Constraints

Pinned by the user: "calm neutral surfaces, one accent color, sidebar navigation, KPI cards and budget progress bars, light and dark mode". It should feel like a modern banking app, with Mercury as the craft bar. Standard web controls only (shadcn/Radix). Must work in en/es/zh, at 375px, and to WCAG 2.2 AA.

## Direction contract

THESIS: FundFlow reads like a calm, banking-grade statement of your month: exact numbers, quiet chrome, nothing gamified. It refuses the colourful, confetti budgeting-app look and the old pink/purple gradients.

OWN-WORLD: Two cool neutral layers: a white content plane and a slightly cooler grey sidebar/rail. Ink is a navy-tinted near-black. One indigo accent is reserved for the primary action, the current selection, focus and the pace line. Green, amber and red appear only where they carry state. Geist is the only face, with tabular numerals for every amount. The detailing is 1px hairlines, low soft shadows and an 8px radius. Category hues appear only inside data marks.

STORY: The visitor sees this month's spend against budget in one glance, spots the category running ahead of pace, adds an expense in one step from anywhere, and opens the month for detail.

FIRST VIEWPORT: Left sidebar: wordmark, nav, user menu at the foot. Top bar: month switcher (prev/label/next), then "Add expense" as the only primary button, at the right. Summary strip: Spent, Budgeted, Left, and "day 18 of 30". Below it, two columns: budgets by category with pace bars (wide), and a 6-month spend trend. Recent transactions table underneath.

FORM: Canon, played straight. Signature move: the pace line, a hairline on every budget bar at today's point in the month. A bar ahead of pace turns amber, and over budget turns red. seed: none (pinned). Quoted pin: "Clean fintech — Calm neutral surfaces, one accent color, sidebar navigation, KPI cards and budget progress bars, light and dark mode. Feels like a modern banking app." Craft bar: "Mercury".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Accent hue fine-tuning after first render in both themes.
- Category data palette to be validated with the dataviz method when charts land (Day 2).
