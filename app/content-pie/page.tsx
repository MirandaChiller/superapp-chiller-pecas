"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Settings, X } from "lucide-react";

interface Tema {
  nome: string;
  percentual: number;
}

interface MesData {
  intensidade: "Baixa" | "Normal" | "Alta" | "Muito Alta";
  observacoes: string;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

const INTENSIDADES = ["Baixa", "Normal", "Alta", "Muito Alta"] as const;

const INTENSIDADE_STYLE: Record<string, { bg: string; text: string }> = {
  Baixa:      { bg: "bg-slate-100",   text: "text-slate-600" },
  Normal:     { bg: "bg-blue-100",    text: "text-[#085ba7]" },
  Alta:       { bg: "bg-orange-100",  text: "text-[#ff901c]" },
  "Muito Alta": { bg: "bg-red-100",   text: "text-red-700" },
};

const SQL_SETUP = `-- Execute no SQL Editor do Supabase Dashboard:
CREATE TABLE IF NOT EXISTS content_pie_mensal (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ano integer NOT NULL,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  intensidade text DEFAULT 'Normal',
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ano, mes)
);`;

const DEFAULT_TEMAS: Tema[] = [
  { nome: "Produtos e Lançamentos", percentual: 30 },
  { nome: "Educacional e Dicas", percentual: 25 },
  { nome: "Bastidores e Equipe", percentual: 20 },
  { nome: "Entretenimento", percentual: 15 },
  { nome: "Depoimentos", percentual: 10 },
];

export default function ContentPiePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [postsPorSemana, setPostsPorSemana] = useState(3);
  const [temas, setTemas] = useState<Tema[]>(DEFAULT_TEMAS);
  const [showConfig, setShowConfig] = useState(false);

  // Monthly planning
  const [planejamento, setPlanejamento] = useState<Record<string, MesData>>({});
  const [anos, setAnos] = useState<number[]>([new Date().getFullYear()]);
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());
  const [novoAnoInput, setNovoAnoInput] = useState("");
  const [expandedMes, setExpandedMes] = useState<number | null>(null);
  const [savingMes, setSavingMes] = useState<string | null>(null);
  const [dbError, setDbError] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    // Base config
    const { data: configData } = await supabase
      .from("content_pie")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (configData) {
      setSavedId(configData.id);
      setPostsPorSemana(configData.posts_por_dia || 3);
      if (configData.temas?.length > 0) setTemas(configData.temas);
    }

    // Monthly planning
    const { data: planData, error } = await supabase
      .from("content_pie_mensal")
      .select("*");

    if (error) {
      setDbError(true);
    } else if (planData) {
      const plan: Record<string, MesData> = {};
      const anosSet = new Set<number>([new Date().getFullYear()]);
      planData.forEach((row) => {
        anosSet.add(row.ano);
        plan[`${row.ano}-${row.mes}`] = {
          intensidade: row.intensidade || "Normal",
          observacoes: row.observacoes || "",
        };
      });
      setPlanejamento(plan);
      setAnos(Array.from(anosSet).sort((a, b) => a - b));
    }

    setLoading(false);
  }

  async function saveConfig() {
    setSaving(true);
    const dataToSave = { posts_por_dia: postsPorSemana, temas };
    if (savedId) {
      await supabase.from("content_pie").update(dataToSave).eq("id", savedId);
    } else {
      const { data } = await supabase
        .from("content_pie")
        .insert(dataToSave)
        .select()
        .single();
      if (data) setSavedId(data.id);
    }
    setSaving(false);
  }

  async function saveMes(ano: number, mes: number) {
    const key = `${ano}-${mes}`;
    setSavingMes(key);
    const mesData = planejamento[key] || { intensidade: "Normal", observacoes: "" };

    await supabase.from("content_pie_mensal").upsert(
      {
        ano,
        mes,
        intensidade: mesData.intensidade,
        observacoes: mesData.observacoes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ano,mes" }
    );

    setSavingMes(null);
  }

  function updateMes(ano: number, mes: number, field: keyof MesData, value: string) {
    const key = `${ano}-${mes}`;
    setPlanejamento((prev) => ({
      ...prev,
      [key]: { ...((prev[key]) || { intensidade: "Normal", observacoes: "" }), [field]: value },
    }));
  }

  function addTema() {
    setTemas([...temas, { nome: "", percentual: 0 }]);
  }

  function removeTema(index: number) {
    setTemas(temas.filter((_, i) => i !== index));
  }

  function updateTema(index: number, field: keyof Tema, value: string | number) {
    const newTemas = [...temas];
    newTemas[index] = { ...newTemas[index], [field]: value };
    setTemas(newTemas);
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
    const newAnos = anos.filter((a) => a !== ano);
    setAnos(newAnos);
    if (anoAtivo === ano) setAnoAtivo(newAnos[newAnos.length - 1]);
  }

  const totalPercentual = temas.reduce((sum, t) => sum + t.percentual, 0);
  const totalPostsMes = Math.round(postsPorSemana * (52 / 12));

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Temas & Intensidades</h1>
          <p className="text-slate-600 mt-1">Planejamento mensal de conteúdo por ano</p>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
          {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* DB Error banner */}
      {dbError && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">Tabela de planejamento mensal não encontrada</p>
              <p className="text-sm text-amber-700 mt-1">
                Execute o SQL abaixo no Supabase Dashboard para ativar o planejamento mensal.
              </p>
            </div>
            <button
              onClick={() => setShowSQL(!showSQL)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold"
            >
              {showSQL ? "Ocultar SQL" : "Ver SQL"}
            </button>
          </div>
          {showSQL && (
            <pre className="mt-4 bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
              {SQL_SETUP}
            </pre>
          )}
        </div>
      )}

      {/* Config Panel (collapsible) */}
      {showConfig && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Configuração Base</h2>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2 bg-[#ff901c] text-white rounded-lg hover:bg-[#e08016] transition-all disabled:opacity-50 font-semibold"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Salvando..." : "Salvar Config"}</span>
            </button>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Frequência de publicação
            </label>
            <div className="flex items-end gap-6 flex-wrap">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Posts por semana</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={postsPorSemana}
                  onChange={(e) => setPostsPorSemana(parseInt(e.target.value) || 1)}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Posts por mês (calculado)</label>
                <input
                  type="number"
                  min="1"
                  value={totalPostsMes}
                  onChange={(e) => {
                    const mes = parseInt(e.target.value) || 1;
                    setPostsPorSemana(Math.round(mes / (52 / 12)));
                  }}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {postsPorSemana} post{postsPorSemana !== 1 ? "s" : ""}/semana × 4,33 semanas = {totalPostsMes} posts/mês
            </p>
          </div>

          {/* Temas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Temas de Conteúdo
                <span className={`ml-3 text-sm font-bold ${totalPercentual === 100 ? "text-green-600" : totalPercentual > 100 ? "text-red-600" : "text-[#ff901c]"}`}>
                  {totalPercentual}%
                </span>
              </h3>
              <button
                onClick={addTema}
                className="flex items-center space-x-2 px-3 py-1.5 bg-[#085ba7] text-white rounded-lg hover:bg-[#074a8a] text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>
            <div className="space-y-2">
              {temas.map((tema, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={tema.nome}
                    onChange={(e) => updateTema(index, "nome", e.target.value)}
                    placeholder="Nome do tema"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tema.percentual}
                    onChange={(e) => updateTema(index, "percentual", parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] text-center text-sm"
                  />
                  <span className="text-slate-500 text-sm w-4">%</span>
                  <button onClick={() => removeTema(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Annual Planning */}
      <div className="space-y-4">
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
                  className={`px-2 py-2 rounded-r-lg text-sm transition-all border-l border-white/30 ${
                    anoAtivo === ano
                      ? "bg-[#085ba7] text-white/80 hover:text-white"
                      : "bg-white border border-slate-300 border-l-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  }`}
                  title="Remover ano"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Add year */}
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
              className="p-2 bg-[#ff901c] text-white rounded-lg hover:bg-[#e08016] transition-colors"
              title="Adicionar ano"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 12 month cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MESES.map((nomeMes, idx) => {
            const mes = idx + 1;
            const key = `${anoAtivo}-${mes}`;
            const mesData: MesData = planejamento[key] || { intensidade: "Normal", observacoes: "" };
            const isExpanded = expandedMes === mes;
            const isSaving = savingMes === key;
            const style = INTENSIDADE_STYLE[mesData.intensidade] || INTENSIDADE_STYLE.Normal;

            return (
              <div
                key={mes}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card header */}
                <div className="bg-[#085ba7] px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold text-sm">{nomeMes}</span>
                    <span className="text-blue-200 text-xs ml-2">{anoAtivo}</span>
                  </div>
                  <button
                    onClick={() => setExpandedMes(isExpanded ? null : mes)}
                    className="text-blue-200 hover:text-white transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Card summary (always visible) */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                    {mesData.intensidade}
                  </span>
                  <span className="text-xs text-slate-500">{totalPostsMes} posts</span>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 space-y-4 pt-3">
                    {/* Intensidade */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Intensidade
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {INTENSIDADES.map((nivel) => {
                          const s = INTENSIDADE_STYLE[nivel];
                          return (
                            <button
                              key={nivel}
                              onClick={() => updateMes(anoAtivo, mes, "intensidade", nivel)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all ${
                                mesData.intensidade === nivel
                                  ? `${s.bg} ${s.text} border-current`
                                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {nivel}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Temas distribuição */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Temas do mês
                      </label>
                      <div className="space-y-1.5">
                        {temas.map((tema, i) => {
                          const posts = Math.round((tema.percentual / 100) * totalPostsMes);
                          return (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 truncate flex-1 mr-2">{tema.nome || "—"}</span>
                              <span className="text-slate-400 whitespace-nowrap">
                                {tema.percentual}% · {posts}p
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Observações
                      </label>
                      <textarea
                        rows={2}
                        value={mesData.observacoes}
                        onChange={(e) => updateMes(anoAtivo, mes, "observacoes", e.target.value)}
                        placeholder="Datas especiais, campanhas, notas..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#085ba7] resize-none"
                      />
                    </div>

                    {/* Save button */}
                    {!dbError && (
                      <button
                        onClick={() => saveMes(anoAtivo, mes)}
                        disabled={isSaving}
                        className="w-full py-2 bg-[#ff901c] text-white rounded-lg text-xs font-semibold hover:bg-[#e08016] transition-colors disabled:opacity-50"
                      >
                        {isSaving ? "Salvando..." : "Salvar mês"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
