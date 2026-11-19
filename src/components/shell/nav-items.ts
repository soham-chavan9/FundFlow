import {
  ArrowDownToLine,
  ChartNoAxesColumn,
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  ReceiptText,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "overview"
  | "expenses"
  | "income"
  | "budgets"
  | "insights"
  | "shopping"
  | "assistant"
  | "settings";

export interface NavItem {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  /** Carries ?month= across navigation. */
  monthScoped?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard, monthScoped: true },
  { key: "expenses", href: "/expenses", icon: ReceiptText, monthScoped: true },
  { key: "income", href: "/income", icon: ArrowDownToLine, monthScoped: true },
  { key: "budgets", href: "/budgets", icon: PiggyBank, monthScoped: true },
  { key: "insights", href: "/insights", icon: ChartNoAxesColumn, monthScoped: true },
];

export const SECONDARY_NAV: NavItem[] = [
  { key: "shopping", href: "/shopping", icon: ListChecks },
  { key: "assistant", href: "/assistant", icon: Sparkles },
];

export const SETTINGS_NAV: NavItem = { key: "settings", href: "/settings", icon: Settings };
