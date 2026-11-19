import { describe, expect, it } from "vitest";
import {
  budgetPace,
  buildMonthlyReport,
  buildYearlyReport,
  emptyCategoryTotals,
  fillMonths,
  overspendAfterChange,
  percentChange,
  savingsRate,
  shareOf,
  totalsByCategory,
} from "./finance";

describe("totalsByCategory", () => {
  it("sums per category and keeps every category", () => {
    const totals = totalsByCategory([
      { category: "food", amountCents: 1250 },
      { category: "food", amountCents: 750 },
      { category: "travel", amountCents: 10_000 },
    ]);
    expect(totals.food).toBe(2000);
    expect(totals.travel).toBe(10_000);
    expect(totals.housing).toBe(0);
    expect(Object.keys(totals)).toHaveLength(8);
  });
});

describe("ratios", () => {
  it("shareOf is 0 for an empty total", () => {
    expect(shareOf(5, 0)).toBe(0);
    expect(shareOf(25, 100)).toBe(0.25);
  });

  it("percentChange is null without a baseline", () => {
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(150, 100)).toBe(0.5);
    expect(percentChange(50, 100)).toBe(-0.5);
  });

  it("savingsRate handles no income and overspending", () => {
    expect(savingsRate(0, 100)).toBeNull();
    expect(savingsRate(1000, 250)).toBe(0.75);
    expect(savingsRate(1000, 1500)).toBe(-0.5);
  });
});

describe("budgetPace", () => {
  const midMonth = { days: 30, elapsed: 15 };

  it("is on track at or under the straight line", () => {
    const pace = budgetPace(15_000, 30_000, midMonth);
    expect(pace.state).toBe("onTrack");
    expect(pace.paceRatio).toBe(0.5);
    expect(pace.ratio).toBe(0.5);
    expect(pace.remainingCents).toBe(15_000);
  });

  it("tolerates a little slack before flagging ahead", () => {
    // 54% spent at 50% of the month: inside the 5% slack.
    expect(budgetPace(16_200, 30_000, midMonth).state).toBe("onTrack");
    // 60% spent at 50% of the month.
    expect(budgetPace(18_000, 30_000, midMonth).state).toBe("ahead");
  });

  it("is over once spend passes the limit, with negative remaining", () => {
    const pace = budgetPace(33_000, 30_000, midMonth);
    expect(pace.state).toBe("over");
    expect(pace.remainingCents).toBe(-3000);
    expect(pace.ratio).toBeCloseTo(1.1);
  });

  it("spending exactly the limit is not over", () => {
    expect(budgetPace(30_000, 30_000, { days: 30, elapsed: 30 }).state).toBe("onTrack");
  });

  it("a fixed bill is never ahead of pace, only over", () => {
    const rent = budgetPace(145_000, 150_000, { days: 30, elapsed: 1 }, { fixed: true });
    expect(rent.state).toBe("onTrack");
    expect(rent.paceRatio).toBe(1);
    expect(budgetPace(155_000, 150_000, { days: 30, elapsed: 1 }, { fixed: true }).state).toBe(
      "over",
    );
  });

  it("a finished month cannot be ahead, only over", () => {
    expect(budgetPace(29_999, 30_000, { days: 30, elapsed: 30 }).state).toBe("onTrack");
  });
});

describe("overspendAfterChange", () => {
  it("warns when a change pushes a category over", () => {
    expect(overspendAfterChange(9000, 11_000, 10_000)).toBe(1000);
  });

  it("warns again when adding to a category already over", () => {
    expect(overspendAfterChange(11_000, 12_000, 10_000)).toBe(2000);
  });

  it("stays quiet without a budget, under the limit, or when the total went down", () => {
    expect(overspendAfterChange(0, 50_000, undefined)).toBeNull();
    expect(overspendAfterChange(5000, 10_000, 10_000)).toBeNull();
    expect(overspendAfterChange(12_000, 11_000, 10_000)).toBeNull();
  });
});

describe("fillMonths", () => {
  it("fills gaps with zero and keeps axis order", () => {
    expect(
      fillMonths(
        ["2026-09", "2026-10", "2026-11"],
        [
          { month: "2026-11", cents: 500 },
          { month: "2026-09", cents: 200 },
          { month: "2026-08", cents: 999 },
        ],
      ),
    ).toEqual([
      { month: "2026-09", cents: 200 },
      { month: "2026-10", cents: 0 },
      { month: "2026-11", cents: 500 },
    ]);
  });
});

describe("buildMonthlyReport", () => {
  it("orders by spend, compares with last month and skips idle categories", () => {
    const current = { ...emptyCategoryTotals(), food: 30_000, travel: 10_000 };
    const previous = { ...emptyCategoryTotals(), food: 20_000, medical: 5000 };
    const report = buildMonthlyReport(current, previous, { food: 25_000, housing: 120_000 });

    expect(report.rows.map((r) => r.category)).toEqual(["food", "travel", "housing", "medical"]);
    expect(report.totalCents).toBe(40_000);
    expect(report.previousTotalCents).toBe(25_000);
    expect(report.change).toBeCloseTo(0.6);
    expect(report.budgetedCents).toBe(145_000);

    const food = report.rows[0];
    expect(food.share).toBe(0.75);
    expect(food.change).toBe(0.5);
    expect(food.budgetCents).toBe(25_000);

    const travel = report.rows[1];
    expect(travel.change).toBeNull();
    expect(travel.budgetCents).toBeNull();
  });
});

describe("buildYearlyReport", () => {
  it("builds twelve months and averages only months that have started", () => {
    const report = buildYearlyReport(
      2026,
      [
        { month: "2026-01", cents: 10_000 },
        { month: "2026-02", cents: 20_000 },
      ],
      [{ month: "2026-01", cents: 50_000 }],
      "2026-03",
    );
    expect(report.rows).toHaveLength(12);
    expect(report.rows[0]).toEqual({
      month: "2026-01",
      spentCents: 10_000,
      incomeCents: 50_000,
      netCents: 40_000,
    });
    expect(report.spentCents).toBe(30_000);
    expect(report.incomeCents).toBe(50_000);
    expect(report.netCents).toBe(20_000);
    expect(report.averageSpentCents).toBe(10_000);
  });

  it("has no average before the year starts", () => {
    expect(buildYearlyReport(2030, [], [], "2026-11").averageSpentCents).toBeNull();
  });

  it("averages from the first active month, not from January", () => {
    const report = buildYearlyReport(
      2026,
      [
        { month: "2026-06", cents: 30_000 },
        { month: "2026-07", cents: 10_000 },
      ],
      [],
      "2026-08",
    );
    // June, July and August count (August with nothing spent yet).
    expect(report.averageSpentCents).toBe(13_333);
  });
});
