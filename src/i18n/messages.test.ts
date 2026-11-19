import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import zh from "../../messages/zh.json";

type Tree = { [key: string]: string | Tree };

/** Every leaf as "a.b.c" -> message. */
function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

/**
 * Argument names a message uses at any depth: {name}, and {count, plural, ...}
 * including names inside plural branches. Branch bodies ("{# items}",
 * "{Copy the budget}") don't match because they don't start with a bare name
 * followed by "," or "}".
 */
function placeholders(message: string): string[] {
  return [...new Set([...message.matchAll(/\{\s*([A-Za-z_]\w*)\s*[,}]/g)].map((m) => m[1]))].sort();
}

const base = flatten(en as Tree);
const locales = { es: flatten(es as Tree), zh: flatten(zh as Tree) };

describe("translations", () => {
  for (const [locale, messages] of Object.entries(locales)) {
    it(`${locale} has exactly the English keys`, () => {
      const missing = [...base.keys()].filter((k) => !messages.has(k));
      const extra = [...messages.keys()].filter((k) => !base.has(k));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });

    it(`${locale} uses the same placeholders as English`, () => {
      const mismatched = [...base.entries()]
        .filter(([key]) => messages.has(key))
        .filter(
          ([key, message]) =>
            placeholders(message).join() !== placeholders(messages.get(key)!).join(),
        )
        .map(([key]) => key);
      expect(mismatched).toEqual([]);
    });

    it(`${locale} has no empty messages`, () => {
      expect([...messages.entries()].filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([]);
    });
  }
});
