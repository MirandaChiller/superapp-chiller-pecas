"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PieChart, Plus, Trash2, Save } from "lucide-react";

interface Tema {
  nome: string;
  percentual: number;
}

export default function ContentPiePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [postsPorDia, setPostsPorDia] = useState(3);
  const [temas, setTemas] = useState<Tema[]>([
    { nome: "Produtos e Lançamentos", percentual: 30 },
    { nome: "Educacional e Dicas", percentual: 25 },
    { nome: "Bastidores e Equipe", percentual: 20 },
    { nome: "Entretenimento", percentual: 15 },
    { nome: "Depoimentos", percentual: 10 },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("content_pie")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setSavedId(data.id);
      setPostsPorDia(data.posts_por_dia || 3);
      if (data.temas && data.temas.length > 0) {
        setTemas(data.temas);
      }
    }
    setLoading(false);
  }

  async function saveData() {
    setSaving(true);
    
    const dataToSave = {
      posts_por_dia: postsPorDia,
      temas: temas,
    };

    if (savedId) {
      const { error } = await supabase
        .from("content_pie")
        .update(dataToSave)
        .eq("id", savedId);
      
      if (!error) alert("✅ Salvo!");
    } else {
      const { data, error } = await supabase
        .from("content_pie")
        .insert(dataToSave)
        .select()
        .single();
      
      if (!error && data) {
        setSavedId(data.id);
        alert("✅ Salvo!");
      }
    }
    
    setSaving(false);
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

  const totalPercentual = temas.reduce((sum, t) => sum + t.percentual, 0);
  const totalPostsMes = postsPorDia * 30;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-[#ff901c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Content Pie Planner</h1>
          <p className="text-slate-600 mt-1">Distribua temas e calcule volume mensal</p>
        </div>
        <button
          onClick={saveData}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#ff901c] to-[#085ba7] text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Salvando..." : "Salvar"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quantos posts por dia?
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={postsPorDia}
              onChange={(e) => setPostsPorDia(parseInt(e.target.value) || 1)}
              className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-sm text-slate-500 mt-1">
              = {totalPostsMes} posts/mês
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Temas de Conteúdo</h3>
              <button
                onClick={addTema}
                className="flex items-center space-x-2 px-4 py-2 bg-[#ff901c] text-white rounded-lg hover:bg-[#ff901c] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Tema</span>
              </button>
            </div>

            <div className="space-y-3">
              {temas.map((tema, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={tema.nome}
                    onChange={(e) => updateTema(index, "nome", e.target.value)}
                    placeholder="Nome do tema"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tema.percentual}
                    onChange={(e) => updateTema(index, "percentual", parseInt(e.target.value) || 0)}
                    className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-center"
                  />
                  <span className="text-slate-600 w-8">%</span>
                  <button
                    onClick={() => removeTema(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Total:</span>
                <span className={`text-lg font-bold ${
                  totalPercentual === 100 ? "text-green-600" : 
                  totalPercentual > 100 ? "text-red-600" : 
                  "text-[#ff901c]"
                }`}>
                  {totalPercentual}%
                </span>
              </div>
              {totalPercentual !== 100 && (
                <p className="text-sm text-slate-500 mt-1">
                  {totalPercentual > 100 
                    ? "⚠️ Total acima de 100%. Ajuste os percentuais." 
                    : "ℹ️ Pode ultrapassar 100% se necessário."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribuição de Posts</h3>
          
          <div className="space-y-3">
            {temas.map((tema, index) => {
              const posts = Math.round((tema.percentual / 100) * totalPostsMes);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 font-medium">{tema.nome || "Sem nome"}</span>
                    <span className="text-slate-600">{posts} posts</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#ff901c] to-[#085ba7] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(tema.percentual, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#ff901c]">{totalPostsMes}</div>
              <div className="text-sm text-slate-600">Posts totais/mês</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
