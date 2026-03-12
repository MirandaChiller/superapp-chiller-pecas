"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, Save } from "lucide-react";
import Link from "next/link";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

type MonthInfo = { total: number; publicados: number; planejados: number };

interface PostSemData {
  id: string;
  tema: string;
  formato: string;
  status: string;
}

export default function FeedPage() {
  const [loading, setLoading] = useState(true);
  const [postsByMonth, setPostsByMonth] = useState<Record<string, MonthInfo>>({});
  const [ano, setAno] = useState(new Date().getFullYear());
  const [postsSemData, setPostsSemData] = useState<PostSemData[]>([]);
  const [datas, setDatas] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, [ano]);

  async function loadData() {
    setLoading(true);

    const [{ data: datados }, { data: semData }] = await Promise.all([
      supabase
        .from("posts_planejados")
        .select("data_publicacao, status")
        .gte("data_publicacao", `${ano}-01-01`)
        .lte("data_publicacao", `${ano}-12-31`),
      supabase
        .from("posts_planejados")
        .select("id, tema, formato, status")
        .is("data_publicacao", null),
    ]);

    const counts: Record<string, MonthInfo> = {};
    (datados ?? []).forEach((p) => {
      const mes = p.data_publicacao?.slice(5, 7);
      if (!mes) return;
      if (!counts[mes]) counts[mes] = { total: 0, publicados: 0, planejados: 0 };
      counts[mes].total++;
      if (p.status === "Publicado") counts[mes].publicados++;
      if (p.status === "Planejado") counts[mes].planejados++;
    });
    setPostsByMonth(counts);
    setPostsSemData(semData ?? []);
    setLoading(false);
  }

  async function salvarData(postId: string) {
    const data = datas[postId];
    if (!data) return;
    setSalvando((prev) => new Set(prev).add(postId));
    await supabase.from("posts_planejados").update({ data_publicacao: data }).eq("id", postId);
    setSalvando((prev) => { const n = new Set(prev); n.delete(postId); return n; });
    await loadData();
  }

  async function salvarTodos() {
    const comData = postsSemData.filter((p) => datas[p.id]);
    if (comData.length === 0) return;
    setSalvando(new Set(comData.map((p) => p.id)));
    await Promise.all(
      comData.map((p) =>
        supabase.from("posts_planejados").update({ data_publicacao: datas[p.id] }).eq("id", p.id)
      )
    );
    setSalvando(new Set());
    await loadData();
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

      {/* Posts sem data */}
      {!loading && postsSemData.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">
                {postsSemData.length} post{postsSemData.length !== 1 ? "s" : ""} sem data — não aparecem no planejador
              </span>
            </div>
            {postsSemData.some((p) => datas[p.id]) && (
              <button
                onClick={salvarTodos}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-semibold transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar todos</span>
              </button>
            )}
          </div>
          <div className="space-y-2">
            {postsSemData.map((post) => (
              <div key={post.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate text-sm">{post.tema || "(sem tema)"}</p>
                  <p className="text-xs text-slate-400">{post.formato} · {post.status}</p>
                </div>
                <input
                  type="date"
                  value={datas[post.id] ?? ""}
                  onChange={(e) => setDatas((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
                <button
                  onClick={() => salvarData(post.id)}
                  disabled={!datas[post.id] || salvando.has(post.id)}
                  className="px-3 py-1.5 bg-[#085ba7] text-white rounded-lg text-sm font-medium hover:bg-[#074a8a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {salvando.has(post.id) ? "..." : "Salvar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
