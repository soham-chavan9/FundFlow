import "server-only";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { lastMonths, toMonthKey } from "@/lib/dates";
import type { ChatMessage, FinanceContextInput } from "@/lib/assistant/context";
import type { CurrentUser } from "@/lib/types";
import { categoryTotals, getBudgets, listExpenses, monthlyTotals } from "./ledger";

/**
 * Gemini's stable general model as of November 2026 (Google's pick for new
 * projects). Override with GEMINI_MODEL.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-4-hydrogen";

/** The assistant's settings, or null when no API key is configured. */
export function assistantConfig(): { apiKey: string; model: string } | null {
  const { GEMINI_API_KEY, GEMINI_MODEL } = env();
  return GEMINI_API_KEY
    ? { apiKey: GEMINI_API_KEY, model: GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL }
    : null;
}

/** The last three months of the signed-in user's data, summarised for the model. */
export async function loadFinanceContext(
  user: CurrentUser,
  now = new Date(),
): Promise<FinanceContextInput> {
  const months = lastMonths(toMonthKey(now), 3);
  const current = months[months.length - 1];
  const [spent, income, budgets, largest] = await Promise.all([
    Promise.all(months.map((m) => categoryTotals(user.id, m))),
    monthlyTotals(user.id, "incomes", months),
    getBudgets(user.id, current),
    listExpenses(user.id, { month: current, sort: "amount", dir: "desc", page: 1 }),
  ]);
  return {
    firstName: user.name.split(/\s+/)[0] ?? user.name,
    currency: user.currency,
    months: months.map((month, i) => ({ month, spent: spent[i], incomeCents: income[i].cents })),
    budgets,
    topExpenses: largest.rows.slice(0, 5).map((r) => ({
      title: r.title,
      category: r.category,
      amountCents: r.amountCents,
      date: r.date,
    })),
    now,
  };
}

/** Streams the model's reply as text chunks. Throws before yielding if the request is rejected. */
export async function streamReply({
  apiKey,
  model,
  system,
  messages,
  signal,
}: {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}): Promise<AsyncGenerator<string>> {
  const ai = new GoogleGenAI({ apiKey });
  const stream = await ai.models.generateContentStream({
    model,
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    config: {
      systemInstruction: system,
      temperature: 0.3,
      maxOutputTokens: 1024,
      abortSignal: signal,
    },
  });
  return (async function* () {
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  })();
}
