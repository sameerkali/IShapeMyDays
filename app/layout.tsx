import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IShapeMyDays — Shape Your Habits, Shape Your Life",
  description:
    "A premium productivity tracker for habits, calories, and personal growth. Track your daily progress, build streaks, and receive automated insights.",
  keywords: [
    "productivity",
    "habit tracker",
    "calorie tracker",
    "self improvement",
    "daily habits",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IShapeMyDays",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
    <html lang="en" className={inter.variable}>
      <body>
        <RegisterSW />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-inter), sans-serif",
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}

