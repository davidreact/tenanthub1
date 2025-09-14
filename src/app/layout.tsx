import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tempo - Modern SaaS Starter",
  description: "A modern full-stack starter template powered by Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <Script src="https://api.tempo.build/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" /> [deprecated] */}
      <body className={`${inter.className} bg-background min-h-screen`}>
        {/* Global background gradient applied to all pages */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-primary/5 dark:from-primary/20 dark:to-primary/10 opacity-70" />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <Navbar />
            {children}
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
        <TempoInit />
      </body>
    </html>
  );
}
