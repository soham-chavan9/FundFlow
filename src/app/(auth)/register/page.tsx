import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("createAccount") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  return (
    <>
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">{t("registerTitle")}</h1>
        <p className="text-muted-foreground text-sm">{t("registerSubtitle")}</p>
      </div>
      <RegisterForm />
    </>
  );
}
