"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp, Plus, Trash2, RefreshCw, Pencil,
  Heart, MessageCircle, Bookmark, Share2, UserPlus, Eye,
} from "lucide-react";

const N8N_WEBHOOK = "https://miranda.beontech.com.br/webhook-test/00f7843b-6743-4653-ab83-f2453c83518e";

interface Post {
  id: string;
  data_publicacao: string;
  tema: string;
  gancho: string;
  link_publicado?: string | null;
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

function categoriaStyle(categoria: string) {
  switch (categoria) {
    case "SUPER EXCELENTE": return { badge: "bg-purple-100 text-purple-700 border-purple-200", bar: "bg-purple-500" };
    case "EXCELENTE":       return { badge: "bg-green-100  text-green-700  border-green-200",  bar: "bg-green-500"  };
    case "ÓTIMO":           return { badge: "bg-blue-100   text-blue-700   border-blue-200",   bar: "bg-blue-500"   };
    case "RUIM":            return { badge: "bg-red-100    text-red-700    border-red-200",     bar: "bg-red-500"    };
    default:                return { badge: "bg-slate-100  text-slate-600  border-slate-200",   bar: "bg-slate-400"  };
  }
}

// ── Individual metric card ────────────────────────────────────────────────────
function MetricCard({
  metrica,
  ogImage,
  onDelete,
  onUpdate,
  onEdit,
  updating,
}: {
  metrica: Metrica;
  ogImage: string | null | undefined;
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (id: string, link: string | null | undefined) => Promise<void>;
  onEdit: (metrica: Metrica) => void;
  updating: boolean;
}) {
  const st = categoriaStyle(metrica.categoria);
  const hasLink = !!metrica.post?.link_publicado;

  const organicMetrics = [
    { Icon: Heart,         label: "Curtidas",     value: metrica.curtidas,          color: "text-rose-500"   },
    { Icon: MessageCircle, label: "Comentários",  value: metrica.comentarios,       color: "text-amber-500"  },
    { Icon: Bookmark,      label: "Salvamentos",  value: metrica.salvamentos,       color: "text-blue-500"   },
    { Icon: Share2,        label: "Compartilh.",  value: metrica.compartilhamentos, color: "text-green-500"  },
    { Icon: UserPlus,      label: "Seguidores",   value: metrica.seguidores,        color: "text-purple-500" },
    { Icon: Eye,           label: "Vis. Perfil",  value: metrica.visitas_perfil,    color: "text-[#085ba7]"  },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      <div className={`h-1 w-full ${st.bar}`} />

      <div className="flex min-h-[180px]">
        {/* ── Left: post preview ── */}
        <div className="w-44 flex-shrink-0 relative bg-slate-100 overflow-hidden">
          {ogImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ogImage} alt={metrica.post?.tema ?? ""} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#085ba7] to-[#108bd1] p-3">
              <TrendingUp className="w-8 h-8 text-white/50" />
              <p className="text-[9px] text-white/70 text-center leading-tight line-clamp-4">{metrica.post?.tema}</p>
            </div>
          )}
        </div>

        {/* ── Right: info + metrics ── */}
        <div className="flex-1 p-5 flex flex-col gap-3 min-w-0">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 leading-snug truncate">{metrica.post?.tema ?? "Post sem tema"}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Coleta: {new Date(metrica.data_coleta).toLocaleDateString("pt-BR")}
                {metrica.post?.data_publicacao &&
                  ` • Post: ${new Date(metrica.post.data_publicacao).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.badge}`}>
                {metrica.categoria || "—"}
              </span>
              <span className="text-2xl font-black text-[#ff901c] leading-none">{Math.round(metrica.score)}</span>
            </div>
          </div>

          {/* Organic metrics grid */}
          <div className="grid grid-cols-6 gap-2">
            {organicMetrics.map(({ Icon, label, value, color }) => (
              <div key={label} className="text-center">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                <div className="text-base font-bold text-slate-800 leading-none">{value.toLocaleString("pt-BR")}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-1">
            {/* N8N update */}
            <button
              onClick={() => onUpdate(metrica.id, metrica.post?.link_publicado)}
              disabled={!hasLink || updating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                         bg-[#085ba7] text-white hover:bg-[#085ba7]/90
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${updating ? "animate-spin" : ""}`} />
              {updating ? "Atualizando..." : "Atualizar"}
            </button>

            {!hasLink && <span className="text-[10px] text-slate-400 italic">sem link publicado</span>}

            <div className="flex-1" />

            {/* Edit */}
            <button
              onClick={() => onEdit(metrica)}
              className="p-1.5 text-slate-400 hover:text-[#085ba7] hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(metrica.id)}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared metric fields used in both Create and Edit modals ─────────────────
const METRIC_FIELDS = [
  { key: "curtidas",         label: "Curtidas"          },
  { key: "comentarios",      label: "Comentários"       },
  { key: "salvamentos",      label: "Salvamentos"       },
  { key: "compartilhamentos",label: "Compartilhamentos" },
  { key: "seguidores",       label: "Novos Seguidores"  },
  { key: "visitas_perfil",   label: "Visitas no Perfil" },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function IndicadoresPage() {
  const [loading, setLoading]       = useState(true);
  const [metricas, setMetricas]     = useState<Metrica[]>([]);
  const [posts, setPosts]           = useState<Post[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [editingMetrica, setEditingMetrica] = useState<Metrica | null>(null);
  const [ogImages, setOgImages]     = useState<Record<string, string | null>>({});
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // ── Create form: only post + date ─────────────────────────────────────────
  const [createForm, setCreateForm] = useState({
    post_id:    "",
    data_coleta: new Date().toISOString().split("T")[0],
  });

  // ── Edit form: post, date + all metric values ─────────────────────────────
  const [editForm, setEditForm] = useState({
    post_id:           "",
    data_coleta:       "",
    curtidas:          0,
    comentarios:       0,
    salvamentos:       0,
    compartilhamentos: 0,
    seguidores:        0,
    visitas_perfil:    0,
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    metricas.forEach(async (m) => {
      if (!m.post?.link_publicado || m.id in ogImages) return;
      try {
        const res  = await fetch(`/api/og-image?url=${encodeURIComponent(m.post.link_publicado)}`);
        const data = await res.json();
        setOgImages(prev => ({ ...prev, [m.id]: data.imageUrl ?? null }));
      } catch {
        setOgImages(prev => ({ ...prev, [m.id]: null }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricas]);

  async function loadData() {
    const { data: postsData } = await supabase
      .from("posts_planejados")
      .select("id, data_publicacao, tema, gancho, link_publicado")
      .eq("status", "Publicado")
      .order("data_publicacao", { ascending: false });

    if (postsData) setPosts(postsData as Post[]);

    const { data: metricasData } = await supabase
      .from("metricas_posts")
      .select("*, post:posts_planejados(id, data_publicacao, tema, gancho, link_publicado)")
      .order("data_coleta", { ascending: false });

    if (metricasData) {
      setMetricas(metricasData.map(m => ({
        ...m,
        post: Array.isArray(m.post) ? m.post[0] : m.post,
      })) as Metrica[]);
    }

    setLoading(false);
  }

  // ── N8N webhook ───────────────────────────────────────────────────────────
  async function handleUpdateViaWebhook(metricaId: string, postLink: string | null | undefined) {
    if (!postLink) return;
    setUpdatingIds(prev => new Set(prev).add(metricaId));

    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: postLink }),
      });
      if (!res.ok) throw new Error(`Webhook retornou ${res.status}`);
      const data = await res.json();

      const update = {
        data_coleta:       new Date().toISOString().split("T")[0],
        curtidas:          data.curtidas          ?? data.likes            ?? data.like_count     ?? 0,
        comentarios:       data.comentarios       ?? data.comments         ?? data.comments_count ?? 0,
        salvamentos:       data.salvamentos       ?? data.saves            ?? data.saved          ?? 0,
        compartilhamentos: data.compartilhamentos ?? data.shares           ?? data.share_count    ?? 0,
        seguidores:        data.seguidores        ?? data.followers_gained ?? data.new_followers  ?? 0,
        visitas_perfil:    data.visitas_perfil    ?? data.profile_visits   ?? data.profile_views  ?? 0,
      };

      await supabase.from("metricas_posts").update(update).eq("id", metricaId);
      await loadData();
    } catch (err) {
      console.error("Erro no webhook N8N:", err);
      alert("Não foi possível buscar as métricas. Verifique o console.");
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(metricaId); return s; });
    }
  }

  // ── Create (only registers the record; metrics come via N8N) ─────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("metricas_posts").insert({
      post_id:           createForm.post_id,
      data_coleta:       createForm.data_coleta,
      curtidas:          0,
      comentarios:       0,
      salvamentos:       0,
      compartilhamentos: 0,
      seguidores:        0,
      visitas_perfil:    0,
    });
    if (!error) {
      await loadData();
      setShowForm(false);
      setCreateForm({ post_id: "", data_coleta: new Date().toISOString().split("T")[0] });
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function openEdit(metrica: Metrica) {
    setEditForm({
      post_id:           metrica.post_id,
      data_coleta:       metrica.data_coleta,
      curtidas:          metrica.curtidas,
      comentarios:       metrica.comentarios,
      salvamentos:       metrica.salvamentos,
      compartilhamentos: metrica.compartilhamentos,
      seguidores:        metrica.seguidores,
      visitas_perfil:    metrica.visitas_perfil,
    });
    setEditingMetrica(metrica);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMetrica) return;
    const { error } = await supabase
      .from("metricas_posts")
      .update({
        post_id:           editForm.post_id,
        data_coleta:       editForm.data_coleta,
        curtidas:          editForm.curtidas,
        comentarios:       editForm.comentarios,
        salvamentos:       editForm.salvamentos,
        compartilhamentos: editForm.compartilhamentos,
        seguidores:        editForm.seguidores,
        visitas_perfil:    editForm.visitas_perfil,
      })
      .eq("id", editingMetrica.id);

    if (!error) { await loadData(); setEditingMetrica(null); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteMetrica(id: string) {
    if (confirm("Deseja excluir esta métrica?")) {
      await supabase.from("metricas_posts").delete().eq("id", id);
      loadData();
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Indicadores de Performance</h1>
          <p className="text-slate-600 mt-1">Atualização manual via webhook N8N · Score automático</p>
        </div>
        <button
          onClick={() => {
            if (posts.length === 0) { alert("⚠️ Você precisa ter posts publicados no Feed primeiro!"); return; }
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Métrica</span>
        </button>
      </div>

      {posts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            ⚠️ Marque posts como <strong>Publicado</strong> no Planejamento de Feed antes de adicionar métricas.
          </p>
        </div>
      )}

      {/* ── Modal: Nova Métrica ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Nova Métrica</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Post</label>
                <select
                  value={createForm.post_id}
                  onChange={(e) => setCreateForm({ ...createForm, post_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Escolha um post...</option>
                  {posts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {new Date(post.data_publicacao).toLocaleDateString("pt-BR")} — {post.tema}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data da Coleta</label>
                <input
                  type="date"
                  value={createForm.data_coleta}
                  onChange={(e) => setCreateForm({ ...createForm, data_coleta: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                As métricas serão preenchidas via botão <strong>Atualizar</strong> no card (N8N).
              </p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#ff901c] text-white rounded-lg hover:shadow-lg font-semibold">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Métrica ── */}
      {editingMetrica && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50">
          <div className="flex min-h-full items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Editar Métrica</h2>
              <button onClick={() => setEditingMetrica(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Post</label>
                <select
                  value={editForm.post_id}
                  onChange={(e) => setEditForm({ ...editForm, post_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Escolha um post...</option>
                  {posts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {new Date(post.data_publicacao).toLocaleDateString("pt-BR")} — {post.tema}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data da Coleta</label>
                <input
                  type="date"
                  value={editForm.data_coleta}
                  onChange={(e) => setEditForm({ ...editForm, data_coleta: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Métricas</h3>
                <div className="grid grid-cols-2 gap-3">
                  {METRIC_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-600 mb-1">{label}</label>
                      <input
                        type="number" min="0"
                        value={(editForm as Record<string, number | string>)[key] as number}
                        onChange={(e) => setEditForm({ ...editForm, [key]: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingMetrica(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#085ba7] text-white rounded-lg hover:shadow-lg font-semibold">
                  Salvar
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* ── Metric cards ── */}
      <div className="space-y-4">
        {metricas.map((metrica) => (
          <MetricCard
            key={metrica.id}
            metrica={metrica}
            ogImage={ogImages[metrica.id]}
            onDelete={deleteMetrica}
            onUpdate={handleUpdateViaWebhook}
            onEdit={openEdit}
            updating={updatingIds.has(metrica.id)}
          />
        ))}
      </div>

      {metricas.length === 0 && (
        <div className="text-center py-16">
          <TrendingUp className="w-24 h-24 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma métrica registrada</h3>
          <p className="text-slate-500 mb-6">
            {posts.length === 0 ? "Publique posts no Feed primeiro" : "Adicione e atualize via N8N"}
          </p>
          {posts.length > 0 && (
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:shadow-lg font-semibold">
              <Plus className="w-5 h-5" />
              <span>Adicionar Métrica</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
