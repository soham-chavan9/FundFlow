import type { ObjectId } from "mongodb";
import type { Category } from "./categories";
import type { Currency } from "./money";
import type { Locale } from "@/i18n/locales";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  /** Always stored lowercased and trimmed. */
  email: string;
  passwordHash: string;
  currency: Currency;
  locale: Locale;
  createdAt: Date;
}

export interface ExpenseDoc {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  category: Category;
  amountCents: number;
  /** Calendar date, stored at UTC midnight. */
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeDoc {
  _id: ObjectId;
  userId: ObjectId;
  source: string;
  amountCents: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetDoc {
  _id: ObjectId;
  userId: ObjectId;
  /** `YYYY-MM` */
  month: string;
  category: Category;
  limitCents: number;
  updatedAt: Date;
}

export interface ShoppingItemDoc {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  done: boolean;
  createdAt: Date;
}

/** What the rest of the app gets to know about the signed-in user. Never includes the hash. */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  currency: Currency;
  locale: Locale;
}
