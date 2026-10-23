import type { Metadata } from "next";
import { Onest } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

const sans = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

export const metadata: Metadata = { title: "Мой день", description: "Личная операционная система продуктивности" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" className={sans.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
