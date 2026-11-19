import { getLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { buildSystemInstruction, chatRequestSchema } from "@/lib/assistant/context";
import { createRateLimiter } from "@/lib/rate-limit";
import { assistantConfig, loadFinanceContext, streamReply } from "@/server/assistant";

/** 20 questions per user per 10 minutes protects the API key from runaway use. */
const g = globalThis as unknown as { _ffAssistantLimit?: ReturnType<typeof createRateLimiter> };
const limit = (g._ffAssistantLimit ??= createRateLimiter({ limit: 20, windowMs: 10 * 60_000 }));

function problem(status: number, error: string, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

/**
 * POST { messages } -> a plain-text stream of the assistant's reply. The
 * conversation lives in the browser; the server adds the user's own data
 * summary each time and keeps nothing.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return problem(401, "unauthorized");

  const config = assistantConfig();
  if (!config) return problem(503, "not_configured");

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return problem(400, "bad_request");

  const allowed = limit(user.id);
  if (!allowed.ok) {
    return problem(429, "rate_limited", {
      "Retry-After": String(Math.ceil(allowed.retryAfterMs / 1000)),
    });
  }

  const [context, locale] = await Promise.all([loadFinanceContext(user), getLocale()]);
  let chunks: AsyncGenerator<string>;
  try {
    chunks = await streamReply({
      ...config,
      system: buildSystemInstruction(context, locale),
      messages: parsed.data.messages,
      signal: request.signal,
    });
  } catch (err) {
    console.error("assistant: model request failed", err instanceof Error ? err.message : err);
    return problem(502, "upstream");
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await chunks.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(value));
      } catch (err) {
        console.error("assistant: stream failed", err instanceof Error ? err.message : err);
        controller.error(err);
      }
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
