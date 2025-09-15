import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, Language } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";

interface LoginProps {
  searchParams: Promise<Message>;
}

async function getLanguageFromCookies(): Promise<Language> {
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get("language")?.value as Language;
  return languageCookie || "en";
}

export default async function SignInPage({ searchParams }: LoginProps) {
  const [resolvedSearchParams, language] = await Promise.all([
    searchParams,
    getLanguageFromCookies(),
  ]);

  const t = (key: string) => getTranslation(key as any, language);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <form className="flex flex-col space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">{t("auth.signInTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.dontHaveAccount")}{" "}
              <Link
                className="text-primary font-medium hover:underline transition-all"
                href="/sign-up"
              >
                {t("auth.signUp")}
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("common.email")}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("common.password")}
                </Label>
                <Link
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-all"
                  href="/forgot-password"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder={t("auth.passwordPlaceholder")}
                required
                className="w-full"
              />
            </div>
          </div>

          <SubmitButton
            className="w-full"
            pendingText={t("auth.signingIn")}
            formAction={signInAction}
          >
            {t("auth.signIn")}
          </SubmitButton>

          <FormMessage message={resolvedSearchParams} />
        </form>
      </div>
    </div>
  );
}
