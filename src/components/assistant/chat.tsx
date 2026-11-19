"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw, Sparkles, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type Role = "user" | "model";
interface Message {
  id: number;
  role: Role;
  text: string;
}

const ERROR_KEYS: Record<number, string> = {
  401: "assistant.signedOut",
  429: "assistant.rateLimited",
  503: "assistant.notConfiguredBody",
};

/**
 * The conversation lives only in this component: nothing is stored, and a
 * reload starts fresh. Replies stream in as they are written; Stop aborts the
 * request.
 */
export function AssistantChat({ suggestions }: { suggestions: string[] }) {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, error]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(history: Message[]) {
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setError(null);
    const replyId = nextId.current++;
    setMessages([...history, { id: replyId, role: "model", text: "" }]);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, text }) => ({ role, text })) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setMessages(history);
        setError(ERROR_KEYS[res.status] ?? "assistant.failed");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((m) => (m.id === replyId ? { ...m, text: m.text + piece } : m)),
        );
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError("assistant.failed");
    } finally {
      setStreaming(false);
      abortRef.current = null;
      // Drop an empty reply (stopped before any text, or failed).
      setMessages((current) => current.filter((m) => m.id !== replyId || m.text.trim()));
      inputRef.current?.focus();
    }
  }

  function ask(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    setDraft("");
    // Keep the request within the server's limit of 20 messages.
    const history = [...messages, { id: nextId.current++, role: "user" as const, text: question }];
    void send(history.slice(-19));
  }

  function retry() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) void send(messages.slice(0, messages.lastIndexOf(lastUser) + 1));
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1" aria-live="polite" aria-busy={streaming}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-start gap-4 pt-6 sm:pt-12">
              <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{t("assistant.introTitle")}</h2>
                <p className="text-muted-foreground mt-1 max-w-prose text-sm">
                  {t("assistant.introBody")}
                </p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <li key={s}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-1.5 text-left whitespace-normal"
                      onClick={() => ask(s)}
                    >
                      {s}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" && "justify-end")}>
                {m.role === "user" ? (
                  <p className="bg-secondary text-secondary-foreground max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap">
                    <span className="sr-only">{t("assistant.you")}: </span>
                    {m.text}
                  </p>
                ) : (
                  <div className="max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap">
                    <span className="sr-only">{t("assistant.name")}: </span>
                    {m.text ? (
                      m.text
                    ) : (
                      <span className="text-muted-foreground inline-flex items-center gap-2">
                        <Spinner /> {t("assistant.thinking")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {error ? (
            <div className="border-destructive/30 bg-destructive/5 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm">
              <p className="text-destructive flex-1">{t(error as Parameters<typeof t>[0])}</p>
              {error === "assistant.failed" ? (
                <Button variant="outline" size="sm" onClick={retry}>
                  <RotateCcw />
                  {t("common.retry")}
                </Button>
              ) : null}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      <div className="bg-background sticky bottom-0 border-t md:rounded-b-xl">
        <form
          className="mx-auto flex w-full max-w-3xl flex-col gap-2 p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <div className="bg-card focus-within:border-ring focus-within:ring-ring/50 flex items-end gap-2 rounded-xl border p-2 focus-within:ring-3">
            <label htmlFor="assistant-input" className="sr-only">
              {t("assistant.inputLabel")}
            </label>
            <Textarea
              ref={inputRef}
              id="assistant-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  ask(draft);
                }
              }}
              placeholder={t("assistant.placeholder")}
              maxLength={2000}
              rows={1}
              className="max-h-40 min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            {streaming ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => abortRef.current?.abort()}
                aria-label={t("assistant.stop")}
              >
                <Square className="fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!draft.trim()}
                aria-label={t("assistant.send")}
              >
                <ArrowUp />
              </Button>
            )}
          </div>
          <p className="text-muted-foreground px-1 text-xs">{t("assistant.privacy")}</p>
        </form>
      </div>
    </div>
  );
}
