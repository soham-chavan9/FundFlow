---
name: FundFlow
description: A calm, banking-grade statement of your month. Exact numbers, quiet chrome, one indigo accent.
colors:
  primary: "oklch(0.51 0.19 271)"
  primary-foreground: "oklch(0.99 0.004 271)"
  pace: "oklch(0.51 0.19 271)"
  ring: "oklch(0.51 0.19 271)"
  background: "oklch(0.992 0.002 255)"
  card: "oklch(1 0 0)"
  sidebar: "oklch(0.968 0.006 258)"
  muted: "oklch(0.962 0.006 258)"
  accent: "oklch(0.952 0.01 264)"
  sidebar-accent: "oklch(0.925 0.014 266)"
  foreground: "oklch(0.22 0.025 262)"
  sidebar-foreground: "oklch(0.32 0.025 262)"
  muted-foreground: "oklch(0.49 0.02 260)"
  border: "oklch(0.912 0.008 258)"
  input: "oklch(0.88 0.01 258)"
  success: "oklch(0.53 0.12 156)"
  warning: "oklch(0.74 0.15 72)"
  warning-foreground: "oklch(0.48 0.11 62)"
  destructive: "oklch(0.55 0.2 26)"
  chart-spend: "oklch(0.38 0.04 262)"
  chart-income: "oklch(0.74 0.035 262)"
  chart-ink: "oklch(0.36 0.03 262)"
  chart-context: "oklch(0.64 0.015 258)"
  cat-housing: "#2a78d6"
  cat-food: "#eb6834"
  cat-other: "#1baf7a"
  cat-travel: "#eda100"
  cat-selfcare: "#e87ba4"
  cat-transport: "#008300"
  cat-entertainment: "#6250d6"
  cat-medical: "#e34948"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  stat:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  page-title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "\"ss01\", \"cv11\""
  body-lead:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  amount:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    fontFeature: "\"tnum\", \"lnum\""
rounded:
  sm: "4.8px"
  md: "6.4px"
  lg: "8px"
  xl: "11.2px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "10": "40px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-primary-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
  summary-cell:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.stat}"
    padding: "20px"
  nav-item-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
  pace-bar-track:
    backgroundColor: "{colors.muted}"
    rounded: "{rounded.full}"
    height: "8px"
  pace-line:
    backgroundColor: "{colors.pace}"
    rounded: "{rounded.full}"
    width: "2px"
    height: "16px"
  sample-badge:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  category-dot:
    rounded: "{rounded.full}"
    size: "8px"
---

# Design System: FundFlow

## Overview

**Creative North Star: "The Monthly Statement"**

FundFlow reads like a calm, banking-grade statement of the month. Two cool neutral layers carry everything: a white content plane resting inside a slightly cooler grey sidebar. Ink is a navy-tinted near-black. A single indigo accent does four jobs only (primary action, current selection, focus, and the pace line), so wherever it appears, it means something. Everything else is hairlines, soft low shadows and an 8px radius.

Density is that of a working financial tool: 14px body text, 32px controls, 16 to 24px gutters, hairline-divided lists and summary cells. Numbers are the content. Amounts are exact, set in Geist with tabular figures wherever they sit in a column, and they are never decorative. Colour that is not the accent or a neutral is either state (green on track, amber ahead of pace, red over) or category identity (a small swatch beside a category name). The system rejects the colourful, gamified budgeting-app look and the old pink-and-purple gradients outright.

The one signature is the pace line: a 2px indigo hairline drawn across every variable budget bar at today's point in the month, ringed in the page colour so it reads as a mark in the bar rather than part of the fill. Spending left of it is on pace; a fill that runs past it turns amber before it ever turns red. The landing page uses the same world and the same components with labelled sample data, and its one authored motion is those bars filling in toward an already-placed pace line.

**Key Characteristics:**
- Two cool neutral planes (white content, cooler grey sidebar), navy-tinted ink, full light and dark themes in OKLCH.
- One indigo accent, reserved for primary action, current selection, focus and the pace line.
- Green, amber and red appear only as state; category hues only as identity swatches.
- Geist as the only face; tabular figures for amounts in columns.
- 1px hairlines, two soft shadows, 8px controls and 11px containers.
- The pace line on every variable budget bar.

## Colors

A cool, nearly colourless neutral field with one saturated indigo, a three-step state scale, and a validated categorical palette that lives only inside data.

### Primary
- **Ledger Indigo** (`primary`): the primary button (one per screen: "Add expense" in the app, "Create a free account" on the landing), the active nav item's text, the selected month's column in the spend trend, the focus ring (`ring`, at 50% alpha) and the caret. Its 22% mix is the text selection colour. In dark mode it lifts to a lighter, softer indigo (oklch 0.69 0.155 273).
- **Pace Indigo** (`pace`): the pace line on budget bars. The same hue as the primary in light mode; in dark mode it is lighter still (oklch 0.78 0.12 273) so a 2px line holds against dark fills.

### Secondary
- **State: On Track** (`success`): positive state only.
- **State: Ahead of Pace** (`warning`): the fill of a budget bar running ahead of today's pace. Its text partner, `warning-foreground`, is a darker amber used for the status line under the bar, because the fill amber does not meet text contrast.
- **State: Over** (`destructive`): an over-budget fill, the "Over budget" summary value, over-by status text, destructive buttons (as a 10% tint with red text) and invalid fields.

### Tertiary
- **Chart Ink pair** (`chart-spend`, `chart-income`): Spent and Income in the income-versus-spend chart are two shades of one navy-ink hue, validated as an ordinal pair (single hue, monotone lightness, visible step, light end clear of the card). Spent is the stronger shade. In dark mode the order inverts so Spent stays the more prominent mark.
- **Chart Ink** (`chart-ink`): single-series horizontal bars (category breakdowns on Insights and the landing).
- **Chart Context** (`chart-context`): the non-selected months in an emphasis chart; a grey that still clears 3:1 on the card.
- **Category identity** (`cat-housing` through `cat-medical`): the eight steps of a validated categorical palette (lightness, chroma, CVD and normal-vision checks on the card surface), with separate dark-mode values. Shown only as an 8px dot beside the category's name, never alone and never as a fill.

### Neutral
- **Paper** (`background`): the page and the sticky top bar; a near-white with a trace of cool blue.
- **Statement White** (`card`): cards, the inset content plane, summary cells and popovers.
- **Rail Grey** (`sidebar`): the sidebar and the frame behind the inset content plane; slightly cooler and darker than Paper.
- **Wash** (`muted`): the pace bar track, ghost-button hover, chart hover cursor, card footers.
- **Selected Wash** (`sidebar-accent`, `accent`): the active nav item background and menu item highlight.
- **Navy Ink** (`foreground`): all primary text, and at 70% alpha the on-track budget fill.
- **Slate** (`muted-foreground`): labels, secondary text, axis ticks, the "of" part of "spent / limit".
- **Hairline** (`border`): every 1px divider, card edge and table rule; also the 1px gap colour between summary cells. `input` is one step stronger for field borders and the scrollbar thumb.

### Named Rules
**The One Indigo Rule.** The accent is reserved for the primary action, the current selection, focus and the pace line. Nothing else is indigo, and there is one primary button per view.

**The State Only Rule.** Green, amber and red appear only where they carry state: on track, ahead of pace, over. A neutral fill (ink at 70%) is the on-track default; it is not green.

**The Swatch Beside a Name Rule.** Category hues appear only as identity swatches beside the category name, drawn from the validated eight-slot palette. They never fill a bar, tint a row or stand alone.

**The Ordinal Ink Rule.** Every categorical hue belongs to a category, so non-category series (Income and Spent) are two shades of one ink hue, never two categorical colours.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Geist
**Label/Mono Font:** Geist; ui-monospace only where code appears.

**Character:** One neutral grotesk carrying every role through size and weight alone. Body text runs with the ss01 and cv11 stylistic sets on; headings tighten their tracking and balance their wrap.

### Hierarchy
- **Display** (600, 2.25rem on mobile to 3.75rem from `sm`, line-height 1.05, -0.025em): the landing hero headline only, held to about 48rem wide.
- **Headline** (600, 1.5rem to 1.875rem on feature sections, up to 2.25rem on the closing call to action, -0.025em): landing section heads.
- **Stat** (600, 1.25rem to 1.5rem, -0.025em): the large values in the summary strip (Spent, Budgeted, Left, day of month). These use proportional figures, since they stand alone and are not compared down a column.
- **Title** (500, 1rem): card titles. **Page title** (600, 15px): the h1 in the sticky app top bar, sized to sit with the 15px wordmark rather than shout.
- **Body** (400, 14px in the app; 16px with relaxed leading in landing prose, 18px for the hero lede, prose capped at 65ch): running text and table cells.
- **Label** (400, 12px): stat details, status lines under budget bars, timestamps, badges.

### Named Rules
**The Tabular Column Rule.** Every amount that sits in a column, row or status line uses tabular, lining figures (the `num` utility or `tabular-nums`) so digits line up. Large standalone stat values keep proportional figures.

**The One Face Rule.** Geist is the only typeface. Hierarchy comes from size and weight (400, 500, 600), never from a second family, all-caps or letter-spaced labels.

## Layout

The app is a two-plane shell. A collapsible sidebar (icon rail when collapsed, a sheet on mobile) holds the wordmark, primary and secondary nav groups, then Settings and the user menu at its foot. Beside it, the content plane is inset: on desktop it is a white surface with a hairline border, the 11px container radius on its top corners and the soft shadow, sitting in the grey rail colour. Each screen opens with a sticky 56px top bar (sidebar toggle, hairline separator, page title, then the page's controls right-aligned: month switcher and the single primary action).

Page content is centred to a 72rem maximum with 16px padding, 24px from `sm`, and a 24px vertical gap between blocks. The dashboard reads top to bottom: a four-cell summary strip (two columns on mobile, four from `lg`), then a five-column grid from `lg` with budgets by category taking the wide side and the six-month trend the narrow side, then recent transactions. Card headers are 12px by 16 to 20px with a hairline under them; card bodies pad 16px, 20px from `sm`.

Spacing sits on Tailwind's 4px step; the reused rhythm is 4, 8, 12, 16, 20 and 24px, with 40 to 64px gaps and 64 to 96px section padding reserved for the landing. Lists are divided by hairlines rather than separated by space. Everything works at 375px.

The landing shares the 72rem container. The hero is left-aligned (headline, one sentence, primary and outline buttons), followed by a full-width framed product overview. Feature sections alternate a 5-column text side and a 7-column product fragment on a 12-column grid, divided by hairlines.

## Elevation & Depth

Depth is mostly tonal: the cooler sidebar against the white content plane, and white cards on near-white paper, defined by hairline borders (1px, or a 10% ink ring on shadcn cards). Two shadows exist, both navy-tinted, low and soft, and neither is used for hover lift.

### Shadow Vocabulary
- **Soft** (`box-shadow: 0 1px 2px 0 oklch(0.22 0.025 262 / 0.05), 0 1px 3px 0 oklch(0.22 0.025 262 / 0.04)`): the inset content plane, and the selected segment of a segmented control.
- **Lift** (`box-shadow: 0 4px 12px -2px oklch(0.22 0.025 262 / 0.08), 0 2px 4px -2px oklch(0.22 0.025 262 / 0.05)`): things that float above the plane: chart tooltips, the auth card, and the framed product views and floating callout on the landing.

### Named Rules
**The Hairline First Rule.** Separation comes from 1px hairlines and tonal planes. Reach for Soft only to seat a plane, and for Lift only on something that genuinely floats.

## Shapes

Gently rounded and consistent. Controls (buttons, inputs, menus) take the 8px radius; containers (cards, the summary strip, the inset content plane, the auth card, floating callouts) take 11.2px; nav items and small buttons step down to 6.4px, and chart tooltips use the 8px control radius. Pills are reserved for badges and the sample label, and full rounding for the budget bar, its pace line and the category dot. Chart columns round only their top corners (4px). The logo mark is a rounded indigo tile (8px on a 32px tile) holding three ledger rows of decreasing length and opacity.

## Components

### Buttons
Quiet and compact; the primary is the only filled colour on the screen.
- **Shape:** 8px radius, 32px tall by default (36px for the landing's large size, 28px small), 10px horizontal padding, 14px medium text, 16px icons.
- **Primary:** indigo fill with near-white text. Hover drops the fill to 80%.
- **Outline:** paper background, hairline border, hover to the Wash. Used beside a primary ("Sign in").
- **Ghost:** no fill until hover, then the Wash. Icon buttons, row actions, the top-bar toggle.
- **Destructive:** a 10% red tint with red text, never a solid red block.
- **Focus / Press:** a 3px ring in the accent at 50% with the border going to the ring colour; press nudges the button down 1px. Disabled drops to 50% opacity.

### Badges
- **Style:** pill, 20px tall, 12px medium text. The landing's sample label is an outlined pill on paper in Slate text, so it reads as a caption rather than a status.

### Cards / Containers
- **Corner Style:** 11.2px.
- **Background:** Statement White on Paper.
- **Shadow Strategy:** none at rest; see Elevation.
- **Border:** a hairline (or 10% ink ring).
- **Internal Padding:** 16px, 20px from `sm`; headers separated by a hairline.

### Inputs / Fields
- **Style:** 32px tall, 8px radius, 1px `input` border, transparent background (a faint input tint in dark mode), 16px text on mobile and 14px from `md` to avoid zoom on focus. Caret in the accent.
- **Focus:** border goes to the ring colour with a 3px accent ring at 50%.
- **Error / Disabled:** red border with a 20% red ring; disabled at 50% opacity.

### Navigation
- **Style:** sidebar menu buttons with a 16px icon and 14px label in Rail-ink. Hover and active take the Selected Wash; the active item's text and icon turn indigo and carry `aria-current="page"`. Collapses to an icon rail with tooltips on desktop and to a sheet on mobile.

### Summary Strip
The month at a glance: four cells (Spent, Budgeted, Left or Over budget, day N of the month) on one surface, divided by 1px hairline gaps inside an 11.2px container. Each cell is a Slate label, a Stat value and an optional 12px detail. Only "Over budget" colours its value red.

### Budget Pace Bar (signature)
An 8px fully rounded meter on the Wash track. The fill is ink at 70% on track, amber ahead of pace, red over. The pace line is a 2px indigo hairline extending 4px above and below the track, ringed 2px in the page colour, at today's fraction of the month. Fixed bills (housing) draw no pace line and carry the status "Fixed bill, flagged only if over". Under each bar a 12px tabular status line repeats the state in words. The meter exposes a full spoken value ("Food: $120 of $300 spent. Ahead of pace.").

### Charts
Recharts columns at a 24px maximum width with 4px top radii, horizontal hairline gridlines only, no axis lines or ticks. The six-month trend is an emphasis chart: the selected month in indigo with the only value label, the others in Chart Context, and a click on a column opens that month. Income versus spend uses the ordinal ink pair with a small square legend. Every chart is a labelled figure accompanied by a screen-reader table of the same data. Tooltips are popover cards with the Lift shadow and tabular amounts.

### Category Dot
An 8px circle in the category's identity colour, decorative (`aria-hidden`), always placed directly before the category name.

## Do's and Don'ts

### Do:
- **Do** keep one primary button per view, and use the indigo accent only for that action, the current selection, focus and the pace line.
- **Do** colour a budget only by state: ink at 70% on track, amber ahead of pace, red over, with the state repeated in a 12px text line under the bar.
- **Do** draw the pace line on every variable budget bar, and omit it for fixed bills, which read "Fixed bill, flagged only if over".
- **Do** set amounts in columns and status lines with tabular figures; keep large stat values proportional.
- **Do** pair every chart with a screen-reader table and a labelled figure.
- **Do** label sample data as sample wherever product fragments appear outside the signed-in app.
- **Do** separate with 1px hairlines and tonal planes before reaching for a shadow.

### Don't:
- **Don't** use a category hue anywhere except as a swatch beside that category's name.
- **Don't** give a non-category series (Income, Spent) a categorical colour; use the ordinal ink pair.
- **Don't** use green, amber or red decoratively or as an accent.
- **Don't** invent social proof: no testimonials, user counts, ratings, press or savings figures.
- **Don't** bring back gradients, the pink-and-purple palette, confetti or other gamified budgeting-app flourishes.
- **Don't** add a second typeface, all-caps labels or letter-spaced eyebrows above headings.
- **Don't** animate beyond the landing's bar fill-in and short state transitions, and honour reduced motion.
