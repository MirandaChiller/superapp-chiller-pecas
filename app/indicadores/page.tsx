"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Plus, Trash2 } from "lucide-react";

interface Post {
  id: string;
  data_publicacao: string;
  tema: string;
  gancho: string;
}

interface Metrica {
  id: string;
  post_id: string;
  data_coleta: string;
  curtidas: number;
  comentarios: number;
  salvamentos: number;
  compartilhamentos: number;
  seguidores: number;
  visitas_perfil: number;
  score: number;
  categoria: string;
  investimento: number | null;
  publico: number | null;
  ganho_seguidores_impulsionamento: number | null;
  custo_por_seguidor: number | null;
  post?: Post;
}

export default function IndicadoresPage() {
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    post_id: "",
    data_coleta: new Date().toISOString().split('T')[0],
    curtidas: 0,
    comentarios: 0,
    salvamentos: 0,
    compartilhamentos: 0,
    seguidores: 0,
    visitas_perfil: 0,
    investimento: 0,
    publico: 0,
    ganho_seguidores_impulsionamento: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Carregar posts do Feed
    const { data: postsData } = await supabase
      .from("posts_planejados")
      .select("id, data_publicacao, tema, gancho")
      .eq("status", "Publicado")
      .order("data_publicacao", { ascending: false });
    
    if (postsData) {
      setPosts(postsData);
    }

    // Carregar métricas
    const { data: metricasData } = await supabase
      .from("metricas_posts")
      .select(`
        *,
        post:posts_planejados(id, data_publicacao, tema, gancho)
      `)
      .order("data_coleta", { ascending: false });
    
    if (metricasData) {
      setMetricas(metricasData.map(m => ({
        ...m,
        post: Array.isArray(m.post) ? m.post[0] : m.post
      })));
    }
    
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const custo = formData.investimento && formData.ganho_seguidores_impulsionamento > 0
      ? formData.investimento / formData.ganho_seguidores_impulsionamento
      : null;

    const { error } = await supabase
      .from("metricas_posts")
      .insert({
        ...formData,
        investimento: formData.investimento || null,
        publico: formData.publico || null,
        ganho_seguidores_impulsionamento: formData.ganho_seguidores_impulsionamento || null,
        custo_por_seguidor: custo,
      });

    if (!error) {
      await loadData();
      setShowForm(false);
      resetForm();
    }
  }

  async function deleteMetrica(id: string) {
    if (confirm("Deseja excluir esta métrica?")) {
      await supabase.from("metricas_posts").delete().eq("id", id);
      loadData();
    }
  }

  function resetForm() {
    setFormData({
      post_id: posts[0]?.id || "",
      data_coleta: new Date().toISOString().split('T')[0],
      curtidas: 0,
      comentarios: 0,
      salvamentos: 0,
      compartilhamentos: 0,
      seguidores: 0,
      visitas_perfil: 0,
      investimento: 0,
      publico: 0,
      ganho_seguidores_impulsionamento: 0,
    });
  }

  function getCategoriaColor(categoria: string) {
    switch (categoria) {
      case "SUPER EXCELENTE": return "bg-purple-100 text-purple-700 border-purple-300";
      case "EXCELENTE": return "bg-green-100 text-green-700 border-green-300";
      case "ÓTIMO": return "bg-blue-100 text-blue-700 border-blue-300";
      case "RUIM": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-slate-100 text-slate-700 border-slate-300";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-[#085ba7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Indicadores de Performance</h1>
          <p className="text-slate-600 mt-1">Sistema de score automático</p>
        </div>
        <button
          onClick={() => {
            if (posts.length === 0) {
              alert("⚠️ Você precisa ter posts publicados no Feed primeiro!");
              return;
            }
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Métrica</span>
        </button>
      </div>

      {posts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            ⚠️ Você precisa marcar posts como "Publicado" no <strong>Planejamento de Feed</strong> antes de adicionar métricas aqui.
          </p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Nova Métrica</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Selecione o Post
                  </label>
                  <select
                    value={formData.post_id}
                    onChange={(e) => setFormData({...formData, post_id: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Escolha um post...</option>
                    {posts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {new Date(post.data_publicacao).toLocaleDateString('pt-BR')} - {post.tema} - {post.gancho?.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data da Coleta
                  </label>
                  <input
                    type="date"
                    value={formData.data_coleta}
                    onChange={(e) => setFormData({...formData, data_coleta: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-slate-900">Métricas Orgânicas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Curtidas</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.curtidas}
                      onChange={(e) => setFormData({...formData, curtidas: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Comentários</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.comentarios}
                      onChange={(e) => setFormData({...formData, comentarios: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Salvamentos</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.salvamentos}
                      onChange={(e) => setFormData({...formData, salvamentos: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Compartilhamentos</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.compartilhamentos}
                      onChange={(e) => setFormData({...formData, compartilhamentos: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Novos Seguidores</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.seguidores}
                      onChange={(e) => setFormData({...formData, seguidores: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Visitas no Perfil</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.visitas_perfil}
                      onChange={(e) => setFormData({...formData, visitas_perfil: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-slate-900">Tráfego Pago (Opcional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Investimento (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.investimento}
                      onChange={(e) => setFormData({...formData, investimento: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Público Alcançado</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.publico}
                      onChange={(e) => setFormData({...formData, publico: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-700 mb-1">Ganho de Seguidores (Impulsionamento)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.ganho_seguidores_impulsionamento}
                      onChange={(e) => setFormData({...formData, ganho_seguidores_impulsionamento: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:shadow-lg"
                >
                  Salvar Métrica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {metricas.map((metrica) => (
          <div key={metrica.id} className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    {metrica.post?.tema || "Post sem tema"}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getCategoriaColor(metrica.categoria)}`}>
                    {metrica.categoria}
                  </div>
                  <div className="text-2xl font-bold text-[#ff901c]">
                    {Math.round(metrica.score)}
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(metrica.data_coleta).toLocaleDateString('pt-BR')}
                  {metrica.post && ` • Post de ${new Date(metrica.post.data_publicacao).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <button
                onClick={() => deleteMetrica(metrica.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{metrica.curtidas}</div>
                <div className="text-xs text-slate-600">Curtidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{metrica.comentarios}</div>
                <div className="text-xs text-slate-600">Comentários</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{metrica.salvamentos}</div>
                <div className="text-xs text-slate-600">Salvamentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{metrica.compartilhamentos}</div>
                <div className="text-xs text-slate-600">Compartilh.</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{metrica.seguidores}</div>
                <div className="text-xs text-slate-600">Seguidores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{metrica.visitas_perfil}</div>
                <div className="text-xs text-slate-600">Visitas Perfil</div>
              </div>
            </div>

            {metrica.investimento && (
              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">R$ {metrica.investimento.toFixed(2)}</div>
                  <div className="text-xs text-slate-600">Investimento</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{metrica.publico}</div>
                  <div className="text-xs text-slate-600">Público</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{metrica.ganho_seguidores_impulsionamento}</div>
                  <div className="text-xs text-slate-600">Seg. (Pago)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#ff901c]">
                    {metrica.custo_por_seguidor ? `R$ ${metrica.custo_por_seguidor.toFixed(2)}` : "-"}
                  </div>
                  <div className="text-xs text-slate-600">Custo/Seg.</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {metricas.length === 0 && (
        <div className="text-center py-16">
          <TrendingUp className="w-24 h-24 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma métrica registrada</h3>
          <p className="text-slate-500 mb-6">
            {posts.length === 0 
              ? "Publique posts no Feed primeiro"
              : "Comece a medir o desempenho dos seus posts"}
          </p>
          {posts.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Métrica</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
