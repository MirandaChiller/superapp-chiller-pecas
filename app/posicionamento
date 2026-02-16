"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Target, Download, Save, ChevronRight, ChevronLeft } from "lucide-react";

export default function PosicionamentoPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  
  const [canvas, setCanvas] = useState({
    setor: "",
    concorrentes: "",
    diferenciais: "",
    unico: "",
  });
  
  const [ikigai, setIkigai] = useState({
    paixao: "",
    mundo_precisa: "",
    pagariam: "",
    somos_bons: "",
  });
  
  const [declaracao, setDeclaracao] = useState({
    nome_marca: "",
    categoria: "",
    publico: "",
    subcat: "",
    diferencial: "",
    motivo: "",
    proposta: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("posicionamentos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setSavedId(data.id);
      if (data.canvas_data) setCanvas(data.canvas_data);
      if (data.ikigai_data) setIkigai(data.ikigai_data);
      if (data.declaracao) {
        try {
          const parsed = JSON.parse(data.declaracao);
          setDeclaracao(parsed);
        } catch (e) {
          // Ignorar se não for JSON válido
        }
      }
    }
    setLoading(false);
  }

  async function saveData() {
    setSaving(true);
    
    const dataToSave = {
      canvas_data: canvas,
      ikigai_data: ikigai,
      declaracao: JSON.stringify(declaracao),
    };

    if (savedId) {
      // Update
      const { error } = await supabase
        .from("posicionamentos")
        .update(dataToSave)
        .eq("id", savedId);
      
      if (!error) {
        alert("✅ Posicionamento atualizado!");
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from("posicionamentos")
        .insert(dataToSave)
        .select()
        .single();
      
      if (!error && data) {
        setSavedId(data.id);
        alert("✅ Posicionamento salvo!");
      }
    }
    
    setSaving(false);
  }

  async function exportPDF() {
    const declaracaoText = generateDeclaracaoText();
    
    // Criar PDF simples
    const content = `
POSICIONAMENTO DE MARCA

CANVAS DA MARCA
Setor: ${canvas.setor}
Concorrentes: ${canvas.concorrentes}
Diferenciais: ${canvas.diferenciais}
Único: ${canvas.unico}

IKIGAI
Paixão: ${ikigai.paixao}
Mundo Precisa: ${ikigai.mundo_precisa}
Pagariam: ${ikigai.pagariam}
Somos Bons: ${ikigai.somos_bons}

DECLARAÇÃO
${declaracaoText}
    `;
    
    alert("PDF será gerado em breve (implementação final pendente)");
    console.log(content);
  }

  const generateDeclaracaoText = () => {
    return `${declaracao.nome_marca} é uma marca de ${declaracao.categoria} que existe para ${declaracao.publico}, ajudando ${declaracao.subcat}. Diferente de ${canvas.concorrentes}, nós fazemos isso com ${declaracao.diferencial}, porque acreditamos que ${declaracao.motivo}. Por isso, entregamos ${declaracao.proposta} todos os dias.`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Posicionamento de Marca</h1>
          <p className="text-slate-600 mt-1">Canvas → IKIGAI → Declaração</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={saveData}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Salvando..." : "Salvar"}</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-8">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              step === s
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200 hover:border-orange-300"
            }`}
          >
            <div className="text-sm opacity-75">Etapa {s}</div>
            <div className="font-bold">
              {s === 1 ? "Canvas da Marca" : s === 2 ? "IKIGAI" : "Declaração"}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Canvas da Marca</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Em que setor/categoria sua marca atua?
              </label>
              <input
                type="text"
                value={canvas.setor}
                onChange={(e) => setCanvas({...canvas, setor: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ex: E-commerce de peças HVAC e refrigeração industrial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Com quem minha marca está competindo?
              </label>
              <textarea
                value={canvas.concorrentes}
                onChange={(e) => setCanvas({...canvas, concorrentes: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Liste seus principais concorrentes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Em que minha marca é melhor que eles?
              </label>
              <textarea
                value={canvas.diferenciais}
                onChange={(e) => setCanvas({...canvas, diferenciais: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Seus diferenciais competitivos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                O que faz a minha marca única?
              </label>
              <textarea
                value={canvas.unico}
                onChange={(e) => setCanvas({...canvas, unico: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Seu posicionamento único"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <span>Próxima Etapa</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">IKIGAI de Marca</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  O que os colaboradores fazem com paixão?
                </label>
                <textarea
                  value={ikigai.paixao}
                  onChange={(e) => setIkigai({...ikigai, paixao: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="O que move a equipe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  O que o mundo precisa e que minha marca entrega?
                </label>
                <textarea
                  value={ikigai.mundo_precisa}
                  onChange={(e) => setIkigai({...ikigai, mundo_precisa: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Necessidade do mercado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Por que pagariam pelo meu produto/serviço?
                </label>
                <textarea
                  value={ikigai.pagariam}
                  onChange={(e) => setIkigai({...ikigai, pagariam: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Proposta de valor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  No que minha marca é boa?
                </label>
                <textarea
                  value={ikigai.somos_bons}
                  onChange={(e) => setIkigai({...ikigai, somos_bons: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Competências principais"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <span>Próxima Etapa</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Declaração de Posicionamento</h2>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {generateDeclaracaoText()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={declaracao.nome_marca}
                onChange={(e) => setDeclaracao({...declaracao, nome_marca: e.target.value})}
                placeholder="Nome da Marca"
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                value={declaracao.categoria}
                onChange={(e) => setDeclaracao({...declaracao, categoria: e.target.value})}
                placeholder="Categoria"
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                value={declaracao.publico}
                onChange={(e) => setDeclaracao({...declaracao, publico: e.target.value})}
                placeholder="Público-alvo"
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                value={declaracao.subcat}
                onChange={(e) => setDeclaracao({...declaracao, subcat: e.target.value})}
                placeholder="Como ajuda (subcategoria)"
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                value={declaracao.diferencial}
                onChange={(e) => setDeclaracao({...declaracao, diferencial: e.target.value})}
                placeholder="Diferencial"
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                value={declaracao.motivo}
                onChange={(e) => setDeclaracao({...declaracao, motivo: e.target.value})}
                placeholder="Motivo/Crença"
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                value={declaracao.proposta}
                onChange={(e) => setDeclaracao({...declaracao, proposta: e.target.value})}
                placeholder="Proposta de Marca"
                className="col-span-2 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
