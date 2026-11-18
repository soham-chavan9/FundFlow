"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/server/auth-actions";
import { useMessage } from "@/i18n/use-message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const message = useMessage();
  const [state, action, pending] = useActionState(loginAction, undefined);
  const err = state?.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state?.formError ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle />
          <AlertDescription>{message(state.formError)}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field data-invalid={!!err.email || undefined}>
          <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            required
            defaultValue={state?.values?.email}
            aria-invalid={!!err.email || undefined}
            aria-describedby={err.email ? "email-error" : undefined}
          />
          {err.email ? <FieldError id="email-error">{message(err.email)}</FieldError> : null}
        </Field>
        <Field data-invalid={!!err.password || undefined}>
          <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            aria-invalid={!!err.password || undefined}
            aria-describedby={err.password ? "password-error" : undefined}
          />
          {err.password ? (
            <FieldError id="password-error">{message(err.password)}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Spinner /> {t("pendingLogin")}
          </>
        ) : (
          t("submitLogin")
        )}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="text-foreground decoration-border hover:decoration-foreground font-medium underline underline-offset-4"
        >
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}
