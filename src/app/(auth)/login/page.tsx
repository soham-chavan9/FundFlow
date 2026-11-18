import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/validation/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signIn") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getTranslations("auth");
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? safeNextPath(next) : undefined;

  return (
    <>
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">{t("loginTitle")}</h1>
        <p className="text-muted-foreground text-sm">{t("loginSubtitle")}</p>
      </div>
      <LoginForm next={nextPath} />
    </>
  );
}
