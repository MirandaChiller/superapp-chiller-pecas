import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand"
});

export const metadata: Metadata = {
  title: "Superapp Chiller Peças | Marketing Intelligence",
  description: "Plataforma completa de marketing para Chiller Peças",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={quicksand.className}>
        {children}
      </body>
    </html>
  );
}
