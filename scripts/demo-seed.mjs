#!/usr/bin/env node
/**
 * Fills one account with six months of realistic data for presenting
 * FundFlow. Every date is relative to today, so run it shortly before a demo
 * and the current month always looks live: rent paid on the 1st, one budget
 * over, one ahead of pace, the rest on track.
 *
 *   npm run demo:seed                  # account from DEMO_EMAIL in .env.local
 *   npm run demo:seed -- --email a@b.c # or name it
 *   npm run demo:seed -- --yes         # replace data the account already has
 *
 * It replaces that account's expenses, income, budgets and shopping list. The
 * account itself (name, password, currency, language) is left alone.
 */
import { MongoClient, ObjectId } from "mongodb";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const email = (option("email") ?? process.env.DEMO_EMAIL ?? "").trim().toLowerCase();
if (!email) {
  console.error("Name the demo account: set DEMO_EMAIL in .env.local or pass --email.");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (see .env.example).");
  process.exit(1);
}

// Small deterministic generator so a month looks the same on every run.
function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const now = new Date();
const year = now.getUTCFullYear();
const month = now.getUTCMonth();
const today = now.getUTCDate();
const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const pace = today / daysIn(year, month);
const key = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const cents = (dollars) => Math.round(dollars * 100);

const client = new MongoClient(process.env.MONGODB_URI, { appName: "fundflow-demo-seed" });
await client.connect();
try {
  const db = client.db(process.env.MONGODB_DB || "fundflow");
  const user = await db.collection("users").findOne({ email }, { projection: { _id: 1, name: 1 } });
  if (!user) {
    console.error("No account with that email. Register it in the app first.");
    process.exit(1);
  }
  const userId = user._id;
  const collections = ["expenses", "incomes", "budgets", "shoppingItems"];
  const existing = await Promise.all(
    collections.map((c) => db.collection(c).countDocuments({ userId })),
  );
  if (existing.some((n) => n > 0) && !flag("yes")) {
    console.error(
      `That account already has data (${collections.map((c, i) => `${existing[i]} ${c}`).join(", ")}).`,
    );
    console.error("Run again with --yes to replace it.");
    process.exit(1);
  }

  const expenses = [];
  const incomes = [];
  const add = (y, m, d, title, category, dollars, notes) => {
    const date = new Date(Date.UTC(y, m, d));
    expenses.push({
      _id: new ObjectId(),
      userId,
      title,
      category,
      amountCents: cents(dollars),
      date,
      ...(notes ? { notes } : {}),
      createdAt: date,
      updatedAt: date,
    });
  };
  const earn = (y, m, d, source, dollars) => {
    const date = new Date(Date.UTC(y, m, d));
    incomes.push({
      _id: new ObjectId(),
      userId,
      source,
      amountCents: cents(dollars),
      date,
      createdAt: date,
      updatedAt: date,
    });
  };
  /** Splits a total over the given days with some jitter; the parts add up exactly. */
  const spread = (total, days, titles, category, rand, y, m) => {
    const weights = days.map(() => 0.6 + rand() * 0.8);
    const sum = weights.reduce((a, b) => a + b, 0);
    let left = cents(total);
    days.forEach((d, i) => {
      const part = i === days.length - 1 ? left : Math.round((cents(total) * weights[i]) / sum);
      left -= part;
      if (part > 0) add(y, m, d, titles[i % titles.length], category, part / 100);
    });
  };

  // Five finished months.
  for (let back = 5; back >= 1; back--) {
    const d = new Date(Date.UTC(year, month - back, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const rand = rng(y * 100 + m + 7);
    add(y, m, 1, "Rent", "housing", 1450, "Apartment, unit 4B");
    add(y, m, 3, "Electricity", "housing", 58 + rand() * 40);
    spread(
      470 + rand() * 90,
      [2, 5, 8, 11, 14, 17, 20, 23, 26],
      ["Groceries", "Farmers market", "Bakery"],
      "food",
      rand,
      y,
      m,
    );
    spread(
      90 + rand() * 60,
      [4, 10, 16, 22, 27],
      ["Lunch with team", "Coffee", "Dinner out", "Takeout"],
      "food",
      rand,
      y,
      m,
    );
    add(y, m, 2, "Transit pass", "transport", 86);
    spread(30 + rand() * 40, [9, 19], ["Ride share"], "transport", rand, y, m);
    add(y, m, 6, "Streaming subscription", "entertainment", 15.99);
    add(y, m, 18, back % 2 ? "Movie night" : "Board game cafe", "entertainment", 24 + rand() * 40);
    add(y, m, 11, "Haircut", "selfCare", 35);
    if (back % 2 === 0) add(y, m, 16, "Pharmacy", "medical", 18 + rand() * 30);
    if (back === 4)
      add(y, m, 21, "Weekend trip to the coast", "travel", 412.4, "Train and two nights");
    if (back === 2) add(y, m, 24, "Flight home", "travel", 186.2);
    if (back === 3) add(y, m, 19, "Birthday gift", "other", 48);
    earn(y, m, 1, "Salary", 4200);
    if (back % 2 === 1) earn(y, m, 15, "Freelance design", 650);
  }

  // The current month, up to today: housing paid, food ahead of pace,
  // entertainment over budget, transport and self care on track.
  {
    const rand = rng(year * 100 + month + 7);
    const upTo = (days) => days.filter((d) => d <= today);
    add(year, month, 1, "Rent", "housing", 1450, "Apartment, unit 4B");
    if (today >= 3) add(year, month, 3, "Electricity", "housing", 76.4);
    const foodDays = upTo([1, 3, 5, 8, 10, 13, 15, 18, 21, 24, 27]);
    spread(
      500 * Math.min(0.97, pace + 0.14),
      foodDays,
      ["Groceries", "Farmers market", "Coffee", "Dinner out", "Bakery"],
      "food",
      rand,
      year,
      month,
    );
    const rideDays = upTo([2, 7, 12, 17, 22, 27]);
    spread(
      Math.max(6, 150 * pace * 0.85),
      rideDays,
      ["Ride share", "Bus fare", "Bike share"],
      "transport",
      rand,
      year,
      month,
    );
    add(year, month, Math.min(6, today), "Streaming subscription", "entertainment", 15.99);
    add(
      year,
      month,
      Math.max(1, today - 6),
      "Concert tickets",
      "entertainment",
      128,
      "Two tickets, floor seats",
    );
    add(year, month, Math.min(11, today), "Haircut", "selfCare", 35);
    if (today >= 10) add(year, month, 10, "Pharmacy", "medical", 18.4);
    if (today >= 15) add(year, month, 15, "Gift for a friend", "other", 42);
    earn(year, month, 1, "Salary", 4200);
    if (today >= 15) earn(year, month, 15, "Freelance design", 650);
  }

  const updatedAt = new Date();
  const limits = {
    food: 500,
    housing: 1550,
    transport: 150,
    entertainment: 120,
    selfCare: 80,
    medical: 60,
  };
  const budgets = [];
  for (const [y, m] of [
    [
      new Date(Date.UTC(year, month - 1, 1)).getUTCFullYear(),
      new Date(Date.UTC(year, month - 1, 1)).getUTCMonth(),
    ],
    [year, month],
  ]) {
    for (const [category, dollars] of Object.entries(limits)) {
      budgets.push({
        _id: new ObjectId(),
        userId,
        month: key(y, m),
        category,
        limitCents: cents(dollars),
        updatedAt,
      });
    }
  }
  // Last month also budgeted travel, so "copy last month" has something to offer.
  const prev = new Date(Date.UTC(year, month - 1, 1));
  budgets.push({
    _id: new ObjectId(),
    userId,
    month: key(prev.getUTCFullYear(), prev.getUTCMonth()),
    category: "travel",
    limitCents: cents(300),
    updatedAt,
  });

  const shopping = [
    ["Oat milk", false],
    ["Coffee beans", false],
    ["Dish soap", false],
    ["Birthday card", false],
    ["Batteries (AA)", true],
    ["Paper towels", true],
  ].map(([name, done], i) => ({
    _id: new ObjectId(),
    userId,
    name,
    done,
    createdAt: new Date(updatedAt.getTime() - i * 60_000),
  }));

  await Promise.all(collections.map((c) => db.collection(c).deleteMany({ userId })));
  await db.collection("expenses").insertMany(expenses);
  await db.collection("incomes").insertMany(incomes);
  await db.collection("budgets").insertMany(budgets);
  await db.collection("shoppingItems").insertMany(shopping);
  console.log(
    `Demo data ready: ${expenses.length} expenses, ${incomes.length} income entries, ` +
      `${budgets.length} budgets and ${shopping.length} shopping items, through ${key(year, month)}-${String(today).padStart(2, "0")}.`,
  );
} finally {
  await client.close();
}
