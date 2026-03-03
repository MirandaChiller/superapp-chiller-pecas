"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Plus, Trash2, Filter, RefreshCw, ExternalLink, CheckCircle, Play, ImageIcon, Layers } from "lucide-react";

function PostThumbnail({ formato, tema }: { formato: string; tema: string }) {
  if (formato === "Reels") {
    return (
      <div className="relative mx-auto rounded-xl overflow-hidden flex-shrink-0" style={{ width: "72px", height: "108px", background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #085ba7 100%)" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center border border-white/40">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Label */}
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[7px] text-white font-bold bg-[#ff901c] px-1 py-0.5 rounded leading-none">REELS</span>
        </div>
        {/* Tema */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          <p className="text-[7px] text-white font-semibold line-clamp-2 leading-tight">{tema}</p>
        </div>
        {/* Side dots (like reels UI) */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {[0,1,2].map(i => <div key={i} className="w-0.5 h-0.5 rounded-full bg-white/50" />)}
        </div>
      </div>
    );
  }

  if (formato === "Carrossel") {
    return (
      <div className="relative mx-auto flex-shrink-0" style={{ width: "108px", height: "96px" }}>
        {/* Stack cards behind */}
        <div className="absolute rounded-xl" style={{ width: "88px", height: "84px", background: "#c7d8f0", top: "6px", left: "14px" }} />
        <div className="absolute rounded-xl" style={{ width: "93px", height: "84px", background: "#a3c1e8", top: "3px", left: "7px" }} />
        {/* Front card */}
        <div className="absolute rounded-xl overflow-hidden flex flex-col items-center justify-center gap-1.5" style={{ width: "93px", height: "84px", top: "0", left: "0", background: "linear-gradient(135deg, #085ba7 0%, #1a7de8 100%)" }}>
          <Layers className="w-4 h-4 text-white/50" />
          <p className="text-[7px] text-white font-semibold text-center px-2 line-clamp-2 leading-tight">{tema}</p>
        </div>
        {/* Dot indicators */}
        <div className="absolute flex gap-0.5 justify-center" style={{ bottom: "0", left: "0", right: "0" }}>
          {[0,1,2].map(i => <div key={i} className={`rounded-full ${i === 0 ? "w-1.5 h-1.5 bg-[#085ba7]" : "w-1 h-1 bg-slate-300"}`} />)}
        </div>
      </div>
    );
  }

  // Estático
  return (
    <div className="relative mx-auto rounded-xl overflow-hidden flex-shrink-0" style={{ width: "96px", height: "96px", background: "linear-gradient(135deg, #ff901c 0%, #f97316 100%)" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2">
        <ImageIcon className="w-4 h-4 text-white/50" />
        <p className="text-[7px] text-white font-bold text-center line-clamp-3 leading-tight">{tema}</p>
      </div>
      <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
        <span className="text-[6px] text-white/60 font-medium uppercase tracking-wide">ESTÁTICO</span>
      </div>
    </div>
  );
}

function getLinkDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

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
    "Tutorial Rápido", "Bastidores", "Antes e Depois", "Trending Audio",
    "Depoimento Cliente", "Dica Expressa", "Demonstração Produto", "FAQ", "Storytelling",
  ],
  Carrossel: [
    "Guia Completo", "Checklist", "Infográfico", "Comparativo",
    "Timeline", "Estatísticas", "Mitos vs Verdades", "Top 5/10", "Case de Sucesso",
  ],
  Estático: [
    "Frase Motivacional", "Anúncio", "Promoção", "Produto em Destaque",
    "Novidade", "Comunicado", "Dica Visual", "Curiosidade", "Conquista/Milestone",
  ],
};

const STATUS_OPTIONS = ["Planejado", "Em Produção", "Aprovado", "Publicado"];

const STATUS_STYLE: Record<string, { bar: string; badge: string; text: string }> = {
  Publicado:     { bar: "bg-green-500",  badge: "bg-green-100",  text: "text-green-700" },
  Aprovado:      { bar: "bg-[#085ba7]",  badge: "bg-blue-100",   text: "text-[#085ba7]" },
  "Em Produção": { bar: "bg-amber-400",  badge: "bg-amber-100",  text: "text-amber-700" },
  Planejado:     { bar: "bg-slate-300",  badge: "bg-slate-100",  text: "text-slate-600" },
};

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

  // 3D flip state — set of post IDs currently showing their back face
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  // Date filters
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

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

  useEffect(() => { loadData(); }, []);

  async function loadData() {
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

    const { data: postsData } = await supabase
      .from("posts_planejados")
      .select("*")
      .order("data_publicacao", { ascending: false });

    if (postsData) setPosts(postsData);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from("posts_planejados")
        .update({ ...formData, link_publicado: formData.link_publicado || null })
        .eq("id", editingId);
      if (!error) { await loadData(); setShowForm(false); setEditingId(null); resetForm(); }
    } else {
      const { error } = await supabase
        .from("posts_planejados")
        .insert({ ...formData, link_publicado: formData.link_publicado || null });
      if (!error) { await loadData(); setShowForm(false); resetForm(); }
    }
  }

  async function deletePost(id: string) {
    if (confirm("Deseja excluir este post?")) {
      await supabase.from("posts_planejados").delete().eq("id", id);
      loadData();
    }
  }

  function editPost(post: Post) {
    // Unflip before opening form
    setFlippedCards((prev) => { const n = new Set(prev); n.delete(post.id); return n; });
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

  function toggleFlip(id: string) {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const postsFiltrados = posts.filter((p) => {
    if (filtroStatus !== "Todos" && p.status !== filtroStatus) return false;
    if (filterDateFrom && p.data_publicacao < filterDateFrom) return false;
    if (filterDateTo && p.data_publicacao > filterDateTo) return false;
    return true;
  });

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
          <h1 className="text-3xl font-bold text-slate-900">Planejamento de Feed</h1>
          <p className="text-slate-600 mt-1">Organize seu calendário editorial</p>
        </div>
        <button
          onClick={() => { setEditingId(null); resetForm(); setShowForm(true); }}
          className="flex items-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:bg-[#e08016] hover:shadow-lg transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Post</span>
        </button>
      </div>

      {/* Status filter */}
      <div className="flex items-center space-x-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <div className="flex flex-wrap gap-2">
          {["Todos", ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filtroStatus === status
                  ? "bg-[#085ba7] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center gap-4 flex-wrap shadow-sm">
        <span className="text-sm font-semibold text-slate-600">Data de publicação:</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">De</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Até</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
          />
        </div>
        {(filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors"
          >
            Limpar datas
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {postsFiltrados.length} post{postsFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ─── New / Edit Form Modal ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? "Editar Post" : "Novo Post"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Publicação</label>
                  <input type="date" value={formData.data_publicacao}
                    onChange={(e) => setFormData({ ...formData, data_publicacao: e.target.value })}
                    required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tema</label>
                  <select value={formData.tema}
                    onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]">
                    {temas.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo</label>
                  <select value={formData.objetivo}
                    onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]">
                    {OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Formato</label>
                  <select value={formData.formato}
                    onChange={(e) => {
                      const f = e.target.value;
                      setFormData({ ...formData, formato: f, sub_formato: SUBFORMATOS[f][0] });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]">
                    {FORMATOS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sub-formato</label>
                  <select value={formData.sub_formato}
                    onChange={(e) => setFormData({ ...formData, sub_formato: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]">
                    {SUBFORMATOS[formData.formato].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gancho (Abertura)</label>
                <input type="text" value={formData.gancho}
                  onChange={(e) => setFormData({ ...formData, gancho: e.target.value })}
                  placeholder="Ex: Você sabia que..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo Principal</label>
                <textarea value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  rows={4} required
                  placeholder="Mensagem central do post"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CTA (Call to Action)</label>
                <input type="text" value={formData.cta}
                  onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                  placeholder="Ex: Comente abaixo, Salve este post"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link Publicado (Opcional)</label>
                  <input type="url" value={formData.link_publicado}
                    onChange={(e) => setFormData({ ...formData, link_publicado: e.target.value })}
                    placeholder="https://instagram.com/p/..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]" />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:bg-[#e08016] font-semibold">
                  {editingId ? "Atualizar Post" : "Criar Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 3D Flip Card Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postsFiltrados.map((post) => {
          const isFlipped = flippedCards.has(post.id);
          const st = STATUS_STYLE[post.status] || STATUS_STYLE.Planejado;
          const dataFormatada = (() => {
            const [y, m, d] = post.data_publicacao.split("-");
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
              .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
          })();

          return (
            <div
              key={post.id}
              onClick={() => toggleFlip(post.id)}
              className="cursor-pointer select-none"
              style={{ perspective: "1200px", minHeight: "370px" }}
            >
              {/* Flip wrapper */}
              <div
                style={{
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
                  height: "370px",
                }}
              >
                {/* ── FRONT FACE ── */}
                <div
                  className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {/* Colored top bar */}
                  <div className={`h-1.5 w-full ${st.bar}`} />

                  <div className="flex flex-col flex-1 p-5 gap-3">
                    {/* Date + Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">{dataFormatada}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.badge} ${st.text}`}>
                        {post.status}
                      </span>
                    </div>

                    {/* Tema */}
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{post.tema}</h3>

                    {/* Thumbnail preview */}
                    <div className="flex justify-center py-1">
                      <PostThumbnail formato={post.formato} tema={post.tema} />
                    </div>

                    {/* Format pills */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 bg-[#085ba7] text-white text-xs rounded-full font-medium">
                        {post.formato}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                        {post.sub_formato}
                      </span>
                    </div>

                    {/* Gancho */}
                    {post.gancho && (
                      <p className="text-sm text-slate-600 italic line-clamp-2 flex-1">
                        &ldquo;{post.gancho}&rdquo;
                      </p>
                    )}

                    {/* Flip hint or published link preview */}
                    {post.link_publicado ? (
                      <div
                        className="mt-auto border-t border-slate-100 pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={post.link_publicado}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">Publicado: {getLinkDomain(post.link_publicado)}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
                        </a>
                      </div>
                    ) : (
                      <div className="mt-auto flex items-center justify-center gap-1.5 text-xs text-slate-300 pt-2 border-t border-slate-100">
                        <RefreshCw className="w-3 h-3" />
                        Clique para ver detalhes
                      </div>
                    )}
                  </div>
                </div>

                {/* ── BACK FACE ── */}
                <div
                  className="absolute inset-0 bg-[#085ba7] rounded-2xl shadow-md overflow-hidden flex flex-col"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="flex flex-col flex-1 p-5 gap-3 overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <h3 className="font-bold text-white text-base leading-tight truncate">{post.tema}</h3>
                        <p className="text-blue-200 text-xs mt-0.5 truncate">{post.objetivo}</p>
                      </div>
                      {/* Action buttons — stopPropagation so they don't flip back */}
                      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => editPost(post)}
                          className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-1.5 bg-red-400/30 hover:bg-red-400/50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Conteúdo</p>
                      <p className="text-sm text-white/90 line-clamp-4 leading-relaxed">{post.conteudo}</p>
                    </div>

                    {/* CTA */}
                    {post.cta && (
                      <div className="bg-[#ff901c] rounded-xl px-3 py-2 flex-shrink-0">
                        <p className="text-xs font-semibold text-orange-100 uppercase tracking-wide">CTA</p>
                        <p className="text-sm text-white font-medium line-clamp-1">{post.cta}</p>
                      </div>
                    )}

                    {/* Link publicado */}
                    {post.link_publicado && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <a
                          href={post.link_publicado}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-200 hover:text-white underline transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver publicação
                        </a>
                      </div>
                    )}

                    {/* Back hint */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300 pt-1 border-t border-white/10">
                      <RefreshCw className="w-3 h-3" />
                      Clique para voltar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {postsFiltrados.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-24 h-24 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">
            {filtroStatus === "Todos" ? "Nenhum post planejado" : `Nenhum post ${filtroStatus.toLowerCase()}`}
          </h3>
          <p className="text-slate-500 mb-6">Crie seu primeiro post para começar</p>
          <button
            onClick={() => { setEditingId(null); resetForm(); setShowForm(true); }}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:bg-[#e08016] hover:shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Post</span>
          </button>
        </div>
      )}
    </div>
  );
}
