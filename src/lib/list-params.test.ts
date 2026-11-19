import { describe, expect, it } from "vitest";
import { listHref, parseListState } from "./list-params";

const now = new Date(Date.UTC(2026, 10, 19));

describe("parseListState", () => {
  it("defaults to this month, newest first, page 1", () => {
    expect(parseListState({}, now)).toEqual({
      month: "2026-11",
      q: "",
      category: undefined,
      sort: "date",
      dir: "desc",
      page: 1,
    });
  });

  it("reads valid params and ignores junk", () => {
    expect(
      parseListState(
        {
          month: "2026-09",
          q: "  coffee ",
          category: "food",
          sort: "amount",
          dir: "asc",
          page: "3",
        },
        now,
      ),
    ).toEqual({
      month: "2026-09",
      q: "coffee",
      category: "food",
      sort: "amount",
      dir: "asc",
      page: 3,
    });
    const junk = parseListState(
      { month: "2026-99", category: "gadgets", sort: "title", dir: "up", page: "-2" },
      now,
    );
    expect(junk).toMatchObject({
      month: "2026-11",
      category: undefined,
      sort: "date",
      dir: "desc",
      page: 1,
    });
  });

  it("caps very long searches", () => {
    expect(parseListState({ q: "x".repeat(500) }, now).q).toHaveLength(100);
  });
});

describe("listHref", () => {
  it("drops defaults and the current month", () => {
    expect(
      listHref("/expenses", { month: "2026-11", sort: "date", dir: "desc", page: 1 }, "2026-11"),
    ).toBe("/expenses");
  });

  it("keeps everything that differs from the defaults", () => {
    expect(
      listHref(
        "/expenses",
        {
          month: "2026-09",
          q: "rent & bills",
          category: "housing",
          sort: "amount",
          dir: "asc",
          page: 2,
        },
        "2026-11",
      ),
    ).toBe("/expenses?month=2026-09&q=rent+%26+bills&category=housing&sort=amount&dir=asc&page=2");
  });
});
