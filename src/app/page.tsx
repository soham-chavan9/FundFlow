import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";

// Interim front door until the landing page is built.
export default async function Home() {
  const t = await getTranslations();
  return (
    <main className="bg-sidebar flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Wordmark />
      <p className="text-muted-foreground max-w-md text-balance">{t("meta.description")}</p>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/register">{t("auth.createAccount")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">{t("auth.signIn")}</Link>
        </Button>
      </div>
    </main>
  );
}
