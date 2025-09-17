import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { forgotPasswordAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { UrlProvider } from "@/components/url-provider";
import { getTranslation, Language } from "@/lib/i18n";
import { cookies } from "next/headers";

async function getLanguageFromCookies(): Promise<Language> {
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get("language")?.value as Language;
  return languageCookie || "en";
}

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const [searchParams, language] = await Promise.all([
    props.searchParams,
    getLanguageFromCookies(),
  ]);

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  const t = (key: string) => getTranslation(key as any, language);

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-hero-gradient px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <UrlProvider>
            <form className="flex flex-col space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">{t("auth.forgotPasswordTitle") || "Reset Password"}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("auth.alreadyHaveAccount") || "Already have an account?"}{" "}
                  <Link
                    className="text-primary font-medium hover:underline transition-all"
                    href="/sign-in"
                  >
                    {t("auth.signIn") || "Sign in"}
                  </Link>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t("common.email") || "Email"}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder") || "you@example.com"}
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <SubmitButton
                formAction={forgotPasswordAction}
                pendingText={t("auth.sendingResetLink") || "Sending reset link..."}
                className="w-full"
              >
                {t("auth.resetPassword") || "Reset Password"}
              </SubmitButton>

              <FormMessage message={searchParams} />
            </form>
          </UrlProvider>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}
