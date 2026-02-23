"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Plus, Save, Trash2, Filter } from "lucide-react";

const OBJETIVOS = [
  "Alcance & Visibilidade",
  "Autoridade & Posicionamento",
  "Relacionamento & Comunidade",
  "Geração de Leads",
  "Conversão & Venda",
];

const FORMATOS = ["Reels", "Carrossel", "Estático"];

const SUBFORMATOS: Record<string, string[]> = {
  Reels: [
    "Tutorial Rápido",
    "Bastidores",
    "Antes e Depois",
    "Trending Audio",
    "Depoimento Cliente",
    "Dica Expressa",
    "Demonstração Produto",
    "FAQ",
    "Storytelling",
  ],
  Carrossel: [
    "Guia Completo",
    "Checklist",
    "Infográfico",
    "Comparativo",
    "Timeline",
    "Estatísticas",
    "Mitos vs Verdades",
    "Top 5/10",
    "Case de Sucesso",
  ],
  Estático: [
    "Frase Motivacional",
    "Anúncio",
    "Promoção",
    "Produto em Destaque",
    "Novidade",
    "Comunicado",
    "Dica Visual",
    "Curiosidade",
    "Conquista/Milestone",
  ],
};

const STATUS_OPTIONS = ["Planejado", "Em Produção", "Aprovado", "Publicado"];

interface Post {
  id: string;
  data_publicacao: string;
  tema: string;
  objetivo: string;
  formato: string;
  sub_formato: string;
  gancho: string;
  conteudo: string;
  cta: string;
  status: string;
  link_publicado: string | null;
}

export default function FeedPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [temas, setTemas] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    data_publicacao: "",
    tema: "",
    objetivo: OBJETIVOS[0],
    formato: FORMATOS[0],
    sub_formato: SUBFORMATOS[FORMATOS[0]][0],
    gancho: "",
    conteudo: "",
    cta: "",
    status: "Planejado",
    link_publicado: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Carregar temas do Content Pie
    const { data: contentPieData } = await supabase
      .from("content_pie")
      .select("temas")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (contentPieData?.temas) {
      const temasNomes = contentPieData.temas.map((t: any) => t.nome).filter(Boolean);
      setTemas(temasNomes.length > 0 ? temasNomes : ["Geral"]);
    } else {
      setTemas(["Geral"]);
    }

    // Carregar posts
    const { data: postsData } = await supabase
      .from("posts_planejados")
      .select("*")
      .order("data_publicacao", { ascending: false });
    
    if (postsData) {
      setPosts(postsData);
    }
    
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editingId) {
      // Atualizar post existente
      const { error } = await supabase
        .from("posts_planejados")
        .update({
          ...formData,
          link_publicado: formData.link_publicado || null,
        })
        .eq("id", editingId);

      if (!error) {
        await loadData();
        setShowForm(false);
        setEditingId(null);
        resetForm();
      }
    } else {
      // Criar novo post
      const { error } = await supabase
        .from("posts_planejados")
        .insert({
          ...formData,
          link_publicado: formData.link_publicado || null,
        });

      if (!error) {
        await loadData();
        setShowForm(false);
        resetForm();
      }
    }
  }

  async function deletePost(id: string) {
    if (confirm("Deseja excluir este post?")) {
      await supabase.from("posts_planejados").delete().eq("id", id);
      loadData();
    }
  }

  function editPost(post: Post) {
    setFormData({
      data_publicacao: post.data_publicacao,
      tema: post.tema,
      objetivo: post.objetivo,
      formato: post.formato,
      sub_formato: post.sub_formato,
      gancho: post.gancho,
      conteudo: post.conteudo,
      cta: post.cta,
      status: post.status,
      link_publicado: post.link_publicado || "",
    });
    setEditingId(post.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      data_publicacao: "",
      tema: temas[0] || "Geral",
      objetivo: OBJETIVOS[0],
      formato: FORMATOS[0],
      sub_formato: SUBFORMATOS[FORMATOS[0]][0],
      gancho: "",
      conteudo: "",
      cta: "",
      status: "Planejado",
      link_publicado: "",
    });
  }

  const postsFiltrados = filtroStatus === "Todos" 
    ? posts 
    : posts.filter(p => p.status === filtroStatus);

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
          <h1 className="text-3xl font-bold text-slate-900">Planejamento de Feed</h1>
          <p className="text-slate-600 mt-1">Organize seu calendário editorial</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#ff901c] to-[#085ba7] text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Post</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <Filter className="w-5 h-5 text-slate-600" />
        <div className="flex space-x-2">
          {["Todos", ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtroStatus === status
                  ? "bg-[#ff901c] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">{editingId ? "Editar Post" : "Novo Post"}</h2>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de Publicação
                  </label>
                  <input
                    type="date"
                    value={formData.data_publicacao}
                    onChange={(e) => setFormData({...formData, data_publicacao: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tema
                  </label>
                  <select
                    value={formData.tema}
                    onChange={(e) => setFormData({...formData, tema: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {temas.map((tema) => (
                      <option key={tema} value={tema}>{tema}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Objetivo
                  </label>
                  <select
                    value={formData.objetivo}
                    onChange={(e) => setFormData({...formData, objetivo: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {OBJETIVOS.map((obj) => (
                      <option key={obj} value={obj}>{obj}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Formato
                  </label>
                  <select
                    value={formData.formato}
                    onChange={(e) => {
                      const novoFormato = e.target.value;
                      setFormData({
                        ...formData, 
                        formato: novoFormato,
                        sub_formato: SUBFORMATOS[novoFormato][0]
                      });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {FORMATOS.map((fmt) => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sub-formato
                  </label>
                  <select
                    value={formData.sub_formato}
                    onChange={(e) => setFormData({...formData, sub_formato: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {SUBFORMATOS[formData.formato].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gancho (Abertura)
                </label>
                <input
                  type="text"
                  value={formData.gancho}
                  onChange={(e) => setFormData({...formData, gancho: e.target.value})}
                  placeholder="Ex: Você sabia que..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Conteúdo Principal
                </label>
                <textarea
                  value={formData.conteudo}
                  onChange={(e) => setFormData({...formData, conteudo: e.target.value})}
                  rows={4}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Mensagem central do post"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CTA (Call to Action)
                </label>
                <input
                  type="text"
                  value={formData.cta}
                  onChange={(e) => setFormData({...formData, cta: e.target.value})}
                  placeholder="Ex: Comente abaixo, Salve este post"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status do Post
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Link Publicado (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.link_publicado}
                    onChange={(e) => setFormData({...formData, link_publicado: e.target.value})}
                    placeholder="https://instagram.com/p/..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#ff901c] to-[#085ba7] text-white rounded-lg hover:shadow-lg"
                >
                  {editingId ? "Atualizar Post" : "Criar Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postsFiltrados.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">
                  {new Date(post.data_publicacao).toLocaleDateString('pt-BR')}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{post.tema}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => editPost(post)}
                  className="p-2 text-[#ff901c] hover:bg-orange-50 rounded-lg transition-colors"
                  title="Editar post"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-600">Objetivo:</span>
                <span className="text-xs text-slate-900">{post.objetivo}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-600">Formato:</span>
                <span className="text-xs text-slate-900">{post.formato} - {post.sub_formato}</span>
              </div>
            </div>

            {post.gancho && (
              <p className="text-sm text-slate-700 font-medium">"{post.gancho}"</p>
            )}

            <p className="text-sm text-slate-600 line-clamp-3">{post.conteudo}</p>

            {post.cta && (
              <p className="text-sm text-[#ff901c] font-medium">CTA: {post.cta}</p>
            )}

            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              post.status === "Publicado" ? "bg-green-100 text-green-700" :
              post.status === "Aprovado" ? "bg-blue-100 text-blue-700" :
              post.status === "Em Produção" ? "bg-yellow-100 text-yellow-700" :
              "bg-slate-100 text-slate-700"
            }`}>
              {post.status}
            </div>
          </div>
        ))}
      </div>

      {postsFiltrados.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-24 h-24 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">
            {filtroStatus === "Todos" ? "Nenhum post planejado" : `Nenhum post ${filtroStatus.toLowerCase()}`}
          </h3>
          <p className="text-slate-500 mb-6">Crie seu primeiro post para começar</p>
          <button
            onClick={() => {
              setEditingId(null);
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#ff901c] to-[#085ba7] text-white rounded-lg hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Post</span>
          </button>
        </div>
      )}
    </div>
  );
}
