import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { toCsv } from "@/lib/csv";
import { parseListState } from "@/lib/list-params";
import { centsToInput } from "@/lib/money";
import { allExpenses } from "@/server/ledger";

/** Downloads the expenses currently in view (month, search, category) as CSV. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const state = parseListState(Object.fromEntries(new URL(request.url).searchParams));
  const rows = await allExpenses(user.id, state);
  const t = await getTranslations();

  const csv = toCsv([
    [
      t("entries.date"),
      t("expenses.labelField"),
      t("entries.category"),
      t("entries.amount"),
      t("entries.currency"),
      t("entries.notes"),
    ],
    ...rows.map((r) => [
      r.date,
      r.title,
      t(`categories.${r.category}`),
      centsToInput(r.amountCents),
      user.currency,
      r.notes,
    ]),
  ]);

  // The BOM makes Excel read the file as UTF-8, so accents and Chinese survive.
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fundflow-expenses-${state.month}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
