import { CATEGORIES, isFixedCategory } from "@/lib/categories";
import { monthProgress } from "@/lib/dates";
import { budgetPace, type BudgetMap, type CategoryTotals } from "@/lib/finance";

/**
 * The landing page's sample month. Every figure here is labelled "Sample data"
 * wherever it shows; nothing on the page claims these are real users.
 */
export const SAMPLE_MONTH = "2026-11";
export const SAMPLE_NOW = new Date(Date.UTC(2026, 10, 19));

export const SAMPLE_SPENT: CategoryTotals = {
  food: 37_601,
  housing: 152_600,
  transport: 14_004,
  entertainment: 14_399,
  medical: 0,
  selfCare: 6_500,
  travel: 0,
  other: 0,
};

export const SAMPLE_BUDGETS: BudgetMap = {
  food: 50_000,
  housing: 155_000,
  transport: 15_000,
  entertainment: 12_000,
  selfCare: 8_000,
};

export const SAMPLE_TREND = [
  { month: "2026-06", cents: 230_654 },
  { month: "2026-07", cents: 236_688 },
  { month: "2026-08", cents: 266_309 },
  { month: "2026-09", cents: 223_940 },
  { month: "2026-10", cents: 235_282 },
  { month: "2026-11", cents: 225_104 },
];

export const SAMPLE_INCOME_CENTS = 485_000;

export function sampleBudgetLines() {
  const progress = monthProgress(SAMPLE_MONTH, SAMPLE_NOW);
  return CATEGORIES.filter((c) => SAMPLE_BUDGETS[c] !== undefined)
    .map((category) => ({
      category,
      pace: budgetPace(SAMPLE_SPENT[category], SAMPLE_BUDGETS[category]!, progress, {
        fixed: isFixedCategory(category),
      }),
    }))
    .sort((a, b) => b.pace.ratio - a.pace.ratio);
}
