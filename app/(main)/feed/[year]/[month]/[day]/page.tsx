"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calendar, Plus, Trash2, Filter, RefreshCw, ExternalLink,
  CheckCircle, Play, ImageIcon, Layers, ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const N8N_WEBHOOK = "https://miranda.beontech.com.br/webhook-test/00f7843b-6743-4653-ab83-f2453c83518e";

function extractInstagramShortcode(input: string): string | null {
  if (!input) return null;
  if (input.includes("data-instgrm-permalink")) {
    const m = input.match(/data-instgrm-permalink=["']([^"'?]+)/i);
    if (m?.[1]) return extractInstagramShortcode(m[1]);
  }
  const m = input.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return m?.[1] ?? null;
}

function PostThumbnail({ formato, tema, ogImageUrl, linkPublicado }: {
  formato: string; tema: string; ogImageUrl?: string | null; linkPublicado?: string | null;
}) {
  const igShortcode = extractInstagramShortcode(linkPublicado ?? "");

  if (igShortcode) {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -56, left: "50%", transform: "translateX(-50%)", width: 326 }}>
          <iframe
            src={`https://www.instagram.com/p/${igShortcode}/embed/`}
            width={326}
            height={700}
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

export default function DayPage() {
  const params = useParams();
  const year = Number(params.year);
  const month = String(params.month).padStart(2, "0");
  const day = String(params.day).padStart(2, "0");
  const specificDate = `${year}-${month}-${day}`;
  const monthName = MESES[Number(params.month) - 1];

  const formattedDate = new Date(year, Number(params.month) - 1, Number(params.day))
    .toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [temasData, setTemasData] = useState<Record<string, string[]>>({});
  const [formMes, setFormMes] = useState<number>(Number(params.month));
  const [formAno, setFormAno] = useState<number>(year);
  const [showForm, setShowForm] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [ogImages, setOgImages] = useState<Record<string, string | null>>({});

  const [peekPostId, setPeekPostId] = useState<string | null>(null);
  const [peekRect, setPeekRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekActiveRef = useRef(false);

  const [formData, setFormData] = useState({
    data_publicacao: specificDate,
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

  useEffect(() => { loadData(); }, [specificDate]);

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
      temasMensais.forEach((row) => {
        const nomes = ((row.temas ?? []) as { nome: string }[]).map((t) => t.nome).filter(Boolean);
        td[`${row.ano}-${row.mes}`] = nomes;
      });
      setTemasData(td);
    }

    const { data: postsData } = await supabase
      .from("posts_planejados")
      .select("*")
      .eq("data_publicacao", specificDate)
      .order("created_at", { ascending: false });

    if (postsData) setPosts(postsData);
    setLoading(false);
  }

  async function autoCreateMetric(postId: string, linkPublicado: string | null) {
    const { data: existing } = await supabase
      .from("metricas_posts")
      .select("id")
      .eq("post_id", postId)
      .limit(1);
    if (existing && existing.length > 0) return;

    const today = new Date().toISOString().split("T")[0];
    const { data: metrica, error } = await supabase
      .from("metricas_posts")
      .insert({
        post_id: postId, data_coleta: today,
        curtidas: 0, comentarios: 0, salvamentos: 0,
        compartilhamentos: 0, seguidores: 0, visitas_perfil: 0,
      })
      .select("id")
      .single();
    if (error || !metrica) return;

    if (!linkPublicado) return;
    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkPublicado }),
      });
      if (!res.ok) return;
      const data = await res.json();
      await supabase.from("metricas_posts").update({
        data_coleta:       today,
        curtidas:          data.curtidas          ?? data.likes            ?? data.like_count     ?? 0,
        comentarios:       data.comentarios       ?? data.comments         ?? data.comments_count ?? 0,
        salvamentos:       data.salvamentos       ?? data.saves            ?? data.saved          ?? 0,
        compartilhamentos: data.compartilhamentos ?? data.shares           ?? data.share_count    ?? 0,
        seguidores:        data.seguidores        ?? data.followers_gained ?? data.new_followers  ?? 0,
        visitas_perfil:    data.visitas_perfil    ?? data.profile_visits   ?? data.profile_views  ?? 0,
      }).eq("id", metrica.id);
    } catch { /* silently ignored */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      const prevStatus = posts.find(p => p.id === editingId)?.status;
      const { error } = await supabase
        .from("posts_planejados")
        .update({ ...formData, link_publicado: formData.link_publicado || null })
        .eq("id", editingId);
      if (!error) {
        await loadData();
        setShowForm(false);
        setEditingId(null);
        resetForm();
        if (formData.status === "Publicado" && prevStatus !== "Publicado") {
          await autoCreateMetric(editingId, formData.link_publicado || null);
        }
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("posts_planejados")
        .insert({ ...formData, link_publicado: formData.link_publicado || null })
        .select("id")
        .single();
      if (!error && inserted) {
        await loadData();
        setShowForm(false);
        resetForm();
        if (formData.status === "Publicado") {
          await autoCreateMetric(inserted.id, formData.link_publicado || null);
        }
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
    setFlippedCards((prev) => { const n = new Set(prev); n.delete(post.id); return n; });
    const [y, m] = post.data_publicacao.split("-").map(Number);
    setFormMes(m || Number(params.month));
    setFormAno(y || year);
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
    const mesNum = Number(params.month);
    setFormMes(mesNum);
    setFormAno(year);
    const temasDoMes = temasData[`${year}-${mesNum}`] ?? [];
    setFormData({
      data_publicacao: specificDate,
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

  function handleMesAnoChange(novoMes: number, novoAno: number) {
    setFormMes(novoMes);
    setFormAno(novoAno);
    const [, , d] = formData.data_publicacao.split("-");
    const dayNum = parseInt(d || "1");
    const lastDay = new Date(novoAno, novoMes, 0).getDate();
    const clampedDay = Math.min(isNaN(dayNum) ? 1 : dayNum, lastDay);
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

  function handleThumbnailEnter(postId: string, e: { currentTarget: HTMLDivElement }) {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    peekTimerRef.current = setTimeout(() => {
      peekActiveRef.current = true;
      setPeekRect({ left: rect.left, top: rect.top, width: rect.width });
      setPeekPostId(postId);
    }, 2000);
  }

  function handleThumbnailLeave() {
    if (peekTimerRef.current) { clearTimeout(peekTimerRef.current); peekTimerRef.current = null; }
    if (!peekActiveRef.current) { setPeekPostId(null); setPeekRect(null); }
  }

  function handlePeekLeave() {
    peekActiveRef.current = false;
    setPeekPostId(null);
    setPeekRect(null);
  }

  const postsFiltrados = posts.filter((p) =>
    filtroStatus === "Todos" || p.status === filtroStatus
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-[#085ba7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const temasDoMes = temasData[`${formAno}-${formMes}`] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/feed/${year}/${month}`}
            className="flex items-center space-x-2 text-slate-500 hover:text-[#085ba7] font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{monthName} {year}</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 capitalize">{formattedDate}</h1>
            <p className="text-slate-600 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""} planejado{posts.length !== 1 ? "s" : ""}</p>
          </div>
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
        <span className="ml-auto text-xs text-slate-400">
          {postsFiltrados.length} post{postsFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ─── New / Edit Form Modal ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50">
          <div className="flex min-h-full items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl">
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
              {/* Mês + Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mês</label>
                  <select
                    value={formMes}
                    onChange={(e) => handleMesAnoChange(parseInt(e.target.value), formAno)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                  >
                    {MESES.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
                  <input
                    type="number"
                    value={formAno}
                    onChange={(e) => handleMesAnoChange(formMes, parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de Publicação</label>
                <input
                  type="date"
                  value={formData.data_publicacao}
                  onChange={(e) => setFormData((p) => ({ ...p, data_publicacao: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                />
              </div>

              {/* Tema */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tema</label>
                {temasDoMes.length > 0 ? (
                  <select
                    value={formData.tema}
                    onChange={(e) => setFormData((p) => ({ ...p, tema: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                  >
                    {temasDoMes.map((t) => <option key={t} value={t}>{t}</option>)}
                    <option value="">— Outro —</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.tema}
                    onChange={(e) => setFormData((p) => ({ ...p, tema: e.target.value }))}
                    placeholder="Tema do post"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                  />
                )}
              </div>

              {/* Objetivo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo</label>
                <select
                  value={formData.objetivo}
                  onChange={(e) => setFormData((p) => ({ ...p, objetivo: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                >
                  {OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Formato + Sub-formato */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Formato</label>
                  <select
                    value={formData.formato}
                    onChange={(e) => {
                      const fmt = e.target.value;
                      setFormData((p) => ({ ...p, formato: fmt, sub_formato: SUBFORMATOS[fmt][0] }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                  >
                    {FORMATOS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sub-formato</label>
                  <select
                    value={formData.sub_formato}
                    onChange={(e) => setFormData((p) => ({ ...p, sub_formato: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                  >
                    {SUBFORMATOS[formData.formato].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Gancho */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gancho</label>
                <textarea
                  value={formData.gancho}
                  onChange={(e) => setFormData((p) => ({ ...p, gancho: e.target.value }))}
                  rows={2}
                  placeholder="Frase de abertura que prende atenção"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent resize-none"
                />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo</label>
                <textarea
                  value={formData.conteudo}
                  onChange={(e) => setFormData((p) => ({ ...p, conteudo: e.target.value }))}
                  rows={3}
                  placeholder="Descrição do conteúdo do post"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent resize-none"
                />
              </div>

              {/* CTA */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CTA</label>
                <input
                  type="text"
                  value={formData.cta}
                  onChange={(e) => setFormData((p) => ({ ...p, cta: e.target.value }))}
                  placeholder="Chamada para ação"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                />
              </div>

              {/* Status + Link */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link Publicado</label>
                  <input
                    type="text"
                    value={formData.link_publicado}
                    onChange={(e) => setFormData((p) => ({ ...p, link_publicado: e.target.value }))}
                    placeholder="URL ou embed Instagram"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
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
              <div
                style={{
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
                  height: "480px",
                }}
              >
                {/* ── FRONT FACE ── */}
                <div
                  className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div
                    className="relative h-[260px] flex-shrink-0 bg-slate-100 overflow-hidden rounded-t-2xl"
                    onMouseEnter={(e) => handleThumbnailEnter(post.id, e)}
                    onMouseLeave={handleThumbnailLeave}
                  >
                    <PostThumbnail formato={post.formato} tema={post.tema} ogImageUrl={ogImages[post.id]} linkPublicado={post.link_publicado} />
                  </div>

                  <div className={`h-1 w-full flex-shrink-0 ${st.bar}`} />

                  <div className="flex flex-col flex-1 p-3 gap-2.5 min-h-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{post.tema}</h3>

                    {post.objetivo && (
                      <p className="text-[11px] text-slate-500 leading-tight line-clamp-1">{post.objetivo}</p>
                    )}

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

                    <div className="flex-1" />

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
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="flex flex-col flex-1 p-5 gap-3 overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <h3 className="font-bold text-white text-base leading-tight truncate">{post.tema}</h3>
                        <p className="text-blue-200 text-xs mt-0.5 truncate">{post.objetivo}</p>
                      </div>
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

                    {post.gancho && (
                      <div className="flex-shrink-0">
                        <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Gancho</p>
                        <p className="text-[11px] text-white/80 italic line-clamp-2 leading-relaxed">&ldquo;{post.gancho}&rdquo;</p>
                      </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Conteúdo</p>
                      <p className="text-sm text-white/90 line-clamp-3 leading-relaxed">{post.conteudo}</p>
                    </div>

                    {post.cta && (
                      <div className="bg-[#ff901c] rounded-xl px-3 py-2 flex-shrink-0">
                        <p className="text-xs font-semibold text-orange-100 uppercase tracking-wide">CTA</p>
                        <p className="text-sm text-white font-medium line-clamp-1">{post.cta}</p>
                      </div>
                    )}

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
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhum post para este dia</h3>
          <p className="text-slate-500 mb-6">Clique em &quot;Novo Post&quot; para planejar o conteúdo deste dia</p>
          <button
            onClick={() => { setEditingId(null); resetForm(); setShowForm(true); }}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:bg-[#e08016] hover:shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Post</span>
          </button>
        </div>
      )}

      {/* ── Thumbnail peek overlay — wallet-pull animation ── */}
      {peekPostId && peekRect && (() => {
        const peekPost = postsFiltrados.find(p => p.id === peekPostId);
        if (!peekPost) return null;
        const cardW = peekRect.width;
        const cardH = Math.round(cardW * 1.35);
        const ogUrl = ogImages[peekPost.id];
        return (
          <div
            onMouseLeave={handlePeekLeave}
            style={{
              position: "fixed",
              left: peekRect.left,
              top: peekRect.top - cardH + 260,
              width: cardW,
              height: cardH,
              zIndex: 9999,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.38), 0 8px 24px rgba(0,0,0,0.22)",
              animation: "walletPull 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              transformOrigin: "50% 100%",
              background: "#f1f5f9",
            }}
          >
            {ogUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ogUrl}
                alt={peekPost.tema}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            ) : (
              <div className="relative w-full h-full">
                <PostThumbnail
                  formato={peekPost.formato}
                  tema={peekPost.tema}
                  ogImageUrl={null}
                  linkPublicado={peekPost.link_publicado}
                />
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
