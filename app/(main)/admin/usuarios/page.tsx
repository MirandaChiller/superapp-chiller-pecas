"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2, X, Eye, EyeOff, Users, Mail, Calendar, RefreshCw } from "lucide-react";

interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata: { nome?: string };
}

const emptyForm = { nome: "", email: "", password: "" };

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  // Scroll lock when modal open
  useEffect(() => {
    const anyOpen = showForm || !!confirmDelete;
    document.body.classList.toggle("modal-open", anyOpen);
    return () => document.body.classList.remove("modal-open");
  }, [showForm, confirmDelete]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/list-users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.sort((a: SupabaseUser, b: SupabaseUser) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar usuário");
      } else {
        setSuccess(`Usuário ${form.email} criado com sucesso!`);
        setForm(emptyForm);
        setShowForm(false);
        loadUsers();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: SupabaseUser) {
    setDeletingId(user.id);
    setError("");
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao remover usuário");
      } else {
        setSuccess(`Usuário ${user.email} removido.`);
        setConfirmDelete(null);
        loadUsers();
      }
    } finally {
      setDeletingId(null);
    }
  }

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Usuários
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie quem tem acesso ao Superapp</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Novo usuário
          </button>
        </div>
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess("")}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* User list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">Nenhum usuário cadastrado</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Nome / E-mail</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Criado em</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Último acesso</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {u.user_metadata?.nome || <span className="text-slate-400 italic">Sem nome</span>}
                    </div>
                    <div className="text-slate-500 flex items-center gap-1 text-xs mt-0.5">
                      <Mail className="w-3 h-3" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fmtDate(u.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {fmtDate(u.last_sign_in_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmDelete(u)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remover usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create user modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Novo usuário
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  placeholder="Ex: Ana Lima"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="usuario@chillerpeças.com.br"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Senha <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Criando..." : "Criar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Remover usuário</h2>
            <p className="text-slate-600 text-sm mb-1">Tem certeza que deseja remover:</p>
            <p className="font-semibold text-slate-800 text-sm mb-4">{confirmDelete.email}</p>
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
              Esta ação não pode ser desfeita. O usuário perderá o acesso imediatamente.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
