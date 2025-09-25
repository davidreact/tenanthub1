import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import { UrlProvider } from "@/components/url-provider";
import { getTranslation, Language } from "@/lib/i18n";
import { cookies } from "next/headers";
import { Mail, Lock, User, ArrowRight, UserPlus } from "lucide-react";

async function getLanguageFromCookies(): Promise<Language> {
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get("language")?.value as Language;
  return languageCookie || "en";
}

export default async function Signup(props: {
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
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-xl mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us and start managing your properties</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border-0 p-8 backdrop-blur-sm">
          <UrlProvider>
            <form className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">{t("auth.signUpTitle")}</h2>
                <p className="text-gray-600 mt-2">
                  {t("auth.alreadyHaveAccount")}{" "}
                  <Link
                    className="text-green-600 font-semibold hover:text-green-700 transition-colors"
                    href="/sign-in"
                  >
                    {t("auth.signIn")}
                  </Link>
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700">
                    {t("common.fullName")}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder={t("auth.fullNamePlaceholder")}
                      required
                      className="pl-11 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all"
                    />
                  </div>
                </div>

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
                      className="pl-11 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    {t("common.password")}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      placeholder={t("auth.passwordPlaceholder")}
                      minLength={6}
                      required
                      className="pl-11 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                </div>
              </div>

              <SubmitButton
                formAction={signUpAction}
                pendingText={t("auth.signingUp")}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {t("auth.signUp")}
                <ArrowRight className="w-4 h-4" />
              </SubmitButton>

              <FormMessage message={searchParams} />
            </form>
          </UrlProvider>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>

        <SmtpMessage />
      </div>
    </div>
  );
}
