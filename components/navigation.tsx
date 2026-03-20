"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Users, Target, PieChart, Calendar,
  BarChart3, Home, Edit3, Link as LinkIcon, CheckSquare, Menu, X
} from "lucide-react";

const navigation = [
  { name: "Início", href: "/", icon: Home },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Posicionamento", href: "/posicionamento", icon: Target },
  { name: "Temas & Intensidades", href: "/content-pie", icon: PieChart },
  { name: "Planejamento de Feed", href: "/feed", icon: Calendar },
  { name: "Tarefas", href: "/metrics-matcher", icon: CheckSquare },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3 },
  { name: "Edições Campanhas", href: "/campaign-edits", icon: Edit3 },
  { name: "Criador de UTMs", href: "/utm-builder", icon: LinkIcon },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2.5 flex-shrink-0">
              <div className="w-10 h-10 bg-[#085ba7] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">CP</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-lg font-bold text-[#085ba7] leading-tight">Chiller Peças</p>
                <p className="text-[10px] text-slate-500 font-medium">Marketing Intelligence</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center space-x-0.5 overflow-x-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${
                      isActive(item.href)
                        ? "bg-[#085ba7] text-white shadow-md"
                        : "text-slate-600 hover:bg-blue-50 hover:text-[#085ba7]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile: current page label + hamburger */}
            <div className="flex items-center gap-3 lg:hidden">
              <span className="text-sm font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-xs">
                {navigation.find(n => isActive(n.href))?.name ?? "Início"}
              </span>
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative ml-auto w-72 h-full bg-white shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#085ba7] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">CP</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#085ba7]">Chiller Peças</p>
                  <p className="text-[10px] text-slate-500">Marketing Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                      isActive(item.href)
                        ? "bg-[#085ba7] text-white shadow-sm"
                        : "text-slate-600 hover:bg-blue-50 hover:text-[#085ba7]"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
