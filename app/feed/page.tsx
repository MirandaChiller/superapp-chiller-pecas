"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Plus, Trash2, Filter, RefreshCw, ExternalLink, CheckCircle, Play, ImageIcon, Layers } from "lucide-react";

function extractInstagramShortcode(input: string): string | null {
  if (!input) return null;
  // Full embed code — extract from data-instgrm-permalink
  if (input.includes("data-instgrm-permalink")) {
    const m = input.match(/data-instgrm-permalink=["']([^"'?]+)/i);
    if (m?.[1]) return extractInstagramShortcode(m[1]);
  }
  // Direct URL — /p/, /reel/, /tv/
  const m = input.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return m?.[1] ?? null;
}

// Cover thumbnail — fills 100% width x fixed height of the card's top section
function PostThumbnail({ formato, tema, ogImageUrl, linkPublicado }: {
  formato: string; tema: string; ogImageUrl?: string | null; linkPublicado?: string | null;
}) {
  const igShortcode = extractInstagramShortcode(linkPublicado ?? "");

  if (igShortcode) {
    // Center the 326px-min iframe in the container and clip sides — cover crop effect
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 326, height: "100%" }}>
          <iframe
            src={`https://www.instagram.com/p/${igShortcode}/embed/`}
            width={326}
            height={500}
            style={{ display: "block", border: "none" }}
            scrolling="no"
          />
        </div>
      </div>
    );
  }

  if (ogImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ogImageUrl} alt={tema} className="absolute inset-0 w-full h-full object-cover" />
    );
  }

  if (formato === "Reels") {
    return (
      <>
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #085ba7 100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center border border-white/40">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute top-2 left-2">
          <span className="text-[8px] text-white font-bold bg-[#ff901c] px-1.5 py-0.5 rounded leading-none">REELS</span>
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[9px] text-white font-semibold line-clamp-2 leading-tight">{tema}</p>
        </div>
      </>
    );
  }

  if (formato === "Carrossel") {
    return (
      <>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #085ba7 0%, #1a7de8 100%)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Layers className="w-7 h-7 text-white/50" />
          <p className="text-[9px] text-white font-semibold text-center px-4 line-clamp-2 leading-tight">{tema}</p>
        </div>
        <div className="absolute bottom-2 left-0 right-0 flex gap-1 justify-center">
          {[0,1,2].map(i => <div key={i} className={`rounded-full ${i === 0 ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/40"}`} />)}
        </div>
      </>
    );
  }

  // Estático
  return (
    <>
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #ff901c 0%, #f97316 100%)" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
        <ImageIcon className="w-7 h-7 text-white/50" />
        <p className="text-[9px] text-white font-bold text-center line-clamp-3 leading-tight">{tema}</p>
      </div>
    </>
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

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

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
  // Temas keyed by "ano-mes", sourced from content_pie_mensal
  const [temasData, setTemasData] = useState<Record<string, string[]>>({});
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([new Date().getFullYear()]);
  // Month/year selector for the form (drives tema filtering)
  const [formMes, setFormMes] = useState<number>(new Date().getMonth() + 1);
  const [formAno, setFormAno] = useState<number>(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);

  // 3D flip state — set of post IDs currently showing their back face
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  // Date filters
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // OG images keyed by post id
  const [ogImages, setOgImages] = useState<Record<string, string | null>>({});

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

  // Fetch OG images for posts that have a published link
  useEffect(() => {
    const postsWithLinks = posts.filter((p) => p.link_publicado && !(p.id in ogImages));
    if (postsWithLinks.length === 0) return;
    postsWithLinks.forEach(async (post) => {
      try {
        const res = await fetch(`/api/og-image?url=${encodeURIComponent(post.link_publicado!)}`);
        const data = await res.json();
        setOgImages((prev) => ({ ...prev, [post.id]: data.imageUrl ?? null }));
      } catch {
        setOgImages((prev) => ({ ...prev, [post.id]: null }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  async function loadData() {
    const { data: temasMensais } = await supabase
      .from("content_pie_mensal")
      .select("ano, mes, temas");

    if (temasMensais) {
      const td: Record<string, string[]> = {};
      const anosSet = new Set<number>([new Date().getFullYear()]);
      temasMensais.forEach((row) => {
        anosSet.add(row.ano);
        const nomes = ((row.temas ?? []) as { nome: string }[]).map((t) => t.nome).filter(Boolean);
        td[`${row.ano}-${row.mes}`] = nomes;
      });
      setTemasData(td);
      setAnosDisponiveis(Array.from(anosSet).sort((a, b) => a - b));
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
    setFlippedCards((prev) => { const n = new Set(prev); n.delete(post.id); return n; });
    const [y, m] = post.data_publicacao.split("-").map(Number);
    const mes = m || new Date().getMonth() + 1;
    const ano = y || new Date().getFullYear();
    setFormMes(mes);
    setFormAno(ano);
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
    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();
    setFormMes(mes);
    setFormAno(ano);
    const temasDoMes = temasData[`${ano}-${mes}`] ?? [];
    setFormData({
      data_publicacao: "",
      tema: temasDoMes[0] ?? "",
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

  // When month/year selector changes: sync data_publicacao and reset tema if needed
  function handleMesAnoChange(novoMes: number, novoAno: number) {
    setFormMes(novoMes);
    setFormAno(novoAno);
    // Keep the day, clamp to last day of new month
    const [, , d] = formData.data_publicacao.split("-");
    const day = parseInt(d || "1");
    const lastDay = new Date(novoAno, novoMes, 0).getDate();
    const clampedDay = Math.min(isNaN(day) ? 1 : day, lastDay);
    const newDate = `${novoAno}-${String(novoMes).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
    const newTemas = temasData[`${novoAno}-${novoMes}`] ?? [];
    setFormData((prev) => ({
      ...prev,
      data_publicacao: newDate,
      tema: newTemas.length > 0 && !newTemas.includes(prev.tema) ? newTemas[0] : prev.tema,
    }));
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
              {/* Mês + Ano — filtram os temas disponíveis */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mês</label>
                  <select value={formMes}
                    onChange={(e) => handleMesAnoChange(Number(e.target.value), formAno)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]">
                    {MESES.map((nome, i) => <option key={i + 1} value={i + 1}>{nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
                  <select value={formAno}
                    onChange={(e) => handleMesAnoChange(formMes, Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]">
                    {anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Publicação</label>
                  <input type="date" value={formData.data_publicacao}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((prev) => ({ ...prev, data_publicacao: v }));
                      if (v) {
                        const [y, m] = v.split("-").map(Number);
                        if (m && y) { setFormMes(m); setFormAno(y); }
                      }
                    }}
                    required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tema
                    {(temasData[`${formAno}-${formMes}`] ?? []).length === 0 && (
                      <span className="ml-2 text-[10px] text-amber-500 font-normal">(nenhum cadastrado neste mês)</span>
                    )}
                  </label>
                  <select value={formData.tema}
                    onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]">
                    {(temasData[`${formAno}-${formMes}`] ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
                    {(temasData[`${formAno}-${formMes}`] ?? []).length === 0 && (
                      <option value={formData.tema || ""}>{formData.tema || "—"}</option>
                    )}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link ou Embed Publicado (Opcional)</label>
                  <textarea value={formData.link_publicado}
                    onChange={(e) => setFormData({ ...formData, link_publicado: e.target.value })}
                    placeholder={"Cole o link do post ou o código de incorporação (<blockquote...>)"}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] resize-none text-sm" />
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {postsFiltrados.map((post) => {
          const isFlipped = flippedCards.has(post.id);
          const st = STATUS_STYLE[post.status] || STATUS_STYLE.Planejado;
          const dataFormatada = (() => {
            const [y, m, d] = post.data_publicacao.split("-");
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
              .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
          })();
          const igShortcode = extractInstagramShortcode(post.link_publicado ?? "");
          const publishedUrl = igShortcode
            ? `https://www.instagram.com/p/${igShortcode}/`
            : post.link_publicado;

          return (
            <div
              key={post.id}
              onClick={() => toggleFlip(post.id)}
              className="cursor-pointer select-none"
              style={{ perspective: "1200px" }}
            >
              {/* Flip wrapper */}
              <div
                style={{
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
                  height: "460px",
                }}
              >
                {/* ── FRONT FACE ── */}
                <div
                  className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {/* Thumbnail — top 1/3, edge-to-edge, no padding */}
                  <div className="relative h-[155px] flex-shrink-0 bg-slate-100 overflow-hidden rounded-t-2xl">
                    <PostThumbnail formato={post.formato} tema={post.tema} ogImageUrl={ogImages[post.id]} linkPublicado={post.link_publicado} />
                  </div>

                  {/* Status color bar */}
                  <div className={`h-1 w-full flex-shrink-0 ${st.bar}`} />

                  {/* Info section — bottom 2/3: tema, objetivo, formato, data, status */}
                  <div className="flex flex-col flex-1 p-3 gap-2.5 min-h-0">
                    {/* Tema */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{post.tema}</h3>

                    {/* Objetivo */}
                    {post.objetivo && (
                      <p className="text-[11px] text-slate-500 leading-tight line-clamp-1">{post.objetivo}</p>
                    )}

                    {/* Formato + sub_formato */}
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-[#085ba7] text-white text-[10px] rounded-full font-medium leading-none">
                        {post.formato}
                      </span>
                      {post.sub_formato && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full leading-none">
                          {post.sub_formato}
                        </span>
                      )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Date + Status + link */}
                    <div className="border-t border-slate-100 pt-2 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-slate-400 font-medium leading-none">{dataFormatada}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 leading-none ${st.badge} ${st.text}`}>
                          {post.status}
                        </span>
                      </div>
                      {post.link_publicado ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <a href={publishedUrl!} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium">
                            <CheckCircle className="w-3 h-3 flex-shrink-0" />
                            <span>Publicado</span>
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 ml-auto" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-300">
                          <RefreshCw className="w-2.5 h-2.5" />
                          Ver detalhes
                        </div>
                      )}
                    </div>
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

                    {/* Gancho */}
                    {post.gancho && (
                      <div className="flex-shrink-0">
                        <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Gancho</p>
                        <p className="text-[11px] text-white/80 italic line-clamp-2 leading-relaxed">&ldquo;{post.gancho}&rdquo;</p>
                      </div>
                    )}

                    {/* Conteúdo */}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Conteúdo</p>
                      <p className="text-sm text-white/90 line-clamp-3 leading-relaxed">{post.conteudo}</p>
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
                          href={publishedUrl!}
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
