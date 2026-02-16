"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Target, Plus, Save, Trash2, Download } from "lucide-react";

const CHECKLIST_ITEMS = [
  {
    categoria: "Desempenho Geral",
    itens: [
      "Taxa de conversão acima de 2%",
      "CPC dentro do orçamento planejado",
      "ROAS (Return on Ad Spend) acima de 3",
      "Frequência de exibição entre 2-3",
    ],
  },
  {
    categoria: "Alcance & Visibilidade",
    itens: [
      "Alcance crescendo semana a semana",
      "Impressões distribuídas ao longo do dia",
      "Público-alvo sendo atingido (>80%)",
      "Segmentação por interesses funcionando",
    ],
  },
  {
    categoria: "Engajamento",
    itens: [
      "Taxa de cliques (CTR) acima de 1%",
      "Tempo médio de visualização >50%",
      "Comentários positivos > comentários negativos",
      "Compartilhamentos acontecendo organicamente",
    ],
  },
  {
    categoria: "Vídeo (se aplicável)",
    itens: [
      "ThruPlay rate acima de 25%",
      "Retenção nos primeiros 3 segundos >60%",
      "Vídeos de até 15 segundos performando melhor",
      "Call-to-action claro nos primeiros frames",
    ],
  },
];

interface ChecklistItem {
  item: string;
  checked: boolean;
  observacao: string;
}

interface Campanha {
  id: string;
  nome: string;
  data_analise: string;
  checklist_itens: ChecklistItem[];
  created_at: string;
}

export default function MetricsMatcherPage() {
  const [loading, setLoading] = useState(true);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    data_analise: new Date().toISOString().split('T')[0],
    checklist_itens: CHECKLIST_ITEMS.flatMap(cat => 
      cat.itens.map(item => ({
        item: `${cat.categoria}: ${item}`,
        checked: false,
        observacao: "",
      }))
    ),
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("campanhas_trafego")
      .select("*")
      .order("data_analise", { ascending: false });
    
    if (data) {
      setCampanhas(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editingId) {
      const { error } = await supabase
        .from("campanhas_trafego")
        .update(formData)
        .eq("id", editingId);
      
      if (!error) {
        await loadData();
        setShowForm(false);
        setEditingId(null);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("campanhas_trafego")
        .insert(formData);

      if (!error) {
        await loadData();
        setShowForm(false);
        resetForm();
      }
    }
  }

  async function deleteCampanha(id: string) {
    if (confirm("Deseja excluir esta análise?")) {
      await supabase.from("campanhas_trafego").delete().eq("id", id);
      loadData();
    }
  }

  function editCampanha(campanha: Campanha) {
    setFormData({
      nome: campanha.nome,
      data_analise: campanha.data_analise,
      checklist_itens: campanha.checklist_itens,
    });
    setEditingId(campanha.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      nome: "",
      data_analise: new Date().toISOString().split('T')[0],
      checklist_itens: CHECKLIST_ITEMS.flatMap(cat => 
        cat.itens.map(item => ({
          item: `${cat.categoria}: ${item}`,
          checked: false,
          observacao: "",
        }))
      ),
    });
  }

  function updateChecklistItem(index: number, field: keyof ChecklistItem, value: boolean | string) {
    const newItems = [...formData.checklist_itens];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, checklist_itens: newItems });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Magic Metrics Matcher</h1>
          <p className="text-slate-600 mt-1">Checklist de otimização para tráfego pago</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Análise</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? "Editar Análise" : "Nova Análise"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome da Campanha
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Campanha Black Friday 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data da Análise
                  </label>
                  <input
                    type="date"
                    value={formData.data_analise}
                    onChange={(e) => setFormData({...formData, data_analise: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {CHECKLIST_ITEMS.map((categoria, catIndex) => (
                  <div key={catIndex} className="border border-slate-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">{categoria.categoria}</h3>
                    <div className="space-y-3">
                      {categoria.itens.map((item, itemIndex) => {
                        const globalIndex = CHECKLIST_ITEMS.slice(0, catIndex)
                          .reduce((sum, cat) => sum + cat.itens.length, 0) + itemIndex;
                        
                        return (
                          <div key={itemIndex} className="space-y-2">
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={formData.checklist_itens[globalIndex]?.checked || false}
                                onChange={(e) => updateChecklistItem(globalIndex, "checked", e.target.checked)}
                                className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <div className="flex-1">
                                <label className="text-sm text-slate-700">{item}</label>
                                <input
                                  type="text"
                                  value={formData.checklist_itens[globalIndex]?.observacao || ""}
                                  onChange={(e) => updateChecklistItem(globalIndex, "observacao", e.target.value)}
                                  placeholder="Observações (opcional)"
                                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg"
                >
                  {editingId ? "Atualizar" : "Salvar"} Análise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campanhas.map((campanha) => {
          const totalItens = campanha.checklist_itens.length;
          const itensChecked = campanha.checklist_itens.filter(i => i.checked).length;
          const percentual = Math.round((itensChecked / totalItens) * 100);

          return (
            <div key={campanha.id} className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{campanha.nome}</h3>
                  <p className="text-sm text-slate-500">
                    {new Date(campanha.data_analise).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editCampanha(campanha)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteCampanha(campanha.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Progresso</span>
                  <span className="font-semibold text-slate-900">{itensChecked}/{totalItens}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      percentual >= 80 ? "bg-green-500" :
                      percentual >= 50 ? "bg-yellow-500" :
                      "bg-red-500"
                    }`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{percentual}% concluído</p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  {campanha.checklist_itens.filter(i => i.observacao).length} observações registradas
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {campanhas.length === 0 && (
        <div className="text-center py-16">
          <Target className="w-24 h-24 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma análise criada</h3>
          <p className="text-slate-500 mb-6">Crie sua primeira análise de campanha</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Análise</span>
          </button>
        </div>
      )}
    </div>
  );
}
