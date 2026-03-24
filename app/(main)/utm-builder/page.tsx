"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Link as LinkIcon, Plus, X, Copy, Check, Trash2, Edit,
  Search, Tag, BookOpen, ChevronDown, Shuffle, Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UtmCode {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIAS = ["Geral", "Fonte", "Mídia", "Campanha", "Conteúdo", "Termo"];

const SOURCE_PRESETS: Record<string, { utm_source: string; utm_medium: string }> = {
  "Google Ads":    { utm_source: "google",    utm_medium: "cpc" },
  "Facebook Ads":  { utm_source: "facebook",  utm_medium: "paid_social" },
  "Instagram Ads": { utm_source: "instagram", utm_medium: "paid_social" },
  "Email":         { utm_source: "email",     utm_medium: "email" },
  "WhatsApp":      { utm_source: "whatsapp",  utm_medium: "messenger" },
  "Orgânico":      { utm_source: "organic",   utm_medium: "referral" },
  "Personalizado": { utm_source: "",          utm_medium: "" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function buildUtmUrl(base: string, params: Record<string, string>): string {
  if (!base) return "";
  const cleanBase = base.replace(/\/$/, "");
  const utm = Object.entries(params)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join("&");
  return utm ? `${cleanBase}?${utm}` : cleanBase;
}

// ── CodePicker component ───────────────────────────────────────────────────────

function CodePicker({
  value, onChange, codes, label, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  codes: UtmCode[];
  label: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return codes.filter(c =>
      c.codigo.includes(q) || c.descricao.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [codes, search]);

  const selected = codes.find(c => c.codigo === value);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      <div className="flex gap-2">
        {/* Free-text input */}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "Digite ou selecione um código"}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#085ba7] font-mono"
        />
        {/* Code picker dropdown */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 px-3 py-2 bg-[#085ba7] text-white rounded-lg text-xs font-semibold hover:bg-[#085ba7]/90 whitespace-nowrap"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Códigos
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Description hint */}
      {selected && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#085ba7] bg-blue-50 px-3 py-1.5 rounded-md">
          <Tag className="w-3 h-3 flex-shrink-0" />
          <span className="font-medium">{selected.codigo}</span>
          <span className="text-slate-500">→</span>
          <span className="text-slate-700">{selected.descricao}</span>
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar código ou descrição..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#085ba7]"
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">Nenhum código encontrado</div>
          ) : (
            filtered.map(code => (
              <button
                key={code.id}
                onClick={() => { onChange(code.codigo); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-3 ${value === code.codigo ? "bg-blue-50" : ""}`}
              >
                <code className="text-xs font-bold text-[#085ba7] bg-blue-100 px-2 py-0.5 rounded font-mono mt-0.5 flex-shrink-0">
                  {code.codigo}
                </code>
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 leading-relaxed">{code.descricao}</p>
                  {code.categoria !== "Geral" && (
                    <span className="text-[10px] text-slate-400">{code.categoria}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UtmBuilderPage() {
  const [codes, setCodes] = useState<UtmCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Builder state
  const [protocol, setProtocol] = useState("https://");
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedSource, setSelectedSource] = useState("Google Ads");
  const [utmSource, setUtmSource] = useState("google");
  const [utmMedium, setUtmMedium] = useState("cpc");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // Code library state
  const [showLibrary, setShowLibrary] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const [libFilter, setLibFilter] = useState("Todos");
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [editingCode, setEditingCode] = useState<UtmCode | null>(null);
  const [codeForm, setCodeForm] = useState({ codigo: "", descricao: "", categoria: "Geral" });
  const [savingCode, setSavingCode] = useState(false);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    setLoading(true);
    const { data } = await supabase
      .from("utm_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCodes(data);
    setLoading(false);
  }

  // ── URL builder ─────────────────────────────────────────────────────────────

  const fullUrl = useMemo(() => {
    const base = `${protocol}${baseUrl}`;
    return buildUtmUrl(base, {
      utm_source:   utmSource,
      utm_medium:   utmMedium,
      utm_campaign: utmCampaign,
      utm_content:  utmContent,
      utm_term:     utmTerm,
    });
  }, [protocol, baseUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm]);

  function applySourcePreset(name: string) {
    setSelectedSource(name);
    const preset = SOURCE_PRESETS[name];
    if (preset) {
      setUtmSource(preset.utm_source);
      setUtmMedium(preset.utm_medium);
    }
  }

  function copyUrl() {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Code library CRUD ───────────────────────────────────────────────────────

  function openNewCode() {
    setCodeForm({ codigo: generateCode(), descricao: "", categoria: "Geral" });
    setEditingCode(null);
    setShowCodeForm(true);
  }

  function openEditCode(code: UtmCode) {
    setCodeForm({ codigo: code.codigo, descricao: code.descricao, categoria: code.categoria });
    setEditingCode(code);
    setShowCodeForm(true);
  }

  async function saveCode() {
    if (!codeForm.codigo || !codeForm.descricao) return;
    setSavingCode(true);
    if (editingCode) {
      await supabase.from("utm_codes").update(codeForm).eq("id", editingCode.id);
    } else {
      await supabase.from("utm_codes").insert(codeForm);
    }
    setSavingCode(false);
    setShowCodeForm(false);
    setEditingCode(null);
    loadCodes();
  }

  async function deleteCode(id: string) {
    if (!confirm("Excluir este código?")) return;
    await supabase.from("utm_codes").delete().eq("id", id);
    loadCodes();
  }

  // ── Filtered codes for library view ────────────────────────────────────────

  const filteredCodes = useMemo(() => {
    const q = codeSearch.toLowerCase();
    return codes.filter(c => {
      const matchSearch = !q || c.codigo.includes(q) || c.descricao.toLowerCase().includes(q);
      const matchCat = libFilter === "Todos" || c.categoria === libFilter;
      return matchSearch && matchCat;
    });
  }, [codes, codeSearch, libFilter]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[#085ba7] rounded-xl flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Criador de UTMs</h1>
            <p className="text-slate-600">Gere links rastreados com códigos semânticos</p>
          </div>
        </div>
        <button
          onClick={() => setShowLibrary(s => !s)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            showLibrary ? "bg-[#085ba7] text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Biblioteca de Códigos
          <span className="bg-[#ff901c] text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {codes.length}
          </span>
        </button>
      </div>

      {/* Innovation banner */}
      <div className="bg-gradient-to-r from-[#085ba7] to-[#108bd1] rounded-xl p-4 text-white flex items-start gap-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-0.5">Como funciona o sistema de códigos?</p>
          <p className="text-blue-100 leading-relaxed">
            Em vez de escrever descrições longas nos parâmetros UTM — o que deixa a URL enorme — você cria
            <strong className="text-white"> códigos curtos alfanuméricos</strong> vinculados a descrições completas.
            Por exemplo: <code className="bg-white/20 px-1.5 py-0.5 rounded font-mono text-xs">a3f7b2c1</code> = "Campanha Dia dos Pais – Homem 35-50 anos – Google Search".
            A URL fica limpa, e na hora de analisar você consulta a Biblioteca de Códigos para entender o contexto.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Builder panel ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[#085ba7]" />
            Construir URL
          </h2>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Endereço do Site
            </label>
            <div className="flex">
              <select
                value={protocol}
                onChange={e => setProtocol(e.target.value)}
                className="px-3 py-2 border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 text-sm font-mono font-semibold text-[#ff901c]"
              >
                <option>https://</option>
                <option>http://</option>
              </select>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="www.chillerpecas.com.br/produtos"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg text-sm focus:ring-2 focus:ring-[#085ba7]"
              />
            </div>
          </div>

          {/* Traffic source presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Fonte de Tráfego
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(SOURCE_PRESETS).map(name => (
                <button
                  key={name}
                  onClick={() => applySourcePreset(name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSource === name
                      ? "bg-[#ff901c] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Required params */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-1">
              Parâmetros Obrigatórios
            </p>

            <CodePicker
              value={utmSource}
              onChange={setUtmSource}
              codes={codes.filter(c => c.categoria === "Fonte" || c.categoria === "Geral")}
              label="utm_source — Origem"
              placeholder="Ex: google, facebook, email"
            />

            <CodePicker
              value={utmMedium}
              onChange={setUtmMedium}
              codes={codes.filter(c => c.categoria === "Mídia" || c.categoria === "Geral")}
              label="utm_medium — Mídia"
              placeholder="Ex: cpc, email, social"
            />

            <CodePicker
              value={utmCampaign}
              onChange={setUtmCampaign}
              codes={codes.filter(c => c.categoria === "Campanha" || c.categoria === "Geral")}
              label="utm_campaign — Campanha"
              placeholder="Ex: a3f7b2c1 ou black_friday_2024"
            />
          </div>

          {/* Optional params */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-1">
              Parâmetros Opcionais
            </p>

            <CodePicker
              value={utmContent}
              onChange={setUtmContent}
              codes={codes.filter(c => c.categoria === "Conteúdo" || c.categoria === "Geral")}
              label="utm_content — Conteúdo do anúncio"
              placeholder="Ex: banner_topo, cta_azul"
            />

            <CodePicker
              value={utmTerm}
              onChange={setUtmTerm}
              codes={codes.filter(c => c.categoria === "Termo" || c.categoria === "Geral")}
              label="utm_term — Palavra-chave"
              placeholder="Ex: chiller+industrial ou {keyword}"
            />
          </div>
        </div>

        {/* ── Preview panel ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* URL preview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">URL Gerada</h3>
            {fullUrl ? (
              <>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs break-all text-slate-700 leading-relaxed min-h-[80px]">
                  {fullUrl.split("?").map((part, i) => (
                    <span key={i}>
                      {i === 0 ? (
                        <span className="text-slate-900 font-semibold">{part}</span>
                      ) : (
                        <span>
                          {"?"}
                          {part.split("&").map((param, j) => (
                            <span key={j}>
                              {j > 0 && <span className="text-slate-400">&</span>}
                              <span className="text-[#085ba7]">
                                {param.split("=")[0]}
                              </span>
                              <span className="text-slate-400">=</span>
                              <span className="text-[#ff901c] font-semibold">
                                {param.split("=").slice(1).join("=")}
                              </span>
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <button
                  onClick={copyUrl}
                  className={`mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-[#ff901c] text-white hover:bg-[#e58318] shadow-md hover:shadow-lg"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar URL"}
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
                Preencha a URL base para visualizar
              </div>
            )}
          </div>

          {/* Parameter summary */}
          {fullUrl && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Decodificação dos Parâmetros</h3>
              <div className="space-y-2">
                {[
                  { key: "utm_source", value: utmSource, label: "Origem" },
                  { key: "utm_medium", value: utmMedium, label: "Mídia" },
                  { key: "utm_campaign", value: utmCampaign, label: "Campanha" },
                  { key: "utm_content", value: utmContent, label: "Conteúdo" },
                  { key: "utm_term", value: utmTerm, label: "Termo" },
                ].filter(p => p.value).map(param => {
                  const codeMatch = codes.find(c => c.codigo === param.value);
                  return (
                    <div key={param.key} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="flex-shrink-0 w-28">
                        <span className="text-xs text-slate-500">{param.label}</span>
                        <code className="block text-xs font-mono text-[#085ba7] font-semibold">{param.value}</code>
                      </div>
                      {codeMatch ? (
                        <div className="flex-1 text-xs text-slate-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                          <Tag className="w-3 h-3 inline mr-1 text-[#085ba7]" />
                          {codeMatch.descricao}
                        </div>
                      ) : (
                        <div className="flex-1 text-xs text-slate-400 italic py-1.5">
                          (texto livre)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick add code shortcut */}
          <div className="bg-[#085ba7]/5 border border-[#085ba7]/20 rounded-2xl p-4">
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Quer transformar um valor em código rastreável?
            </p>
            <button
              onClick={openNewCode}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#085ba7] text-white rounded-xl text-sm font-semibold hover:bg-[#085ba7]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Código na Biblioteca
            </button>
          </div>
        </div>
      </div>

      {/* ── Code Library ──────────────────────────────────────────────────────── */}
      {showLibrary && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#085ba7]" />
              <h2 className="text-lg font-bold text-slate-900">Biblioteca de Códigos</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredCodes.length} de {codes.length}
              </span>
            </div>
            <button
              onClick={openNewCode}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#ff901c] text-white rounded-lg text-sm font-semibold hover:bg-[#e58318]"
            >
              <Plus className="w-4 h-4" />
              Novo Código
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={codeSearch}
                onChange={e => setCodeSearch(e.target.value)}
                placeholder="Buscar código ou descrição..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#085ba7]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["Todos", ...CATEGORIAS].map(cat => (
                <button
                  key={cat}
                  onClick={() => setLibFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    libFilter === cat
                      ? "bg-[#085ba7] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Code list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#085ba7] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhum código encontrado</p>
              <p className="text-sm mt-1">Crie seu primeiro código para começar</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCodes.map(code => (
                <div key={code.id} className="px-6 py-4 hover:bg-slate-50 flex items-center gap-4">
                  <code className="text-sm font-bold text-[#085ba7] bg-blue-100 px-3 py-1 rounded-lg font-mono flex-shrink-0">
                    {code.codigo}
                  </code>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-relaxed">{code.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {code.categoria}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(code.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(code.codigo);
                      }}
                      className="p-2 text-slate-400 hover:text-[#085ba7] hover:bg-blue-50 rounded-lg"
                      title="Copiar código"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditCode(code)}
                      className="p-2 text-slate-400 hover:text-[#085ba7] hover:bg-blue-50 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Code form modal ───────────────────────────────────────────────────── */}
      {showCodeForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setShowCodeForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                {editingCode ? "Editar Código" : "Novo Código"}
              </h3>
              <button onClick={() => setShowCodeForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Code field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Código <span className="text-slate-400 font-normal text-xs">(curto, alfanumérico)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeForm.codigo}
                    onChange={e => setCodeForm({ ...codeForm, codigo: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] font-mono text-[#085ba7] font-bold"
                    placeholder="Ex: a3f7b2c1"
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={() => setCodeForm({ ...codeForm, codigo: generateCode() })}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                    title="Gerar código aleatório"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Apenas letras minúsculas, números, hífens e underscores
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Descrição Completa
                </label>
                <textarea
                  value={codeForm.descricao}
                  onChange={e => setCodeForm({ ...codeForm, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] text-sm"
                  placeholder="Ex: Campanha Dia dos Pais – Público masculino 35-50 anos – Google Search Nordeste"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Seja detalhado — essa descrição é o valor real do código na análise
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria</label>
                <select
                  value={codeForm.categoria}
                  onChange={e => setCodeForm({ ...codeForm, categoria: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#085ba7] text-sm"
                >
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Ajuda a filtrar códigos ao montar os parâmetros UTM
                </p>
              </div>

              {/* Preview */}
              {codeForm.codigo && codeForm.descricao && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-[#085ba7] mb-2">Pré-visualização</p>
                  <div className="flex items-start gap-3">
                    <code className="text-sm font-bold text-[#085ba7] bg-white border border-blue-200 px-3 py-1 rounded-lg font-mono">
                      {codeForm.codigo}
                    </code>
                    <p className="text-sm text-slate-700 leading-relaxed">{codeForm.descricao}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCodeForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm">
                  Cancelar
                </button>
                <button
                  onClick={saveCode}
                  disabled={savingCode || !codeForm.codigo || !codeForm.descricao}
                  className="flex-1 px-4 py-2.5 bg-[#ff901c] text-white rounded-lg hover:bg-[#e58318] font-semibold text-sm disabled:opacity-50"
                >
                  {savingCode ? "Salvando..." : editingCode ? "Atualizar" : "Salvar Código"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
