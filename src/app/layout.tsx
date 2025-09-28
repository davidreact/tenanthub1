import type { Metadata } from "next";
import { Inter, Saira_Stencil_One } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TempoInit } from "@/components/tempo-init";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });
const sairaStencilOne = Saira_Stencil_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-saira-stencil-one",
  preload: true,
});

export const metadata: Metadata = {
  title: "Syvity - Modern Property Management",
  description:
    "Streamline your property management with Syvity: Complete tenant management, inventory, handovers, and secure authentication.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.svg",
    },
  ],

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Saira+Stencil+One&display=swap"
        />
      </head>
      {/* <Script src="https://api.tempo.build/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" /> [deprecated] */}
      <body
        className={`${inter.className} ${sairaStencilOne.variable} bg-background min-h-screen`}
      >
        <Providers>
          {children}
        </Providers>
        <TempoInit />
      </body>
    </html>
  );
}
