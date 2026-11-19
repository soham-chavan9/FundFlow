import type { Category } from "./categories";

/** Plain, serialisable shapes handed from server pages to client components. */

export interface ExpenseRow {
  id: string;
  title: string;
  category: Category;
  amountCents: number;
  /** `YYYY-MM-DD` */
  date: string;
  notes: string | null;
}

export interface IncomeRow {
  id: string;
  source: string;
  amountCents: number;
  /** `YYYY-MM-DD` */
  date: string;
  notes: string | null;
}

export type EntryKind = "expense" | "income";

export interface Overspend {
  category: Category;
  overByCents: number;
  limitCents: number;
  /** `YYYY-MM` the budget belongs to. */
  month: string;
}

export type EntryFormState =
  | {
      fieldErrors?: Record<string, string>;
      /** i18n key for a form-level error */
      formError?: string;
      ok?: boolean;
      overspend?: Overspend;
    }
  | undefined;

export type SortKey = "date" | "amount";
export type SortDir = "asc" | "desc";
