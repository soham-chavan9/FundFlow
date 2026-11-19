import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  FileDown,
  Languages,
  ListChecks,
  MoonStar,
  Smartphone,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { Wordmark } from "@/components/brand";
import {
  SampleBadge,
  AddExpenseFragment,
  AssistantFragment,
  InsightsFragment,
  OverviewFrame,
  PaceFragment,
} from "@/components/landing/fragments";
import { LanguageMenu } from "@/components/preferences/language-menu";
import { ThemeToggle } from "@/components/preferences/theme-toggle";
import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/soham-chavan9/FundFlow";

function Feature({
  id,
  title,
  body,
  children,
  flip,
}: {
  id: string;
  title: string;
  body: string;
  children: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16"
    >
      <div className={flip ? "lg:order-2 lg:col-span-5 lg:col-start-8" : "lg:col-span-5"}>
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
        <p className="text-muted-foreground mt-4 max-w-prose text-base leading-relaxed text-pretty">
          {body}
        </p>
      </div>
      <div className={flip ? "lg:order-1 lg:col-span-7" : "lg:col-span-7"}>
        {children}
        <SampleBadge className="mt-3" />
      </div>
    </section>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const [t, locale, user, params] = await Promise.all([
    getTranslations("landing"),
    getLocale(),
    getCurrentUser(),
    searchParams,
  ]);

  const primary = user ? (
    <Button asChild size="lg">
      <Link href="/dashboard">
        {t("openApp")}
        <ArrowRight />
      </Link>
    </Button>
  ) : (
    <Button asChild size="lg">
      <Link href="/register">{t("createAccount")}</Link>
    </Button>
  );

  const also = [
    { icon: ArrowDownToLine, label: t("alsoIncome") },
    { icon: ListChecks, label: t("alsoShopping") },
    { icon: FileDown, label: t("alsoCsv") },
    { icon: Languages, label: t("alsoLanguages") },
    { icon: MoonStar, label: t("alsoThemes") },
    { icon: Smartphone, label: t("alsoPhone") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/95 sticky top-0 z-20 border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link
            href="/"
            className="mr-auto rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <Wordmark />
          </Link>
          <LanguageMenu />
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm" className="ml-1">
              <Link href="/dashboard">{t("openApp")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="ml-1 max-sm:hidden">
                <Link href="/login">{t("signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("createAccountShort")}</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">
        {params.deleted !== undefined ? (
          <p
            role="status"
            className="bg-muted text-foreground mx-auto mt-6 w-fit max-w-[calc(100%-2rem)] rounded-lg px-4 py-2.5 text-sm"
          >
            {t("deleted")}
          </p>
        ) : null}

        <section
          aria-labelledby="hero"
          className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24"
        >
          <h1
            id="hero"
            className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl"
          >
            {t("heroTitle")}
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
            {t("heroBody")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {primary}
            {user ? null : (
              <Button asChild size="lg" variant="outline">
                <Link href="/login">{t("signIn")}</Link>
              </Button>
            )}
          </div>
          <div className="mt-14 sm:mt-20">
            <p className="sr-only">{t("heroFrameDescription")}</p>
            <OverviewFrame locale={locale} />
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl divide-y px-4 sm:px-6">
          <Feature id="f-add" title={t("addTitle")} body={t("addBody")}>
            <AddExpenseFragment locale={locale} />
          </Feature>
          <Feature id="f-pace" title={t("paceTitle")} body={t("paceBody")} flip>
            <PaceFragment locale={locale} />
          </Feature>
          <Feature id="f-insights" title={t("insightsTitle")} body={t("insightsBody")}>
            <InsightsFragment locale={locale} />
          </Feature>
          <Feature id="f-assistant" title={t("assistantTitle")} body={t("assistantBody")} flip>
            <AssistantFragment locale={locale} />
          </Feature>

          <section aria-labelledby="f-also" className="py-16 sm:py-20">
            <h2 id="f-also" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("alsoTitle")}
            </h2>
            <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {also.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="close" className="bg-sidebar border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-24 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2
                id="close"
                className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
              >
                {t("closeTitle")}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl text-pretty">{t("closeBody")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {primary}
              {user ? null : (
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">{t("signIn")}</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t("footerOrigin")}</p>
          <a
            href={REPO_URL}
            className="text-foreground decoration-border hover:decoration-foreground w-fit underline underline-offset-4"
          >
            {t("footerSource")}
          </a>
        </div>
      </footer>
    </div>
  );
}
