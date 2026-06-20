import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/session-provider";
import { ErrorBoundary } from "@/components/adcraft/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdCraft — Amazon PPC Command Center",
  description:
    "Master Amazon PPC through interactive simulations, structured learning modules, and AI-powered mentorship. Train your skills in campaign architecture, bidding strategies, and search term optimization.",
  keywords: [
    "Amazon PPC",
    "AdCraft",
    "PPC Training",
    "Campaign Management",
    "Bidding Strategy",
    "Search Term Optimization",
    "ACoS",
    "ROAS",
    "CPC",
  ],
  authors: [{ name: "AdCraft Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AdCraft — Amazon PPC Command Center",
    description:
      "Master Amazon PPC through interactive simulations and AI-powered mentorship",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AdCraft — Amazon PPC Command Center",
    description:
      "Master Amazon PPC through interactive simulations and AI-powered mentorship",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
