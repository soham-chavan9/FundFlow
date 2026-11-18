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
