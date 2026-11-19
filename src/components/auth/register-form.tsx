"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { registerAction } from "@/server/auth-actions";
import { useMessage } from "@/i18n/use-message";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PasswordInput } from "./password-input";

export function RegisterForm() {
  const t = useTranslations("auth");
  const message = useMessage();
  const [state, action, pending] = useActionState(registerAction, undefined);
  const err = state?.fieldErrors ?? {};
  const invalid = (field: string) => (err[field] ? true : undefined);
  const describedBy = (field: string, extra?: string) =>
    [err[field] ? `${field}-error` : null, extra].filter(Boolean).join(" ") || undefined;

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={invalid("name")}>
          <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            autoFocus
            required
            maxLength={80}
            defaultValue={state?.values?.name}
            aria-invalid={invalid("name")}
            aria-describedby={describedBy("name")}
          />
          {err.name ? <FieldError id="name-error">{message(err.name)}</FieldError> : null}
        </Field>
        <Field data-invalid={invalid("email")}>
          <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state?.values?.email}
            aria-invalid={invalid("email")}
            aria-describedby={describedBy("email")}
          />
          {err.email ? (
            <FieldError id="email-error">
              {message(err.email)}
              {err.email === "auth.emailTaken" ? (
                <>
                  {" "}
                  <Link href="/login" className="font-medium underline underline-offset-4">
                    {t("signIn")}
                  </Link>
                </>
              ) : null}
            </FieldError>
          ) : null}
        </Field>
        <Field data-invalid={invalid("password")}>
          <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            aria-invalid={invalid("password")}
            aria-describedby={describedBy("password", "password-hint")}
          />
          {err.password ? (
            <FieldError id="password-error">{message(err.password)}</FieldError>
          ) : (
            <FieldDescription id="password-hint">{t("passwordHint")}</FieldDescription>
          )}
        </Field>
        <Field data-invalid={invalid("confirmPassword")}>
          <FieldLabel htmlFor="confirmPassword">{t("confirmPassword")}</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            aria-invalid={invalid("confirmPassword")}
            aria-describedby={describedBy("confirmPassword")}
          />
          {err.confirmPassword ? (
            <FieldError id="confirmPassword-error">{message(err.confirmPassword)}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Spinner /> {t("pendingRegister")}
          </>
        ) : (
          t("submitRegister")
        )}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="text-foreground decoration-border hover:decoration-foreground font-medium underline underline-offset-4"
        >
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
