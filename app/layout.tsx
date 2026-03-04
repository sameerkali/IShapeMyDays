import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
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
