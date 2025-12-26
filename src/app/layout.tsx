import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CriticalUIFixes } from "@/components/ui/ui-fix-critical-issues";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DEORA Plaza - Restaurant Management System",
  description: "Comprehensive restaurant and hospitality management platform",
};

import { GlobalBackgroundInitializer } from "@/components/ui/global-background-initializer";
import { BackgroundCustomizer } from "@/components/ui/background-customizer";
import { ReadabilityEnhancer } from "@/components/ui/readability-enhancer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <CriticalUIFixes />
        <GlobalBackgroundInitializer>
          {children}
          <BackgroundCustomizer />
          <ReadabilityEnhancer />
        </GlobalBackgroundInitializer>
        <Toaster />
      </body>
    </html>
  );
}