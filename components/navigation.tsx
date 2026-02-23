"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, Target, PieChart, Calendar, 
  TrendingUp, BarChart3, Home, Edit3 // ← Adicionar Edit3
} from "lucide-react";
import { CheckSquare } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Posicionamento", href: "/posicionamento", icon: Target },
  { name: "Temas & Intensidades", href: "/content-pie", icon: PieChart },
  { name: "Planejamento de Feed", href: "/feed", icon: Calendar },
  { name: "Tarefas", href: "/metrics-matcher", icon: CheckSquare },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3 },
  { name: "Edições Campanhas", href: "/campaign-edits", icon: Edit3 }, // ← NOVO
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-lg border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ff901c] to-[#085ba7] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">CP</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff901c] to-[#085ba7] bg-clip-text text-transparent">
                Chiller Peças
              </h1>
              <p className="text-xs text-slate-500 font-medium">Marketing Intelligence Platform</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    isActive
                      ? "bg-gradient-to-r from-[#ff901c] to-[#085ba7] text-white shadow-md"
                      : "text-slate-600 hover:bg-blue-50 hover:text-[#085ba7]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
