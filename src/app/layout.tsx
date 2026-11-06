import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Manager | مكتبة النور",
  description: "نظام مبيعات لمحلات الأدوات المدرسية والمكتبية والكتب الخارجية",
  manifest: "/manifest.json",
  applicationName: "Sales Manager",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
