import { describe, expect, it } from "vitest";
import {
  isMonthKey,
  lastMonths,
  monthProgress,
  monthRange,
  parseDateInput,
  shiftMonth,
  toDateInput,
  toMonthKey,
} from "./dates";

describe("month keys", () => {
  it("validates keys", () => {
    expect(isMonthKey("2026-11")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-1")).toBe(false);
    expect(isMonthKey(202611)).toBe(false);
  });

  it("builds a key from a date in UTC", () => {
    expect(toMonthKey(new Date(Date.UTC(2026, 0, 31, 23, 59)))).toBe("2026-01");
  });

  it("returns a half-open range", () => {
    const { start, end } = monthRange("2026-02");
    expect(start.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("shifts across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-05", -17)).toBe("2024-12");
  });

  it("lists trailing months oldest first", () => {
    expect(lastMonths("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("date inputs", () => {
  it("round-trips a calendar date", () => {
    const d = parseDateInput("2026-11-18");
    expect(d?.toISOString()).toBe("2026-11-18T00:00:00.000Z");
    expect(toDateInput(d!)).toBe("2026-11-18");
  });

  it.each(["2026-02-30", "2026-13-01", "18/11/2026", "", "2026-1-5"])("rejects %j", (v) => {
    expect(parseDateInput(v)).toBeNull();
  });
});

describe("monthProgress", () => {
  it("counts elapsed days within the month", () => {
    expect(monthProgress("2026-11", new Date(Date.UTC(2026, 10, 18, 12)))).toEqual({
      days: 30,
      elapsed: 18,
    });
  });

  it("clamps for past and future months", () => {
    const now = new Date(Date.UTC(2026, 10, 18));
    expect(monthProgress("2026-10", now)).toEqual({ days: 31, elapsed: 31 });
    expect(monthProgress("2026-12", now)).toEqual({ days: 31, elapsed: 0 });
  });
});
