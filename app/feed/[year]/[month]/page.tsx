"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { useParams } from "next/navigation";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

const STATUS_COLOR: Record<string, string> = {
  Publicado:     "bg-green-500",
  Aprovado:      "bg-[#085ba7]",
  "Em Produção": "bg-amber-400",
  Planejado:     "bg-slate-300",
};

// Cores para fundo azul escuro (dia de hoje)
const STATUS_COLOR_DARK: Record<string, string> = {
  Publicado:     "bg-green-400",
  Aprovado:      "bg-white",
  "Em Produção": "bg-amber-300",
  Planejado:     "bg-blue-200",
};

export default function MonthPage() {
  const params = useParams();
  const year = Number(params.year);
  const month = String(params.month).padStart(2, "0");
  const monthName = MESES[Number(params.month) - 1];

  const [loading, setLoading] = useState(true);
  const [postsByDay, setPostsByDay] = useState<Record<string, { status: string; tema: string }[]>>({});

  useEffect(() => { loadData(); }, [year, month]);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("posts_planejados")
      .select("data_publicacao, status, tema")
      .gte("data_publicacao", `${year}-${month}-01`)
      .lte("data_publicacao", `${year}-${month}-31`);

    const byDay: Record<string, { status: string; tema: string }[]> = {};
    (data ?? []).forEach((p) => {
      const day = p.data_publicacao?.slice(8, 10);
      if (!day) return;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push({ status: p.status, tema: p.tema });
    });
    setPostsByDay(byDay);
    setLoading(false);
  }

  const daysInMonth = new Date(year, Number(params.month), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/feed"
            className="flex items-center space-x-2 text-slate-500 hover:text-[#085ba7] font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Meses</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{monthName} {year}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Selecione um dia para ver e planejar posts</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-[#085ba7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const posts = postsByDay[day] ?? [];
            const dateStr = `${year}-${month}-${day}`;
            const isToday = todayStr === dateStr;

            return (
              <Link
                key={day}
                href={`/feed/${year}/${month}/${day}`}
                className={`block p-3 rounded-xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 min-h-[88px] ${
                  isToday
                    ? "border-[#085ba7] bg-[#085ba7] text-white"
                    : posts.length > 0
                    ? "border-blue-200 bg-white text-slate-700 hover:border-[#085ba7]"
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="text-lg font-bold mb-2">{Number(day)}</div>
                {posts.length > 0 && (
                  <div className="space-y-1">
                    {posts.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full ${
                          isToday
                            ? STATUS_COLOR_DARK[p.status] ?? "bg-blue-200"
                            : STATUS_COLOR[p.status] ?? "bg-slate-300"
                        }`}
                        title={`${p.status} — ${p.tema}`}
                      />
                    ))}
                    {posts.length > 3 && (
                      <p className={`text-[10px] font-medium ${isToday ? "text-white/70" : "text-slate-400"}`}>
                        +{posts.length - 3}
                      </p>
                    )}
                  </div>
                )}
                {posts.length === 0 && (
                  <div className={`flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                    isToday ? "text-white/40" : "text-slate-300"
                  }`}>
                    <Plus className="w-3 h-3" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-slate-500">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
