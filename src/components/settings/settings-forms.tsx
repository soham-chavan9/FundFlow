"use client";

import { startTransition, useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LOCALES } from "@/i18n/locales";
import { useMessage } from "@/i18n/use-message";
import { CURRENCIES, type Currency } from "@/lib/money";
import {
  changePasswordAction,
  deleteAccountAction,
  updatePreferencesAction,
  updateProfileAction,
  type SettingsFormState,
} from "@/server/account-actions";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type Action = (prev: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;

/**
 * Shared wiring for the settings forms: dispatches by hand (so a failed save
 * keeps what was typed), runs `onOk` after a successful save, and hands back
 * per-field error props.
 */
function useSettingsForm(action: Action, onOk: (form: HTMLFormElement) => void) {
  const message = useMessage();
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const [state, dispatch, pending] = useActionState(
    async (prev: SettingsFormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result?.ok && form) onOk(form);
      return result;
    },
    undefined,
  );
  const err = state?.fieldErrors ?? {};
  return {
    state,
    pending,
    formProps: {
      ref: setForm,
      noValidate: true,
      onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => dispatch(formData));
      },
    },
    invalid: (name: string) => ({
      "aria-invalid": !!err[name] || undefined,
      "aria-describedby": err[name] ? `${name}-error` : undefined,
    }),
    error: (name: string) =>
      err[name] ? <FieldError id={`${name}-error`}>{message(err[name])}</FieldError> : null,
    formError: state?.formError ? (
      <Alert variant="destructive" aria-live="polite">
        <AlertCircle />
        <AlertDescription>{message(state.formError)}</AlertDescription>
      </Alert>
    ) : null,
    has: (name: string) => !!err[name] || undefined,
  };
}

function SaveButton({ pending, label }: { pending: boolean; label: string }) {
  const t = useTranslations("entries");
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Spinner /> {t("saving")}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const t = useTranslations();
  const f = useSettingsForm(updateProfileAction, () => toast.success(t("settings.profileSaved")));
  return (
    <form {...f.formProps} className="flex flex-col gap-5">
      {f.formError}
      <FieldGroup className="gap-5">
        <Field data-invalid={f.has("name")}>
          <FieldLabel htmlFor="name">{t("auth.name")}</FieldLabel>
          <Input
            id="name"
            name="name"
            defaultValue={name}
            maxLength={80}
            autoComplete="name"
            {...f.invalid("name")}
          />
          {f.error("name")}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
          <Input id="email" value={email} readOnly disabled aria-describedby="email-note" />
          <FieldDescription id="email-note">{t("settings.emailFixed")}</FieldDescription>
        </Field>
      </FieldGroup>
      <div className="flex justify-end">
        <SaveButton pending={f.pending} label={t("common.save")} />
      </div>
    </form>
  );
}

export function PreferencesForm({ currency, locale }: { currency: Currency; locale: string }) {
  const t = useTranslations();
  const uiLocale = useLocale();
  const f = useSettingsForm(updatePreferencesAction, () =>
    toast.success(t("settings.preferencesSaved")),
  );
  const currencyName = new Intl.DisplayNames(uiLocale, { type: "currency" });
  return (
    <form {...f.formProps} className="flex flex-col gap-5">
      {f.formError}
      <FieldGroup className="gap-5 sm:grid sm:grid-cols-2 sm:gap-4">
        <Field>
          <FieldLabel htmlFor="currency">{t("entries.currency")}</FieldLabel>
          <Select name="currency" defaultValue={currency}>
            <SelectTrigger id="currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="text-muted-foreground w-9 text-xs font-medium">{c}</span>
                  {currencyName.of(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="locale">{t("shell.language")}</FieldLabel>
          <Select name="locale" defaultValue={locale}>
            <SelectTrigger id="locale" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l} value={l} lang={l}>
                  {t(`languages.${l}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <p className="text-muted-foreground text-sm">{t("settings.currencyNote")}</p>
      <div className="flex justify-end">
        <SaveButton pending={f.pending} label={t("common.save")} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations();
  const f = useSettingsForm(changePasswordAction, (form) => {
    form.reset();
    toast.success(t("settings.passwordChanged"));
  });
  return (
    <form {...f.formProps} className="flex flex-col gap-5">
      {f.formError}
      <FieldGroup className="gap-5">
        <Field data-invalid={f.has("currentPassword")}>
          <FieldLabel htmlFor="currentPassword">{t("settings.currentPassword")}</FieldLabel>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
            {...f.invalid("currentPassword")}
          />
          {f.error("currentPassword")}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <Field data-invalid={f.has("newPassword")}>
            <FieldLabel htmlFor="newPassword">{t("settings.newPassword")}</FieldLabel>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              {...f.invalid("newPassword")}
            />
            {f.error("newPassword") ?? (
              <FieldDescription>{t("auth.passwordHint")}</FieldDescription>
            )}
          </Field>
          <Field data-invalid={f.has("confirmPassword")}>
            <FieldLabel htmlFor="confirmPassword">{t("auth.confirmPassword")}</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              {...f.invalid("confirmPassword")}
            />
            {f.error("confirmPassword")}
          </Field>
        </div>
      </FieldGroup>
      <p className="text-muted-foreground text-sm">{t("settings.passwordNote")}</p>
      <div className="flex justify-end">
        <SaveButton pending={f.pending} label={t("settings.changePassword")} />
      </div>
    </form>
  );
}

export function DeleteAccount() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  // The action redirects away on success, so there is nothing to do after it.
  const f = useSettingsForm(deleteAccountAction, () => {});
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{t("settings.deleteAccount")}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form {...f.formProps} className="flex flex-col gap-6">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <Field data-invalid={f.has("password")}>
            <FieldLabel htmlFor="delete-password">{t("settings.confirmWithPassword")}</FieldLabel>
            <PasswordInput
              id="delete-password"
              name="password"
              autoComplete="current-password"
              autoFocus
              {...f.invalid("password")}
            />
            {f.error("password")}
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">{t("common.cancel")}</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={f.pending}>
              {f.pending ? <Spinner /> : null}
              {t("settings.deleteForever")}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
