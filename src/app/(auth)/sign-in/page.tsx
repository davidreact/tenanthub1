import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, Language } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Shield } from "lucide-react";

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
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("auth.welcomeBack")}</h1>
          <p className="text-muted-foreground">{t("auth.signInDescription")}</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-2xl shadow-xl border-0 p-8 backdrop-blur-sm">
          <form className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-foreground">{t("auth.signInTitle")}</h2>
              <p className="text-muted-foreground mt-2">
                {t("auth.dontHaveAccount")}{" "}
                <Link
                  className="text-primary font-semibold hover:text-primary-foreground transition-colors"
                  href="/sign-up"
                >
                  {t("auth.signUp")}
                </Link>
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground">
                  {t("common.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    required
                    className="pl-11 h-12 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-muted-foreground">
                    {t("common.password")}
                  </Label>
                  <Link
                    className="text-primary hover:text-primary-foreground font-medium transition-colors"
                    href="/forgot-password"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    required
                    className="pl-11 h-12 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all bg-background text-foreground"
                  />
                </div>
              </div>
            </div>

            <SubmitButton
              className="w-full h-12 bg-primary hover:bg-primary-foreground text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              pendingText={t("auth.signingIn")}
              formAction={signInAction}
            >
              {t("auth.signIn")}
              <ArrowRight className="w-4 h-4" />
            </SubmitButton>

            <FormMessage message={resolvedSearchParams} />
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>{t("auth.securityNote")}</p>
        </div>
      </div>
    </div>
  );
}
