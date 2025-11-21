import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionMonitor } from "@/app/components/session-monitor";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoneyMind - Manage Your Personal Finances",
  description:
    "Track your income, expenses, credit cards, loans, and payments in one place",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionMonitor />
          <ConditionalNavbar />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
