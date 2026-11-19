import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cn } from "cn";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/shell/page-header";
import {
  DeleteAccount,
  PasswordForm,
  PreferencesForm,
  ProfileForm,
} from "@/components/settings/settings-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

/** A settings group: what it is on the left, the form on the right (stacked on phones). */
function Section({
  id,
  title,
  description,
  children,
  danger,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 py-8 first:pt-0 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8"
    >
      <div>
        <h2 id={id} className={cn("font-semibold", danger && "text-destructive")}>
          {title}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm text-pretty">{description}</p>
      </div>
      <div
        className={cn("bg-card rounded-xl border p-4 sm:p-5", danger && "border-destructive/30")}
      >
        {children}
      </div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const t = await getTranslations("settings");

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="mx-auto w-full max-w-4xl divide-y p-4 sm:p-6">
        <Section id="profile" title={t("profileTitle")} description={t("profileBody")}>
          <ProfileForm name={user.name} email={user.email} />
        </Section>
        <Section id="preferences" title={t("preferencesTitle")} description={t("preferencesBody")}>
          <PreferencesForm currency={user.currency} locale={user.locale} />
        </Section>
        <Section id="password" title={t("passwordTitle")} description={t("passwordBody")}>
          <PasswordForm />
        </Section>
        <Section id="danger" title={t("dangerTitle")} description={t("dangerBody")} danger>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-pretty">{t("deleteSummary")}</p>
            <DeleteAccount />
          </div>
        </Section>
      </div>
    </>
  );
}
