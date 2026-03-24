"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Save, X, Upload, Calendar, FileText, Target,
  Edit, Trash2, ZoomIn,
  CheckCircle, AlertCircle, Copy, Check, Download, Eye, Filter,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Revisao {
  texto: string;
  imagens: string[];
  ultima_alteracao: string; // ISO date
}

interface CampaignEdit {
  id?: string;
  canal: string;
  tipo_campanha: string;
  nome_campanha: string;
  nome_grupo: string;
  nivel_edicao: string;
  data_alteracao: string;
  descricao_alteracao: string;
  imagens_alteracao: string[];
  motivo: string;
  data_revisao: string;
  // Legacy single-review field (kept for read compat on old records)
  observacoes_revisao?: string;
  revisoes: Revisao[];
  data_revisao_concluida?: string;
  created_at?: string;
}

/** Parse a YYYY-MM-DD date string as local date (avoids UTC -1 day issue). */
function parseLocalDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}
function fmtDate(d: string | undefined): string {
  if (!d) return "";
  return parseLocalDate(d).toLocaleDateString("pt-BR");
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NIVEIS_PESQUISA = [
  "Campanha", "Grupo de Anúncio", "Anúncio", "Palavra-chave",
  "Palavra-chave negativa", "Locais", "Criativo", "ROAS", "CPA", "Outros",
];

const NIVEIS_PERFORMANCE_MAX = [
  "Grupo de recurso", "Fichas/Produtos", "Indicadores de público-alvo",
  "Temas de pesquisa", "Termo de pesquisa negativa", "Canais bloqueados",
  "Locais", "Criativo", "ROAS", "CPA",
];

const ML_CANAIS = ["ML Chiller", "ML Azuq"];

const TIPOS_ML = ["Product Ads", "Brand Ads", "Display Ads"];

const NIVEIS_ML = [
  "Campanha", "Adição de produto", "Remoção de produto",
  "Produto Pausado", "Orçamento", "ROAS", "Campanha Deletada",
];

const CANAIS = [
  "Google", "ML Chiller", "ML Azuq", "Shopee", "Magalu",
  "Amazon", "Bing", "Meta", "LinkedIn",
];

const today = () => new Date().toISOString().split("T")[0];

// ── Image helpers ─────────────────────────────────────────────────────────────

/** Compress a base64 image to max 1200×900 at 75% JPEG quality. */
function compressImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 1200, MAX_H = 900;
      let { width: w, height: h } = img;
      if (w > MAX_W) { h = Math.round((h * MAX_W) / w); w = MAX_W; }
      if (h > MAX_H) { w = Math.round((w * MAX_H) / h); h = MAX_H; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => resolve(base64); // fallback: keep original
    img.src = base64;
  });
}

async function extractImagesFromClipboard(
  e: React.ClipboardEvent,
): Promise<string[]> {
  const results: string[] = [];
  const items = e.clipboardData?.items ?? [];
  const promises: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith("image/")) {
      const blob = items[i].getAsFile();
      if (blob) {
        promises.push(
          new Promise((res) => {
            const reader = new FileReader();
            reader.onload = async (ev) => {
              const compressed = await compressImage(ev.target?.result as string);
              results.push(compressed);
              res();
            };
            reader.readAsDataURL(blob);
          }),
        );
      }
    }
  }
  await Promise.all(promises);
  return results;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignEditsPage() {
  const [edits, setEdits] = useState<CampaignEdit[]>([]);
  const [filteredEdits, setFilteredEdits] = useState<CampaignEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Separate count that ignores date filter so the alert always reflects reality
  const [globalPendentesCount, setGlobalPendentesCount] = useState(0);

  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterCanal, setFilterCanal] = useState("Todos");
  // Confirmed filter dates (only applied when user clicks Filtrar)
  const [filterDataDe, setFilterDataDe] = useState(today());
  const [filterDataAte, setFilterDataAte] = useState(today());
  // Pending dates shown in the inputs — not yet applied to the query
  const [pendingDataDe, setPendingDataDe] = useState(today());
  const [pendingDataAte, setPendingDataAte] = useState(today());

  const [showPendentes, setShowPendentes] = useState(false);
  const [viewingEdit, setViewingEdit] = useState<CampaignEdit | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const emptyForm = (): CampaignEdit => ({
    canal: "",
    tipo_campanha: "Pesquisa",
    nome_campanha: "",
    nome_grupo: "",
    nivel_edicao: "",
    data_alteracao: today(),
    descricao_alteracao: "",
    imagens_alteracao: [],
    motivo: "",
    data_revisao: "",
    revisoes: [],
  });

  const [formData, setFormData] = useState<CampaignEdit>(emptyForm());

  // ── Load ────────────────────────────────────────────────────────────────────

  // Always keep the global pending count fresh (independent of date filter)
  useEffect(() => { loadPendentesCount(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when pendentes mode changes. Date filter requires the Filtrar button.
  useEffect(() => { loadEdits(); }, [showPendentes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filter for tipo / canal / pendentes
  useEffect(() => {
    let f = edits;
    if (filterTipo !== "Todos")   f = f.filter(e => e.tipo_campanha === filterTipo);
    if (filterCanal !== "Todos")  f = f.filter(e => e.canal === filterCanal);
    if (showPendentes)            f = f.filter(isPendente);
    setFilteredEdits(f);
  }, [edits, filterTipo, filterCanal, showPendentes]);

  // Lock body scroll when any modal/overlay is open
  useEffect(() => {
    const anyOpen = showForm || !!viewingEdit || !!lightboxImage;
    document.body.classList.toggle("modal-open", anyOpen);
    return () => document.body.classList.remove("modal-open");
  }, [showForm, viewingEdit, lightboxImage]);

  // Deep-link: open edit form from ?edit=<id>
  useEffect(() => {
    if (edits.length === 0 || showForm) return;
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    const found = edits.find(e => e.id === editId);
    if (found) { openEdit(found); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits]);

  async function loadPendentesCount() {
    const { count } = await supabase
      .from("campaign_edits")
      .select("*", { count: "exact", head: true })
      .not("data_revisao", "is", null)
      .is("data_revisao_concluida", null)
      .lte("data_revisao", today());
    setGlobalPendentesCount(count ?? 0);
  }

  async function loadEdits(overrideDe?: string, overrideAte?: string) {
    setLoading(true);
    const de = overrideDe !== undefined ? overrideDe : filterDataDe;
    const ate = overrideAte !== undefined ? overrideAte : filterDataAte;

    let query = supabase
      .from("campaign_edits")
      .select("*")
      .order("created_at", { ascending: false });

    // DB-level date filter — skipped when showing pendentes so all pending
    // records appear regardless of their data_alteracao date
    if (!showPendentes) {
      if (de)  query = query.gte("data_alteracao", de);
      if (ate) query = query.lte("data_alteracao", ate);
    }

    const { data, error } = await query;
    if (!error && data) {
      setEdits(data.map(d => ({ ...d, revisoes: d.revisoes ?? [] })));
    }
    setLoading(false);
  }

  async function applyDateFilter() {
    setFilterDataDe(pendingDataDe);
    setFilterDataAte(pendingDataAte);
    await loadEdits(pendingDataDe, pendingDataAte);
  }

  // ── Form helpers ─────────────────────────────────────────────────────────────

  function closeForm() {
    setShowForm(false);
    setFormData(emptyForm());
    setEditingId(null);
    setSaveError(null);
    window.history.pushState({}, "", "/campaign-edits");
  }

  function openEdit(edit: CampaignEdit) {
    setFormData({
      canal:               edit.canal || "",
      tipo_campanha:       edit.tipo_campanha,
      nome_campanha:       edit.nome_campanha,
      nome_grupo:          edit.nome_grupo || "",
      nivel_edicao:        edit.nivel_edicao,
      data_alteracao:      edit.data_alteracao,
      descricao_alteracao: edit.descricao_alteracao,
      imagens_alteracao:   edit.imagens_alteracao || [],
      motivo:              edit.motivo,
      data_revisao:        edit.data_revisao || "",
      revisoes:            edit.revisoes ?? [],
    });
    setEditingId(edit.id ?? null);
    setShowForm(true);
    if (edit.id) window.history.pushState({}, "", `/campaign-edits?edit=${edit.id}`);
  }

  // ── Revisão helpers ───────────────────────────────────────────────────────────

  function addRevisao() {
    setFormData(prev => ({
      ...prev,
      revisoes: [...prev.revisoes, { texto: "", imagens: [], ultima_alteracao: today() }],
    }));
  }

  function removeRevisao(idx: number) {
    setFormData(prev => ({ ...prev, revisoes: prev.revisoes.filter((_, i) => i !== idx) }));
  }

  function updateRevisaoTexto(idx: number, texto: string) {
    setFormData(prev => {
      const revisoes = [...prev.revisoes];
      revisoes[idx] = { ...revisoes[idx], texto, ultima_alteracao: today() };
      return { ...prev, revisoes };
    });
  }

  async function handleRevisaoImagePaste(e: React.ClipboardEvent, idx: number) {
    const imgs = await extractImagesFromClipboard(e);
    if (imgs.length === 0) return;
    setFormData(prev => {
      const revisoes = [...prev.revisoes];
      revisoes[idx] = {
        ...revisoes[idx],
        imagens: [...revisoes[idx].imagens, ...imgs],
        ultima_alteracao: today(),
      };
      return { ...prev, revisoes };
    });
  }

  function removeRevisaoImage(revisaoIdx: number, imgIdx: number) {
    setFormData(prev => {
      const revisoes = [...prev.revisoes];
      revisoes[revisaoIdx] = {
        ...revisoes[revisaoIdx],
        imagens: revisoes[revisaoIdx].imagens.filter((_, i) => i !== imgIdx),
      };
      return { ...prev, revisoes };
    });
  }

  // ── Description image paste ───────────────────────────────────────────────────

  async function handleDescImagePaste(e: React.ClipboardEvent) {
    const imgs = await extractImagesFromClipboard(e);
    if (imgs.length === 0) return;
    setFormData(prev => ({ ...prev, imagens_alteracao: [...prev.imagens_alteracao, ...imgs] }));
  }

  function removeDescImage(idx: number) {
    setFormData(prev => ({
      ...prev,
      imagens_alteracao: prev.imagens_alteracao.filter((_, i) => i !== idx),
    }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        canal:               formData.canal,
        tipo_campanha:       formData.tipo_campanha,
        nome_campanha:       formData.nome_campanha,
        nome_grupo:          formData.nome_grupo || null,
        nivel_edicao:        formData.nivel_edicao,
        data_alteracao:      formData.data_alteracao,
        descricao_alteracao: formData.descricao_alteracao,
        imagens_alteracao:   formData.imagens_alteracao,
        motivo:              formData.motivo,
        data_revisao:        formData.data_revisao || null,
        revisoes:            formData.revisoes,
      };

      if (editingId) {
        const { error } = await supabase.from("campaign_edits").update(payload).eq("id", editingId);
        if (error) { setSaveError(error.message); } else { await loadEdits(); loadPendentesCount(); closeForm(); }
      } else {
        const { error } = await supabase.from("campaign_edits").insert(payload);
        if (error) { setSaveError(error.message); } else { await loadEdits(); loadPendentesCount(); closeForm(); }
      }
    } catch (err) {
      setSaveError("Erro inesperado ao salvar.");
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  }

  // ── Other actions ─────────────────────────────────────────────────────────

  async function marcarComoRevisado(id: string) {
    const { error } = await supabase
      .from("campaign_edits")
      .update({ data_revisao_concluida: today() })
      .eq("id", id);
    if (!error) { loadEdits(); loadPendentesCount(); }
  }

  async function deleteEdit(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta edição?")) return;
    const { error } = await supabase.from("campaign_edits").delete().eq("id", id);
    if (!error) { loadEdits(); loadPendentesCount(); }
  }

  function copiarConteudo(edit: CampaignEdit) {
    const revisoesTxt = edit.revisoes?.length
      ? edit.revisoes.map((r, i) =>
          `Revisão ${i + 1} (${fmtDate(r.ultima_alteracao)}): ${r.texto}`
        ).join("\n\n")
      : edit.observacoes_revisao || "(nenhuma)";

    const texto = [
      `Canal: ${edit.canal || "(não definido)"}`,
      `Tipo de Campanha: ${edit.tipo_campanha}`,
      `Nome da campanha: ${edit.nome_campanha}`,
      edit.nome_grupo ? `${nomeGrupoLabel(edit.tipo_campanha)}: ${edit.nome_grupo}` : null,
      `Nível de edição: ${edit.nivel_edicao}`,
      `Data da Alteração: ${fmtDate(edit.data_alteracao)}`,
      `Descrição da alteração: ${edit.descricao_alteracao}`,
      `Motivo da Alteração: ${edit.motivo}`,
      `Data da revisão: ${edit.data_revisao ? fmtDate(edit.data_revisao) : "(não agendada)"}`,
      `Revisões:\n${revisoesTxt}`,
    ].filter(Boolean).join("\n\n");

    navigator.clipboard.writeText(texto).then(() => {
      setCopiedId(edit.id ?? null);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function exportarCSV() {
    const headers = [
      "Canal", "Nome da Campanha", "Tipo de Campanha", "Nível de Edição",
      "Data da Alteração", "Descrição da Alteração", "Motivo",
      "Data de Revisão", "Revisões", "Revisado em",
    ];
    const rows = filteredEdits.map(e => {
      const revisoesTxt = e.revisoes?.length
        ? e.revisoes.map((r, i) => `Rev.${i + 1}: ${r.texto}`).join(" | ")
        : e.observacoes_revisao || "";
      return [
        e.canal || "", e.nome_campanha, e.tipo_campanha, e.nivel_edicao,
        e.data_alteracao, e.descricao_alteracao, e.motivo,
        e.data_revisao || "", revisoesTxt, e.data_revisao_concluida || "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edicoes-campanhas-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportarExcel() {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Chiller Peças";
      workbook.created = new Date();

      // ── Main data sheet ──────────────────────────────────────────────────────
      const ws = workbook.addWorksheet("Edições");
      ws.columns = [
        { header: "Canal",               key: "canal",               width: 14 },
        { header: "Nome da Campanha",     key: "nome_campanha",       width: 32 },
        { header: "Tipo de Campanha",     key: "tipo_campanha",       width: 18 },
        { header: "Nível de Edição",      key: "nivel_edicao",        width: 22 },
        { header: "Data da Alteração",    key: "data_alteracao",      width: 16 },
        { header: "Descrição",            key: "descricao_alteracao", width: 50 },
        { header: "Motivo",               key: "motivo",              width: 40 },
        { header: "Data de Revisão",      key: "data_revisao",        width: 16 },
        { header: "Qtd. Revisões",        key: "qtd_revisoes",        width: 14 },
        { header: "Qtd. Imagens",         key: "qtd_imagens",         width: 14 },
        { header: "Revisado em",          key: "data_revisao_concluida", width: 16 },
      ];

      // Style header row
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF085BA7" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 22;

      filteredEdits.forEach(e => {
        const allImages = [
          ...(e.imagens_alteracao || []),
          ...(e.revisoes?.flatMap(r => r.imagens) || []),
        ];
        ws.addRow({
          canal:               e.canal || "",
          nome_campanha:       e.nome_campanha,
          tipo_campanha:       e.tipo_campanha,
          nivel_edicao:        e.nivel_edicao,
          data_alteracao:      e.data_alteracao,
          descricao_alteracao: e.descricao_alteracao,
          motivo:              e.motivo,
          data_revisao:        e.data_revisao || "",
          qtd_revisoes:        e.revisoes?.length ?? 0,
          qtd_imagens:         allImages.length,
          data_revisao_concluida: e.data_revisao_concluida || "",
        });
      });

      // Freeze header, auto-filter
      ws.views = [{ state: "frozen", ySplit: 1 }];
      ws.autoFilter = { from: "A1", to: "K1" };

      // ── Image sheets (one per edit that has images) ───────────────────────────
      for (const edit of filteredEdits) {
        const allImages = [
          ...(edit.imagens_alteracao || []),
          ...(edit.revisoes?.flatMap(r => r.imagens) || []),
        ];
        if (allImages.length === 0) continue;

        // Sheet name: max 31 chars, no special chars
        const sheetName = edit.nome_campanha
          .replace(/[\\/*?:[\]]/g, "-")
          .substring(0, 28) + (edit.id?.substring(0, 3) ?? "");

        const imgWs = workbook.addWorksheet(sheetName);

        // Header info
        imgWs.getCell("A1").value = "Campanha:";
        imgWs.getCell("B1").value = edit.nome_campanha;
        imgWs.getCell("A2").value = "Data:";
        imgWs.getCell("B2").value = edit.data_alteracao;
        imgWs.getCell("A1").font = { bold: true };
        imgWs.getCell("A2").font = { bold: true };

        // Add each image in a column layout (2 per row)
        const IMG_W = 360, IMG_H = 270;
        const COL_PX_W = 100; // approximate px per column unit
        const ROW_PX_H = 15;  // approximate px per row unit
        const colsPerImg = Math.ceil(IMG_W / COL_PX_W);
        const rowsPerImg = Math.ceil(IMG_H / ROW_PX_H);
        const IMAGES_PER_ROW = 2;

        for (let i = 0; i < allImages.length; i++) {
          try {
            const imgData = allImages[i];
            const base64 = imgData.includes(",") ? imgData.split(",")[1] : imgData;
            const ext = imgData.includes("png") ? "png" : "jpeg";
            const imageId = workbook.addImage({ base64, extension: ext as "png" | "jpeg" });

            const gridCol = (i % IMAGES_PER_ROW) * colsPerImg;
            const gridRow = 4 + Math.floor(i / IMAGES_PER_ROW) * (rowsPerImg + 1);

            imgWs.addImage(imageId, {
              tl: { col: gridCol, row: gridRow },
              ext: { width: IMG_W, height: IMG_H },
            });
          } catch {
            // skip unreadable image
          }
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edicoes-campanhas-${today()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao exportar Excel:", err);
      alert("Erro ao gerar o Excel. Tente o CSV como alternativa.");
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function isPendente(edit: CampaignEdit) {
    return !!(edit.data_revisao && !edit.data_revisao_concluida &&
      new Date(edit.data_revisao) <= new Date());
  }

  function getDiasAtraso(dataRevisao: string) {
    return Math.floor(
      (new Date().getTime() - new Date(dataRevisao).getTime()) / 86400000,
    );
  }

  const isMLCanal = ML_CANAIS.includes(formData.canal);
  const tiposDisponiveis = isMLCanal ? TIPOS_ML : ["Pesquisa", "Performance Max"];
  const niveisDisponiveis = isMLCanal
    ? NIVEIS_ML
    : formData.tipo_campanha === "Pesquisa" ? NIVEIS_PESQUISA : NIVEIS_PERFORMANCE_MAX;

  /** Label do campo nome_grupo baseado no tipo de campanha */
  function nomeGrupoLabel(tipo: string): string {
    if (tipo === "Performance Max") return "Nome do Grupo de Recurso";
    if (TIPOS_ML.includes(tipo)) return "Identificação do Anúncio";
    return "Nome do Grupo de Anúncio";
  }

  // Local count (within loaded date range) — used only for filter label
  const pendentesCount = edits.filter(isPendente).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#085ba7] rounded-xl flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Edições em Campanhas</h1>
            <p className="text-slate-600 text-sm hidden sm:block">Registre e acompanhe alterações em campanhas Google Ads</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-semibold text-sm"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel + </span>Imagens
          </button>
          <button
            onClick={() => { setFormData(emptyForm()); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#ff901c] text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Edição</span>
          </button>
        </div>
      </div>

      {/* Pendentes alert — uses globalPendentesCount so it shows regardless of date filter */}
      {globalPendentesCount > 0 && !showPendentes && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-bold text-red-900">
                  {globalPendentesCount} edição{globalPendentesCount !== 1 ? "ões" : ""} pendente{globalPendentesCount !== 1 ? "s" : ""} de revisão
                </h3>
                <p className="text-sm text-red-700">Existem campanhas aguardando revisão</p>
              </div>
            </div>
            <button onClick={() => setShowPendentes(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
              Ver Pendentes
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        {/* Tipo + pendentes row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <span className="text-sm font-semibold text-slate-700">Filtrar:</span>
            <div className="flex gap-2">
              {[false, true].map(pend => (
                <button key={String(pend)} onClick={() => setShowPendentes(pend)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    showPendentes === pend
                      ? pend ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                              : "bg-[#085ba7] text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pend && <AlertCircle className="w-4 h-4" />}
                  {pend ? "Pendentes" : "Todas"}
                  {pend && globalPendentesCount > 0 && (
                    <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                      {globalPendentesCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex gap-2 flex-wrap">
              {["Todos", "Pesquisa", "Performance Max", "Product Ads", "Brand Ads", "Display Ads"].map(tipo => (
                <button key={tipo} onClick={() => setFilterTipo(tipo)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterTipo === tipo ? "bg-[#085ba7] text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm text-slate-600 font-medium">
            {filteredEdits.length} edição{filteredEdits.length !== 1 ? "ões" : ""}
          </div>
        </div>

        {/* Canal */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">Canal:</span>
          <select value={filterCanal} onChange={e => setFilterCanal(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
            <option value="Todos">Todos os canais</option>
            {CANAIS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {filterCanal !== "Todos" && (
            <button onClick={() => setFilterCanal("Todos")}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg">
              Limpar canal
            </button>
          )}
        </div>

        {/* Date — with Filtrar button */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-sm font-semibold text-slate-700">Data da alteração:</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 whitespace-nowrap">De</label>
              <input type="date" value={pendingDataDe} onChange={e => setPendingDataDe(e.target.value)}
                className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 whitespace-nowrap">Até</label>
              <input type="date" value={pendingDataAte} onChange={e => setPendingDataAte(e.target.value)}
                className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
            </div>
            <button
              onClick={applyDateFilter}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#085ba7] text-white rounded-lg text-sm font-semibold hover:bg-[#085ba7]/90 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
            {(pendingDataDe || pendingDataAte) && (
              <button onClick={() => { setPendingDataDe(""); setPendingDataAte(""); applyDateFilter(); }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg">
                Ver todos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Form modal ──────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? "Editar Registro" : "Registrar Nova Edição"}
              </h2>
              <button onClick={closeForm} disabled={saving} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 1. Canal */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Canal *</label>
                <select value={formData.canal} required
                  onChange={e => {
                    const c = e.target.value;
                    const toML = ML_CANAIS.includes(c);
                    const wasML = ML_CANAIS.includes(formData.canal);
                    setFormData({
                      ...formData,
                      canal: c,
                      tipo_campanha: toML ? TIPOS_ML[0] : (wasML ? "Pesquisa" : formData.tipo_campanha),
                      nivel_edicao: (toML !== wasML) ? "" : formData.nivel_edicao,
                    });
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] font-medium">
                  <option value="">Selecione o canal...</option>
                  {CANAIS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 2. Tipo de Campanha — options driven by canal */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de Campanha *</label>
                <select value={formData.tipo_campanha} required
                  onChange={e => setFormData({ ...formData, tipo_campanha: e.target.value, nivel_edicao: "" })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] font-medium">
                  {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* 3. Nome da Campanha */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome da Campanha *</label>
                <input type="text" value={formData.nome_campanha} required
                  onChange={e => setFormData({ ...formData, nome_campanha: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] font-medium"
                  placeholder="Ex: [Search][Vendas][Nordeste] - Norte-Nordeste"
                />
              </div>

              {/* 4. Nome do Grupo de Anúncio / Recurso */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {nomeGrupoLabel(formData.tipo_campanha)}
                </label>
                <input type="text" value={formData.nome_grupo}
                  onChange={e => setFormData({ ...formData, nome_grupo: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] font-medium"
                  placeholder={
                    formData.tipo_campanha === "Performance Max"
                      ? "Ex: Grupo de recurso principal"
                      : "Ex: Grupo - Ar Condicionado Split"
                  }
                />
              </div>

              {/* 5. Nível de Edição */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nível de Edição *</label>
                <select value={formData.nivel_edicao} required
                  onChange={e => setFormData({ ...formData, nivel_edicao: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] font-medium">
                  <option value="">Selecione o nível...</option>
                  {niveisDisponiveis.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Data da Alteração */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data da Alteração *</label>
                <input type="date" value={formData.data_alteracao} required
                  onChange={e => setFormData({ ...formData, data_alteracao: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]"
                />
              </div>

              {/* Descrição da Alteração */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição da Alteração *</label>
                <div className="space-y-3">
                  <textarea value={formData.descricao_alteracao} required rows={4}
                    onChange={e => setFormData({ ...formData, descricao_alteracao: e.target.value })}
                    onPaste={handleDescImagePaste}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]"
                    placeholder="Descreva a alteração realizada... (Ctrl+V para colar imagens)"
                  />
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Cole imagens diretamente no campo (Ctrl+V) — são comprimidas automaticamente
                  </p>
                  {formData.imagens_alteracao.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {formData.imagens_alteracao.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Preview ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-slate-200" />
                          <button type="button" onClick={() => removeDescImage(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Motivo da Alteração *</label>
                <textarea value={formData.motivo} required rows={3}
                  onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]"
                  placeholder="Por que esta alteração foi necessária?"
                />
              </div>

              {/* Data de Revisão */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Revisão</label>
                <input type="date" value={formData.data_revisao}
                  onChange={e => setFormData({ ...formData, data_revisao: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7]"
                />
              </div>

              {/* ── Revisões múltiplas ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Revisões {formData.revisoes.length > 0 && `(${formData.revisoes.length})`}
                  </label>
                  <button type="button" onClick={addRevisao}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#085ba7] text-white rounded-lg hover:bg-[#085ba7]/90 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Revisão
                  </button>
                </div>

                {formData.revisoes.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-lg">
                    Nenhuma revisão adicionada ainda
                  </p>
                )}

                <div className="space-y-4">
                  {formData.revisoes.map((rev, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#085ba7]">Revisão {idx + 1}</span>
                        <div className="flex items-center gap-3">
                          {rev.ultima_alteracao && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Última alteração: {fmtDate(rev.ultima_alteracao)}
                            </span>
                          )}
                          <button type="button" onClick={() => removeRevisao(idx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <textarea value={rev.texto} rows={3}
                        onChange={e => updateRevisaoTexto(idx, e.target.value)}
                        onPaste={e => handleRevisaoImagePaste(e, idx)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] bg-white text-sm"
                        placeholder="Anotações da revisão... (Ctrl+V para colar imagens)"
                      />

                      {rev.imagens.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {rev.imagens.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative group">
                              <img src={img} alt={`Rev ${idx + 1} img ${imgIdx + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                              <button type="button" onClick={() => removeRevisaoImage(idx, imgIdx)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        Cole imagens com Ctrl+V no campo de texto acima
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save error */}
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700 font-medium">
                  Erro ao salvar: {saveError}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={closeForm} disabled={saving}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:bg-[#e58318] disabled:opacity-50 font-semibold">
                  {saving ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Salvando...</span></>
                  ) : (
                    <><Save className="w-5 h-5" /><span>{editingId ? "Atualizar" : "Salvar"}</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View dialog (Exibir) ──────────────────────────────────────────────── */}
      {viewingEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setViewingEdit(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Dialog Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{viewingEdit.nome_campanha}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-[#085ba7] text-white text-xs font-bold rounded">{viewingEdit.tipo_campanha}</span>
                  <span className="px-2 py-0.5 bg-slate-600 text-white text-xs font-medium rounded">{viewingEdit.nivel_edicao}</span>
                  {viewingEdit.canal && (
                    <span className="px-2 py-0.5 bg-[#ff901c] text-white text-xs font-medium rounded">{viewingEdit.canal}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setViewingEdit(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="px-8 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {viewingEdit.nome_grupo && (
                  <div className="col-span-2">
                    <span className="font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      {nomeGrupoLabel(viewingEdit.tipo_campanha)}
                    </span>
                    <p className="text-slate-900 font-medium mt-1">{viewingEdit.nome_grupo}</p>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-500 text-xs uppercase tracking-wide">Data da Alteração</span>
                  <p className="text-slate-900 font-medium mt-1">{fmtDate(viewingEdit.data_alteracao)}</p>
                </div>
                {viewingEdit.data_revisao && (
                  <div>
                    <span className="font-semibold text-slate-500 text-xs uppercase tracking-wide">Data de Revisão</span>
                    <p className="text-slate-900 font-medium mt-1">{fmtDate(viewingEdit.data_revisao)}</p>
                  </div>
                )}
                {viewingEdit.data_revisao_concluida && (
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                      <CheckCircle className="w-3 h-3" />
                      Revisado em {fmtDate(viewingEdit.data_revisao_concluida)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Descrição da Alteração</h4>
                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed bg-slate-50 p-4 rounded-lg">{viewingEdit.descricao_alteracao}</p>
              </div>

              {viewingEdit.imagens_alteracao?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">
                    Evidências da alteração ({viewingEdit.imagens_alteracao.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingEdit.imagens_alteracao.map((img, idx) => (
                      <div key={idx} className="relative group cursor-pointer" onClick={() => setLightboxImage(img)}>
                        <img src={img} alt={`Evidência ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 group-hover:border-[#108bd1] transition-colors" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition-all flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Motivo da Alteração</h4>
                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed bg-slate-50 p-4 rounded-lg">{viewingEdit.motivo}</p>
              </div>

              {(viewingEdit.revisoes?.length > 0 || viewingEdit.observacoes_revisao) && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">
                    Revisões {viewingEdit.revisoes?.length > 0 && `(${viewingEdit.revisoes.length})`}
                  </h4>
                  <div className="space-y-3">
                    {!viewingEdit.revisoes?.length && viewingEdit.observacoes_revisao && (
                      <div className="bg-blue-50 border-l-4 border-[#108bd1] p-4 rounded">
                        <p className="text-slate-700 whitespace-pre-wrap text-sm">{viewingEdit.observacoes_revisao}</p>
                      </div>
                    )}
                    {viewingEdit.revisoes?.map((rev, idx) => (
                      <div key={idx} className="bg-blue-50 border-l-4 border-[#108bd1] p-4 rounded space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#085ba7]">Revisão {idx + 1}</span>
                          {rev.ultima_alteracao && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {fmtDate(rev.ultima_alteracao)}
                            </span>
                          )}
                        </div>
                        {rev.texto && <p className="text-slate-700 whitespace-pre-wrap text-sm">{rev.texto}</p>}
                        {rev.imagens?.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {rev.imagens.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative group cursor-pointer"
                                onClick={() => setLightboxImage(img)}>
                                <img src={img} alt={`Rev ${idx + 1} img ${imgIdx + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border border-slate-200 group-hover:border-[#108bd1] transition-colors" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition-all flex items-center justify-center">
                                  <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dialog Actions */}
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                {isPendente(viewingEdit) && (
                  <button onClick={() => { viewingEdit.id && marcarComoRevisado(viewingEdit.id); setViewingEdit(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Marcar como Revisado
                  </button>
                )}
                <button onClick={() => { openEdit(viewingEdit); setViewingEdit(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#085ba7] text-white rounded-lg hover:bg-[#085ba7]/90 font-semibold text-sm">
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button onClick={() => setViewingEdit(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm ml-auto">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setLightboxImage(null)}>
          <button onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2">
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxImage} alt="Visualização em tela cheia"
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Card list ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#085ba7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEdits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-300">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {showPendentes ? "Nenhuma edição pendente" : "Nenhuma edição registrada"}
          </h3>
          <p className="text-slate-600 mb-6">
            {showPendentes ? "Todas as edições foram revisadas!" : "Filtre por outra data ou registre uma nova edição"}
          </p>
          {!showPendentes && (
            <button onClick={() => { setFormData(emptyForm()); setShowForm(true); }}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#ff901c] text-white rounded-lg hover:shadow-lg font-semibold">
              <Plus className="w-5 h-5" /><span>Nova Edição</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEdits.map((edit) => {
            const pendente = isPendente(edit);
            const diasAtraso = edit.data_revisao ? getDiasAtraso(edit.data_revisao) : 0;

            return (
              <div key={edit.id}
                className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all overflow-hidden ${
                  pendente ? "border-red-500" : "border-slate-200"
                }`}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        pendente ? "bg-gradient-to-br from-red-500 to-red-600 animate-pulse" : "bg-[#085ba7]"
                      }`}>
                        {pendente
                          ? <AlertCircle className="w-4 h-4 text-white" />
                          : <Target className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-bold text-slate-900 truncate">{edit.nome_campanha}</h3>
                        <div className="flex items-center flex-wrap gap-1 mt-1">
                          <span className="px-2 py-1 bg-[#085ba7] text-white text-xs font-bold rounded">{edit.tipo_campanha}</span>
                          <span className="px-2 py-1 bg-slate-600 text-white text-xs font-medium rounded">{edit.nivel_edicao}</span>
                          {edit.canal && (
                            <span className="px-2 py-1 bg-[#ff901c] text-white text-xs font-medium rounded">{edit.canal}</span>
                          )}
                          <span className="text-xs text-slate-500">
                            {fmtDate(edit.data_alteracao)}
                          </span>
                          {edit.revisoes?.length > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {edit.revisoes.length} revisão{edit.revisoes.length !== 1 ? "ões" : ""}
                            </span>
                          )}
                          {(edit.imagens_alteracao?.length > 0 || edit.revisoes?.some(r => r.imagens?.length > 0)) && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              📷 {(edit.imagens_alteracao?.length || 0) + (edit.revisoes?.reduce((acc, r) => acc + (r.imagens?.length || 0), 0) || 0)} img
                            </span>
                          )}
                          {pendente && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
                              {diasAtraso === 0 ? "HOJE!" : `${diasAtraso} dia${diasAtraso > 1 ? "s" : ""} atraso`}
                            </span>
                          )}
                          {edit.data_revisao_concluida && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Revisado {fmtDate(edit.data_revisao_concluida)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {pendente && (
                        <button onClick={() => edit.id && marcarComoRevisado(edit.id)}
                          className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded-lg" title="Marcar como Revisado">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => copiarConteudo(edit)}
                        className={`p-1.5 rounded-lg transition-colors ${copiedId === edit.id ? "text-green-600 bg-green-50" : "text-slate-500 hover:bg-slate-50"}`}
                        title="Copiar">
                        {copiedId === edit.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(edit)}
                        className="p-1.5 text-[#085ba7] hover:bg-blue-50 rounded-lg" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => edit.id && deleteEdit(edit.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setViewingEdit(edit)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        title="Exibir detalhes">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Exibir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
