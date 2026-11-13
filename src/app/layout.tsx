import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelpDesk Lab",
  description:
    "Simulatore di ticketing aziendale per scuole superiori — Tecnico e Operatore Informatico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
