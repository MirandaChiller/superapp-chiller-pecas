import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
