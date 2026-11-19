import { isCategory, type Category } from "./categories";
import { resolveMonth } from "./month-param";
import type { SortDir, SortKey } from "./entry-types";

/**
 * List state (month, search, category, sort, page) lives in the URL so it is
 * shareable and survives reloads. This parses it and builds links back.
 */

export interface ListState {
  month: string;
  q: string;
  category?: Category;
  sort: SortKey;
  dir: SortDir;
  page: number;
}

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseListState(params: Params, now = new Date()): ListState {
  const category = first(params.category);
  const page = Number.parseInt(first(params.page) ?? "", 10);
  return {
    month: resolveMonth(params.month, now),
    q: (first(params.q) ?? "").trim().slice(0, 100),
    category: isCategory(category) ? category : undefined,
    sort: first(params.sort) === "amount" ? "amount" : "date",
    dir: first(params.dir) === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/**
 * A link to `base` with the given state, leaving out defaults so URLs stay
 * short. `currentMonth` is dropped too, matching the month switcher.
 */
export function listHref(base: string, state: Partial<ListState>, currentMonth: string): string {
  const qs = new URLSearchParams();
  if (state.month && state.month !== currentMonth) qs.set("month", state.month);
  if (state.q) qs.set("q", state.q);
  if (state.category) qs.set("category", state.category);
  if (state.sort && state.sort !== "date") qs.set("sort", state.sort);
  if (state.dir && state.dir !== "desc") qs.set("dir", state.dir);
  if (state.page && state.page > 1) qs.set("page", String(state.page));
  const query = qs.toString();
  return query ? `${base}?${query}` : base;
}
