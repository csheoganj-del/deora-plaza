import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/animations.css";
import "./mobile.css";
import { Toaster } from "sonner";
import { BusinessSettingsProvider } from "@/contexts/BusinessSettingsContext";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { RealtimeOrdersProvider } from "@/providers/RealtimeOrdersProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DEORA Plaza - Restaurant Management System",
  description: "Comprehensive restaurant and hospitality management platform",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f8' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <ReactQueryProvider>
          <RealtimeOrdersProvider>
            <BusinessSettingsProvider>
              {children}
              <Toaster position="top-right" />
            </BusinessSettingsProvider>
          </RealtimeOrdersProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}