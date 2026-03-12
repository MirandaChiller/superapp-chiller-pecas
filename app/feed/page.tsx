"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

type MonthInfo = { total: number; publicados: number; planejados: number };

export default function FeedPage() {
  const [loading, setLoading] = useState(true);
  const [postsByMonth, setPostsByMonth] = useState<Record<string, MonthInfo>>({});
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => { loadData(); }, [ano]);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("posts_planejados")
      .select("data_publicacao, status")
      .gte("data_publicacao", `${ano}-01-01`)
      .lte("data_publicacao", `${ano}-12-31`);

    const counts: Record<string, MonthInfo> = {};
    (data ?? []).forEach((p) => {
      const mes = p.data_publicacao?.slice(5, 7);
      if (!mes) return;
      if (!counts[mes]) counts[mes] = { total: 0, publicados: 0, planejados: 0 };
      counts[mes].total++;
      if (p.status === "Publicado") counts[mes].publicados++;
      if (p.status === "Planejado") counts[mes].planejados++;
    });
    setPostsByMonth(counts);
    setLoading(false);
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Planejamento de Feed</h1>
          <p className="text-slate-600 mt-1">Selecione um mês para ver o calendário de dias</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAno((a) => a - 1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold text-slate-700 w-16 text-center">{ano}</span>
          <button
            onClick={() => setAno((a) => a + 1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-[#085ba7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {MESES.map((nomeMes, idx) => {
            const mes = String(idx + 1).padStart(2, "0");
            const info = postsByMonth[mes];
            const isCurrentMonth = (idx + 1) === currentMonth && ano === currentYear;

            return (
              <Link
                key={mes}
                href={`/feed/${ano}/${mes}`}
                className={`block p-6 rounded-2xl border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  isCurrentMonth
                    ? "border-[#085ba7] bg-[#085ba7] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#085ba7]"
                }`}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className={`w-6 h-6 ${isCurrentMonth ? "text-white/70" : "text-[#085ba7]"}`} />
                  <span className="font-bold text-lg">{nomeMes}</span>
                </div>
                {info ? (
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${isCurrentMonth ? "text-white/80" : "text-slate-600"}`}>
                      {info.total} post{info.total !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {info.publicados > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isCurrentMonth ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                        }`}>
                          {info.publicados} publ.
                        </span>
                      )}
                      {info.planejados > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isCurrentMonth ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                        }`}>
                          {info.planejados} plan.
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${isCurrentMonth ? "text-white/60" : "text-slate-400"}`}>Sem posts</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
