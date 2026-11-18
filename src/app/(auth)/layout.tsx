import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { LanguageMenu } from "@/components/preferences/language-menu";
import { ThemeToggle } from "@/components/preferences/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bg-sidebar flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Wordmark />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageMenu />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:items-center sm:pt-0">
        <div className="bg-card w-full max-w-[400px] rounded-xl border p-6 shadow-[var(--shadow-lift)] sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
