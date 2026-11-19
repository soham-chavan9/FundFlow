export const CATEGORIES = [
  "food",
  "housing",
  "transport",
  "entertainment",
  "medical",
  "selfCare",
  "travel",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

/**
 * Categories usually paid as one fixed bill (rent) rather than spread through
 * the month. Their budgets are not judged against the pace line, otherwise
 * rent paid on the 1st would read as "ahead of pace" all month.
 */
export const FIXED_CATEGORIES: readonly Category[] = ["housing"];

export function isFixedCategory(category: Category): boolean {
  return FIXED_CATEGORIES.includes(category);
}

/** Chart colour slot for each category (maps to --chart-N / --cat-* tokens). */
export const CATEGORY_COLOR: Record<Category, string> = {
  food: "var(--cat-food)",
  housing: "var(--cat-housing)",
  transport: "var(--cat-transport)",
  entertainment: "var(--cat-entertainment)",
  medical: "var(--cat-medical)",
  selfCare: "var(--cat-selfcare)",
  travel: "var(--cat-travel)",
  other: "var(--cat-other)",
};
