import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finanzas SaaS",
  description: "Gestion financiera personal con distribucion automatica",
  applicationName: "Finanzas SaaS"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-gray-100`}>
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6">
          <header className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <Link href="/" className="text-base font-semibold tracking-tight text-white">
              Finanzas SaaS
            </Link>
            <nav className="flex gap-3 text-sm text-gray-300">
              <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
              <Link href="/categorias" className="hover:text-white">Categorias</Link>
              <Link href="/nuevo-ingreso" className="hover:text-white">Nuevo ingreso</Link>
              <Link href="/historial" className="hover:text-white">Historial</Link>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}