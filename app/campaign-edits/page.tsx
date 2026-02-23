"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Save, X, Upload, Calendar, FileText, Target, Download, Filter } from "lucide-react";

interface CampaignEdit {
  id?: string;
  tipo_campanha: string;
  nivel_edicao: string;
  data_alteracao: string;
  descricao_alteracao: string;
  imagens_alteracao: string[];
  motivo: string;
  data_revisao: string;
  observacoes_revisao: string;
  created_at?: string;
}

const NIVEIS_PESQUISA = [
  "Campanha",
  "Grupo de Anúncio",
  "Anúncio",
  "Palavra-chave",
  "Palavra-chave negativa",
  "Outros"
];

const NIVEIS_PERFORMANCE_MAX = [
  "Grupo de recurso",
  "Fichas/Produtos",
  "Indicadores de público-alvo",
  "Temas de pesquisa",
  "Termo de pesquisa negativa",
  "Canais bloqueados"
];

export default function CampaignEditsPage() {
  const [edits, setEdits] = useState<CampaignEdit[]>([]);
  const [filteredEdits, setFilteredEdits] = useState<CampaignEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>("Todos");

  const [formData, setFormData] = useState<CampaignEdit>({
    tipo_campanha: "Pesquisa",
    nivel_edicao: "",
    data_alteracao: new Date().toISOString().split('T')[0],
    descricao_alteracao: "",
    imagens_alteracao: [],
    motivo: "",
    data_revisao: "",
    observacoes_revisao: ""
  });

  useEffect(() => {
    loadEdits();
  }, []);

  useEffect(() => {
    if (filterTipo === "Todos") {
      setFilteredEdits(edits);
    } else {
      setFilteredEdits(edits.filter(edit => edit.tipo_campanha === filterTipo));
    }
  }, [filterTipo, edits]);

  async function loadEdits() {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaign_edits")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEdits(data);
      setFilteredEdits(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("campaign_edits")
        .insert({
          tipo_campanha: formData.tipo_campanha,
          nivel_edicao: formData.nivel_edicao,
          data_alteracao: formData.data_alteracao,
          descricao_alteracao: formData.descricao_alteracao,
          imagens_alteracao: formData.imagens_alteracao,
          motivo: formData.motivo,
          data_revisao: formData.data_revisao || null,
          observacoes_revisao: formData.observacoes_revisao
        });

      if (!error) {
        await loadEdits();
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setFormData({
      tipo_campanha: "Pesquisa",
      nivel_edicao: "",
      data_alteracao: new Date().toISOString().split('T')[0],
      descricao_alteracao: "",
      imagens_alteracao: [],
      motivo: "",
      data_revisao: "",
      observacoes_revisao: ""
    });
  }

  async function handleImagePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setFormData(prev => ({
              ...prev,
              imagens_alteracao: [...prev.imagens_alteracao, base64]
            }));
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  }

  function removeImage(index: number) {
    setFormData(prev => ({
      ...prev,
      imagens_alteracao: prev.imagens_alteracao.filter((_, i) => i !== index)
    }));
  }

  async function deleteEdit(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta edição?")) return;

    const { error } = await supabase
      .from("campaign_edits")
      .delete()
      .eq("id", id);

    if (!error) {
      await loadEdits();
    }
  }

  const niveisDisponiveis = formData.tipo_campanha === "Pesquisa" 
    ? NIVEIS_PESQUISA 
    : NIVEIS_PERFORMANCE_MAX;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#085ba7] to-[#108bd1] rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edições em Campanhas</h1>
            <p className="text-slate-600">Registre e acompanhe alterações em campanhas Google Ads</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#ff901c] to-[#085ba7] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Edição</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">Filtrar por:</span>
          </div>
          <div className="flex space-x-2">
            {["Todos", "Pesquisa", "Performance Max"].map(tipo => (
              <button
                key={tipo}
                onClick={() => setFilterTipo(tipo)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterTipo === tipo
                    ? "bg-gradient-to-r from-[#085ba7] to-[#108bd1] text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-slate-600 font-medium">
            {filteredEdits.length} edição{filteredEdits.length !== 1 ? 'ões' : ''}
          </div>
        </div>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Registrar Nova Edição</h2>
              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Campanha */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tipo de Campanha *
                </label>
                <select
                  value={formData.tipo_campanha}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tipo_campanha: e.target.value,
                    nivel_edicao: ""
                  })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1] focus:border-transparent font-medium"
                  required
                >
                  <option value="Pesquisa">Pesquisa</option>
                  <option value="Performance Max">Performance Max</option>
                </select>
              </div>

              {/* Nível de Edição */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nível de Edição *
                </label>
                <select
                  value={formData.nivel_edicao}
                  onChange={(e) => setFormData({ ...formData, nivel_edicao: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1] focus:border-transparent font-medium"
                  required
                >
                  <option value="">Selecione o nível...</option>
                  {niveisDisponiveis.map(nivel => (
                    <option key={nivel} value={nivel}>{nivel}</option>
                  ))}
                </select>
              </div>

              {/* Data da Alteração */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data da Alteração *
                </label>
                <input
                  type="date"
                  value={formData.data_alteracao}
                  onChange={(e) => setFormData({ ...formData, data_alteracao: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1] focus:border-transparent"
                  required
                />
              </div>

              {/* Descrição da Alteração */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Descrição da Alteração *
                </label>
                <div className="space-y-3">
                  <textarea
                    value={formData.descricao_alteracao}
                    onChange={(e) => setFormData({ ...formData, descricao_alteracao: e.target.value })}
                    onPaste={handleImagePaste}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1] focus:border-transparent"
                    placeholder="Descreva a alteração realizada... (Ctrl+V para colar imagens)"
                    required
                  />
                  <p className="text-xs text-slate-500 flex items-center space-x-1">
                    <Upload className="w-3 h-3" />
                    <span>Dica: Cole imagens diretamente no campo acima (Ctrl+V)</span>
                  </p>

                  {/* Preview de Imagens */}
                  {formData.imagens_alteracao.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {formData.imagens_alteracao.map((img, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={img} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Motivo da Alteração *
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1] focus:border-transparent"
                  placeholder="Por que esta alteração foi necessária?"
                  required
                />
              </div>

              {/* Data de Revisão */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data de Revisão
                </label>
                <input
                  type="date"
                  value={formData.data_revisao}
                  onChange={(e) => setFormData({ ...formData, data_revisao: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1] focus:border-transparent"
                />
              </div>

              {/* Observações da Revisão */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Observações da Revisão
                </label>
                <textarea
                  value={formData.observacoes_revisao}
                  onChange={(e) => setFormData({ ...formData, observacoes_revisao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1] focus:border-transparent"
                  placeholder="Resultados observados após a alteração..."
                />
              </div>

              {/* Botões */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:bg-[#e58318] transition-all disabled:opacity-50 font-semibold"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Salvar Edição</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Edições */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#108bd1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEdits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-300">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {filterTipo === "Todos" ? "Nenhuma edição registrada" : `Nenhuma edição ${filterTipo}`}
          </h3>
          <p className="text-slate-600 mb-6">
            {filterTipo === "Todos" 
              ? "Comece registrando sua primeira edição de campanha" 
              : `Não há edições do tipo "${filterTipo}"`}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#ff901c] to-[#085ba7] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Edição</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredEdits.map((edit) => (
            <div key={edit.id} className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#108bd1] to-[#085ba7] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-3 py-1 bg-[#085ba7] text-white text-xs font-bold rounded-full">
                        {edit.tipo_campanha}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                        {edit.nivel_edicao}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Alteração: {new Date(edit.data_alteracao).toLocaleDateString('pt-BR')}</span>
                      </span>
                      {edit.data_revisao && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Revisão: {new Date(edit.data_revisao).toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => edit.id && deleteEdit(edit.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Descrição da Alteração:</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{edit.descricao_alteracao}</p>
                </div>

                {edit.imagens_alteracao && edit.imagens_alteracao.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Evidências:</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {edit.imagens_alteracao.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Evidência ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-[#108bd1] transition-colors"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Motivo:</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{edit.motivo}</p>
                </div>

                {edit.observacoes_revisao && (
                  <div className="bg-blue-50 border-l-4 border-[#108bd1] p-4 rounded">
                    <h4 className="text-sm font-bold text-[#085ba7] mb-1">Observações da Revisão:</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{edit.observacoes_revisao}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
