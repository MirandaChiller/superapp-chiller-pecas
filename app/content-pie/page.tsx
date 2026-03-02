"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Save, X, CalendarDays } from "lucide-react";

interface Tema {
  nome: string;
  percentual: number;
}

interface MesData {
  intensidade: "Baixa" | "Normal" | "Alta" | "Muito Alta";
  observacoes: string;
  postsPorSemana: number;
  temas: Tema[];
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

const INTENSIDADES = ["Baixa", "Normal", "Alta", "Muito Alta"] as const;

const INTENSIDADE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Baixa:        { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-300" },
  Normal:       { bg: "bg-blue-50",    text: "text-[#085ba7]",  border: "border-[#085ba7]" },
  Alta:         { bg: "bg-orange-50",  text: "text-[#ff901c]",  border: "border-[#ff901c]" },
  "Muito Alta": { bg: "bg-red-50",     text: "text-red-700",    border: "border-red-400"   },
};

const DEFAULT_TEMAS: Tema[] = [
  { nome: "Produtos e Lançamentos", percentual: 30 },
  { nome: "Educacional e Dicas",    percentual: 25 },
  { nome: "Bastidores e Equipe",    percentual: 20 },
  { nome: "Entretenimento",         percentual: 15 },
  { nome: "Depoimentos",            percentual: 10 },
];

const DEFAULT_MES: MesData = {
  intensidade: "Normal",
  observacoes: "",
  postsPorSemana: 3,
  temas: DEFAULT_TEMAS,
};

const SQL_SETUP = `-- Execute no SQL Editor do Supabase Dashboard:

-- Criar tabela (se ainda não existe):
CREATE TABLE IF NOT EXISTS content_pie_mensal (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ano integer NOT NULL,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  intensidade text DEFAULT 'Normal',
  observacoes text DEFAULT '',
  posts_por_semana integer DEFAULT 3,
  temas jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ano, mes)
);

-- Se a tabela já existia, adicione as colunas novas:
ALTER TABLE content_pie_mensal
  ADD COLUMN IF NOT EXISTS posts_por_semana integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS temas jsonb DEFAULT '[]'::jsonb;`;

export default function ContentPiePage() {
  const [loading, setLoading] = useState(true);

  // All month data keyed by "ano-mes"
  const [planejamento, setPlanejamento] = useState<Record<string, MesData>>({});

  // Year management
  const [anos, setAnos] = useState<number[]>([new Date().getFullYear()]);
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());
  const [novoAnoInput, setNovoAnoInput] = useState("");

  // Dialog
  const [dialogMes, setDialogMes] = useState<number | null>(null);
  const [savingMes, setSavingMes] = useState<string | null>(null);

  // DB
  const [dbError, setDbError] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  // Close dialog on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDialogMes(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data, error } = await supabase
      .from("content_pie_mensal")
      .select("*");

    if (error) {
      setDbError(true);
    } else if (data) {
      const plan: Record<string, MesData> = {};
      const anosSet = new Set<number>([new Date().getFullYear()]);
      data.forEach((row) => {
        anosSet.add(row.ano);
        plan[`${row.ano}-${row.mes}`] = {
          intensidade: row.intensidade || "Normal",
          observacoes: row.observacoes || "",
          postsPorSemana: row.posts_por_semana ?? 3,
          temas: Array.isArray(row.temas) && row.temas.length > 0
            ? row.temas
            : [...DEFAULT_TEMAS],
        };
      });
      setPlanejamento(plan);
      setAnos(Array.from(anosSet).sort((a, b) => a - b));
    }
    setLoading(false);
  }

  async function saveMes(ano: number, mes: number) {
    const key = `${ano}-${mes}`;
    setSavingMes(key);
    const d = planejamento[key] || { ...DEFAULT_MES, temas: [...DEFAULT_TEMAS] };

    await supabase.from("content_pie_mensal").upsert(
      {
        ano,
        mes,
        intensidade: d.intensidade,
        observacoes: d.observacoes,
        posts_por_semana: d.postsPorSemana,
        temas: d.temas,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ano,mes" }
    );

    setSavingMes(null);
    setDialogMes(null);
  }

  // Generic field updater for any MesData field
  function setMesField<K extends keyof MesData>(ano: number, mes: number, field: K, value: MesData[K]) {
    const key = `${ano}-${mes}`;
    setPlanejamento((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { ...DEFAULT_MES, temas: [...DEFAULT_TEMAS] }), [field]: value },
    }));
  }

  function addTema(ano: number, mes: number) {
    const key = `${ano}-${mes}`;
    const cur = planejamento[key] || { ...DEFAULT_MES, temas: [...DEFAULT_TEMAS] };
    setMesField(ano, mes, "temas", [...cur.temas, { nome: "", percentual: 0 }]);
  }

  function removeTema(ano: number, mes: number, i: number) {
    const key = `${ano}-${mes}`;
    const cur = planejamento[key] || { ...DEFAULT_MES, temas: [...DEFAULT_TEMAS] };
    setMesField(ano, mes, "temas", cur.temas.filter((_, idx) => idx !== i));
  }

  function updateTema(ano: number, mes: number, i: number, field: keyof Tema, value: string | number) {
    const key = `${ano}-${mes}`;
    const cur = planejamento[key] || { ...DEFAULT_MES, temas: [...DEFAULT_TEMAS] };
    const next = [...cur.temas];
    next[i] = { ...next[i], [field]: value };
    setMesField(ano, mes, "temas", next);
  }

  function addAno() {
    const ano = parseInt(novoAnoInput);
    if (!ano || anos.includes(ano)) return;
    setAnos((prev) => [...prev, ano].sort((a, b) => a - b));
    setAnoAtivo(ano);
    setNovoAnoInput("");
  }

  function removeAno(ano: number) {
    if (anos.length === 1) return;
    const next = anos.filter((a) => a !== ano);
    setAnos(next);
    if (anoAtivo === ano) setAnoAtivo(next[next.length - 1]);
  }

  // Dialog helpers
  const dialogKey = dialogMes !== null ? `${anoAtivo}-${dialogMes}` : null;
  const dialogData: MesData = dialogKey
    ? (planejamento[dialogKey] || { ...DEFAULT_MES, temas: [...DEFAULT_TEMAS] })
    : { ...DEFAULT_MES, temas: [...DEFAULT_TEMAS] };
  const dialogPostsMes = Math.round(dialogData.postsPorSemana * (52 / 12));
  const dialogTotalPct = dialogData.temas.reduce((s, t) => s + t.percentual, 0);
  const isSavingDialog = dialogKey ? savingMes === dialogKey : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-[#085ba7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Temas & Intensidades</h1>
        <p className="text-slate-600 mt-1">Planejamento mensal independente — clique em um mês para editar</p>
      </div>

      {/* DB Error */}
      {dbError && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-800">Tabela não encontrada no Supabase</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Execute o SQL abaixo no SQL Editor do Supabase Dashboard.
              </p>
            </div>
            <button
              onClick={() => setShowSQL(!showSQL)}
              className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold"
            >
              {showSQL ? "Ocultar SQL" : "Ver SQL"}
            </button>
          </div>
          {showSQL && (
            <pre className="mt-4 bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
              {SQL_SETUP}
            </pre>
          )}
        </div>
      )}

      {/* Year tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {anos.map((ano) => (
          <div key={ano} className="flex items-center">
            <button
              onClick={() => setAnoAtivo(ano)}
              className={`px-5 py-2 rounded-l-lg font-semibold text-sm transition-all ${
                anoAtivo === ano
                  ? "bg-[#085ba7] text-white shadow-md"
                  : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {ano}
            </button>
            {anos.length > 1 && (
              <button
                onClick={() => removeAno(ano)}
                title="Remover ano"
                className={`px-2 py-2 rounded-r-lg text-sm transition-all border-l border-white/30 ${
                  anoAtivo === ano
                    ? "bg-[#085ba7] text-white/70 hover:text-white"
                    : "bg-white border border-slate-300 border-l-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Ano"
            value={novoAnoInput}
            onChange={(e) => setNovoAnoInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAno()}
            className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#085ba7] text-center"
          />
          <button
            onClick={addAno}
            title="Adicionar ano"
            className="p-2 bg-[#ff901c] text-white rounded-lg hover:bg-[#e08016] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 × 4 grid */}
      <div className="grid grid-cols-3 gap-4">
        {MESES.map((nomeMes, idx) => {
          const mes = idx + 1;
          const key = `${anoAtivo}-${mes}`;
          const mesData = planejamento[key];
          const hasContent = !!mesData;
          const style = INTENSIDADE_STYLE[hasContent ? mesData.intensidade : "Normal"];
          const postsMes = hasContent ? Math.round(mesData.postsPorSemana * (52 / 12)) : "—";
          const topTemas = hasContent
            ? mesData.temas.slice(0, 2).map((t) => t.nome).filter(Boolean).join(" · ")
            : "";

          return (
            <button
              key={mes}
              onClick={() => setDialogMes(mes)}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#085ba7] transition-all text-left overflow-hidden"
            >
              {/* Card header */}
              <div className="bg-[#085ba7] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{nomeMes}</span>
                  <span className="text-blue-200 text-xs">{anoAtivo}</span>
                </div>
                <CalendarDays className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
              </div>

              {/* Card body */}
              <div className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                    {hasContent ? mesData.intensidade : "Normal"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {postsMes} {hasContent ? "posts/mês" : ""}
                  </span>
                </div>
                {topTemas ? (
                  <p className="text-xs text-slate-500 truncate">{topTemas}</p>
                ) : (
                  <p className="text-xs text-slate-300 italic">Clique para planejar</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Month Dialog ─── */}
      {dialogMes !== null && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDialogMes(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

            {/* Dialog header */}
            <div className="bg-[#085ba7] px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-white font-bold text-xl">{MESES[dialogMes - 1]}</h2>
                <p className="text-blue-200 text-sm">{anoAtivo}</p>
              </div>
              <button
                onClick={() => setDialogMes(null)}
                className="text-blue-200 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog body — scrollable */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* ── Frequência ── */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Frequência de Publicação
                </label>
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Posts por semana</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={dialogData.postsPorSemana}
                      onChange={(e) =>
                        setMesField(anoAtivo, dialogMes, "postsPorSemana", parseInt(e.target.value) || 1)
                      }
                      className="w-28 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Posts por mês (calculado)</label>
                    <input
                      type="number"
                      min="1"
                      value={dialogPostsMes}
                      onChange={(e) => {
                        const m = parseInt(e.target.value) || 1;
                        setMesField(anoAtivo, dialogMes, "postsPorSemana", Math.round(m / (52 / 12)));
                      }}
                      className="w-28 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] text-center"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {dialogData.postsPorSemana} post{dialogData.postsPorSemana !== 1 ? "s" : ""}/semana × 4,33 semanas ={" "}
                  <strong className="text-slate-600">{dialogPostsMes} posts/mês</strong>
                </p>
              </div>

              {/* ── Intensidade ── */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Intensidade</label>
                <div className="flex flex-wrap gap-2">
                  {INTENSIDADES.map((nivel) => {
                    const s = INTENSIDADE_STYLE[nivel];
                    const active = dialogData.intensidade === nivel;
                    return (
                      <button
                        key={nivel}
                        onClick={() => setMesField(anoAtivo, dialogMes, "intensidade", nivel)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                          active
                            ? `${s.bg} ${s.text} ${s.border}`
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {nivel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Temas ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Temas do Mês
                    <span
                      className={`ml-2 text-sm font-bold ${
                        dialogTotalPct === 100
                          ? "text-green-600"
                          : dialogTotalPct > 100
                          ? "text-red-600"
                          : "text-[#ff901c]"
                      }`}
                    >
                      {dialogTotalPct}%
                    </span>
                  </label>
                  <button
                    onClick={() => addTema(anoAtivo, dialogMes)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#085ba7] text-white rounded-lg text-xs hover:bg-[#074a8a] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  {dialogData.temas.map((tema, i) => {
                    const posts = Math.round((tema.percentual / 100) * dialogPostsMes);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tema.nome}
                          onChange={(e) => updateTema(anoAtivo, dialogMes, i, "nome", e.target.value)}
                          placeholder="Nome do tema"
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tema.percentual}
                          onChange={(e) =>
                            updateTema(anoAtivo, dialogMes, i, "percentual", parseInt(e.target.value) || 0)
                          }
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] text-center text-sm"
                        />
                        <span className="text-slate-400 text-xs">%</span>
                        <span className="text-[#085ba7] text-xs font-semibold w-10 text-right">
                          {posts}p
                        </span>
                        <button
                          onClick={() => removeTema(anoAtivo, dialogMes, i)}
                          className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Observações ── */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Observações</label>
                <textarea
                  rows={3}
                  value={dialogData.observacoes}
                  onChange={(e) => setMesField(anoAtivo, dialogMes, "observacoes", e.target.value)}
                  placeholder="Datas comemorativas, campanhas especiais, eventos..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#085ba7] resize-none"
                />
              </div>
            </div>

            {/* Dialog footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setDialogMes(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Fechar
              </button>
              {!dbError && (
                <button
                  onClick={() => saveMes(anoAtivo, dialogMes)}
                  disabled={isSavingDialog}
                  className="flex-1 py-2.5 bg-[#ff901c] text-white rounded-xl hover:bg-[#e08016] transition-colors font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSavingDialog ? "Salvando..." : "Salvar mês"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
