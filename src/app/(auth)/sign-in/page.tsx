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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border-0 p-8 backdrop-blur-sm">
          <form className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">{t("auth.signInTitle")}</h2>
              <p className="text-gray-600 mt-2">
                {t("auth.dontHaveAccount")}{" "}
                <Link
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  href="/sign-up"
                >
                  {t("auth.signUp")}
                </Link>
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  {t("common.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    required
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    {t("common.password")}
                  </Label>
                  <Link
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    href="/forgot-password"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    required
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                  />
                </div>
              </div>
            </div>

            <SubmitButton
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Protected by industry-standard security</p>
        </div>
      </div>
    </div>
  );
}
