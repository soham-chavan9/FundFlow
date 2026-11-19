import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

/**
 * Decorative by default: every spinner in the app sits beside text that says
 * what is happening ("Saving…"), so it stays out of the accessibility tree
 * instead of announcing an untranslated "Loading".
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      aria-hidden
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
