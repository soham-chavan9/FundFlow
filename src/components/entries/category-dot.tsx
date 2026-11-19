import { cn } from "cn";
import { CATEGORY_COLOR, type Category } from "@/lib/categories";

/** The category's data colour, as a small swatch next to its name. Decorative. */
export function CategoryDot({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: CATEGORY_COLOR[category] }}
    />
  );
}
