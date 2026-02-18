"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Plus, Download, Trash2, Sparkles } from "lucide-react";
import { generatePersonaPDF } from "@/lib/exports/persona-pdf";
import { generatePersonaDOCX } from "@/lib/exports/persona-docx";

interface Persona {
  id: string;
  nome: string;
  idade_min: number;
  idade_max: number;
  profissao: string;
  dados_demograficos: any;
  narrativa_gerada: string | null;
  imagem_url: string | null;
  created_at: string;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  
  const [formData, setFormData] = useState({
    nome: "",
    idade_min: 25,
    idade_max: 45,
    profissao: "",
    nome_ficticio: "",
    estilo_vida: "",
    valores: "",
    dores: "",
    objetivos: "",
    objecoes: "",
  });

  useEffect(() => {
    loadPersonas();
  }, []);

  async function loadPersonas() {
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setPersonas(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);

    try {
      // Etapa 1: Preparando dados
      setGenerationStep("Preparando dados da persona...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Etapa 2: Gerando narrativa com IA
      setGenerationStep("Gerando narrativa com IA (isso pode levar até 10 segundos)...");
      const narrative = await generateNarrative(formData);
      
      // Etapa 3: Salvando no banco
      setGenerationStep("Salvando persona no banco de dados...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error } = await supabase.from("personas").insert({
        nome: formData.nome,
        idade_min: formData.idade_min,
        idade_max: formData.idade_max,
        profissao: formData.profissao,
        dados_demograficos: {
          nome_ficticio: formData.nome_ficticio,
          estilo_vida: formData.estilo_vida,
          valores: formData.valores,
          dores: formData.dores,
          objetivos: formData.objetivos,
          objecoes: formData.objecoes,
        },
        narrativa_gerada: narrative,
        imagem_url: "/placeholder-persona.jpg",
      });

      if (!error) {
        setGenerationStep("Persona criada com sucesso! ✅");
        await new Promise(resolve => setTimeout(resolve, 800));
        await loadPersonas();
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      console.error("Erro ao criar persona:", error);
      setGenerationStep("Erro ao criar persona. Tente novamente.");
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setGenerating(false);
      setGenerationStep("");
    }
  }

  async function generateNarrative(data: typeof formData): Promise<string> {
    const response = await fetch('/api/generate-persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.narrative) {
      throw new Error('Narrativa vazia retornada');
    }
    
    return result.narrative;
  }

  function resetForm() {
    setFormData({
      nome: "",
      idade_min: 25,
      idade_max: 45,
      profissao: "",
      nome_ficticio: "",
      estilo_vida: "",
      valores: "",
      dores: "",
      objetivos: "",
      objecoes: "",
    });
  }

  async function deletePersona(id: string) {
    if (confirm("Deseja realmente excluir esta persona?")) {
      await supabase.from("personas").delete().eq("id", id);
      loadPersonas();
    }
  }

  async function exportPDF(persona: Persona) {
    generatePersonaPDF(persona);
  }

  async function exportDOCX(persona: Persona) {
    generatePersonaDOCX(persona);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Carregando personas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerador de Personas</h1>
          <p className="text-slate-600 mt-1">Crie personas detalhadas para entender seu público-alvo</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Persona</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Nova Persona</h2>
              <button
                onClick={() => setShowForm(false)}
                disabled={generating}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome da Persona
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: Técnico HVAC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome Fictício
                  </label>
                  <input
                    type="text"
                    value={formData.nome_ficticio}
                    onChange={(e) => setFormData({...formData, nome_ficticio: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: Roberto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Idade Mínima
                  </label>
                  <input
                    type="number"
                    value={formData.idade_min}
                    onChange={(e) => setFormData({...formData, idade_min: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Idade Máxima
                  </label>
                  <input
                    type="number"
                    value={formData.idade_max}
                    onChange={(e) => setFormData({...formData, idade_max: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Profissão
                </label>
                <input
                  type="text"
                  value={formData.profissao}
                  onChange={(e) => setFormData({...formData, profissao: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Técnico Refrigerista"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estilo de Vida
                </label>
                <textarea
                  value={formData.estilo_vida}
                  onChange={(e) => setFormData({...formData, estilo_vida: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Acorda cedo, assiste notícias, trabalha em campo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valores
                </label>
                <input
                  type="text"
                  value={formData.valores}
                  onChange={(e) => setFormData({...formData, valores: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Verdade, transparência, qualidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dores e Desafios
                </label>
                <textarea
                  value={formData.dores}
                  onChange={(e) => setFormData({...formData, dores: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Profissionais não qualificados, urgências..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Objetivos e Sonhos
                </label>
                <textarea
                  value={formData.objetivos}
                  onChange={(e) => setFormData({...formData, objetivos: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Vida de qualidade para família, reconhecimento profissional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Objeções de Compra
                </label>
                <textarea
                  value={formData.objecoes}
                  onChange={(e) => setFormData({...formData, objecoes: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Preços elevados, prazos longos, atendimento lento"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={generating}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Gerar Persona</span>
                    </>
                  )}
                </button>
              </div>

              {/* Overlay de progresso */}
              {generating && generationStep && (
                <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center z-50">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-slate-900">{generationStep}</p>
                      <p className="text-sm text-slate-600">Aguarde, isso pode levar alguns segundos...</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona) => (
          <div key={persona.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Users className="w-24 h-24 text-white opacity-50" />
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{persona.nome}</h3>
                <p className="text-sm text-slate-600">
                  {persona.idade_min} - {persona.idade_max} anos • {persona.profissao}
                </p>
              </div>

              {persona.narrativa_gerada && (
                <p className="text-sm text-slate-600 line-clamp-3">
                  {persona.narrativa_gerada}
                </p>
              )}

              <div className="flex space-x-2 pt-4 border-t">
                <button
                  onClick={() => exportPDF(persona)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => exportDOCX(persona)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>DOCX</span>
                </button>
                <button
                  onClick={() => deletePersona(persona.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {personas.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-24 h-24 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma persona criada</h3>
          <p className="text-slate-500 mb-6">Crie sua primeira persona para começar</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Persona</span>
          </button>
        </div>
      )}
    </div>
  );
}
