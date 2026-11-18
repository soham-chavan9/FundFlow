import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "./env";
import type { BudgetDoc, ExpenseDoc, IncomeDoc, ShoppingItemDoc, UserDoc } from "./types";

// Reuse one client across hot reloads in dev and across invocations in prod.
const g = globalThis as unknown as {
  _ffMongo?: Promise<MongoClient>;
  _ffIndexes?: Promise<void>;
};

function getClient(): Promise<MongoClient> {
  if (!g._ffMongo) {
    const client = new MongoClient(env().MONGODB_URI, { appName: "fundflow" });
    g._ffMongo = client.connect().catch((err) => {
      g._ffMongo = undefined; // let the next request retry
      throw err;
    });
  }
  return g._ffMongo;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("expenses").createIndex({ userId: 1, date: -1 }),
    db.collection("incomes").createIndex({ userId: 1, date: -1 }),
    db.collection("budgets").createIndex({ userId: 1, month: 1, category: 1 }, { unique: true }),
    db.collection("shoppingItems").createIndex({ userId: 1, done: 1, createdAt: -1 }),
  ]);
}

async function getDb(): Promise<Db> {
  const db = (await getClient()).db(env().MONGODB_DB);
  g._ffIndexes ??= ensureIndexes(db).catch((err) => {
    g._ffIndexes = undefined;
    throw err;
  });
  await g._ffIndexes;
  return db;
}

export async function collections() {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    expenses: db.collection<ExpenseDoc>("expenses"),
    incomes: db.collection<IncomeDoc>("incomes"),
    budgets: db.collection<BudgetDoc>("budgets"),
    shoppingItems: db.collection<ShoppingItemDoc>("shoppingItems"),
  };
}
