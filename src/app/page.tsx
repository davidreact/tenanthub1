"use client";

import Footer from "@/components/footer";
import Hero from "@/components/hero";
import {
  ArrowUpRight,
  CheckCircle2,
  Shield,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Key,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Hero />
      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              {t("home.completeTenantManagement")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("home.streamlineProperty")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FileText className="w-6 h-6" />,
                title: t("home.inventoryManagement"),
                description: t("home.inventoryDescription"),
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: t("home.secureAuthentication"),
                description: t("home.securityDescription"),
              },
              {
                icon: <CreditCard className="w-6 h-6" />,
                title: t("home.paymentTracking"),
                description: t("home.paymentDescription"),
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: t("home.keyHandoverScheduling"),
                description: t("home.handoverDescription"),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow border border-border"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              {t("home.howItWorks")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("home.simpleSteps")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {t("home.signUpLogin")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.signUpDescription")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {t("home.manageYourProperty")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.manageDescription")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {t("home.stayConnected")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.stayConnectedDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-primary-foreground/80">
                {t("home.propertiesManaged")}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-foreground/80">
                {t("home.happyTenants")}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-primary-foreground/80">
                {t("home.uptimeGuaranteed")}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            {t("home.readyToStreamline")}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("home.joinHundreds")}
          </p>
          <a
            href="/pm-dashboard"
            className="inline-flex items-center px-6 py-3 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t("home.accessPortal")}
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>
      <Footer />
    </div>
  );
}
