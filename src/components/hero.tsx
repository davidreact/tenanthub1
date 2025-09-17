"use client";

import Link from "next/link";
import { ArrowUpRight, Check, FileText, Calendar } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 dark:from-primary/20 dark:to-primary/10 opacity-70" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <svg
                width="auto"
                height="auto"
                xmlns="http://www.w3.org/2000/svg"
              >
                <style type="text/css">{`
                  .hero-logo-text {
                    font-family: 'Saira Stencil One', sans-serif;
                    font-size: 100px;
                  }
                `}</style>
                <text
                  x="50%"
                  y="50%"
                  dominant-baseline="middle"
                  text-anchor="middle"
                  className="hero-logo-text"
                >
                  SYVITY
                </text>
              </svg>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-8 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">
                {t("home.completeTenantManagement")}
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              {t("home.streamlineProperty")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
              >
                {t("home.accessPortal")}
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors text-lg font-medium"
              >
                {t("nav.signUp")}
              </Link>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>{t("home.inventoryManagement")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{t("home.keyHandoverScheduling")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>{t("home.secureAuthentication")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
