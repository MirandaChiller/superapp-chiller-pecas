"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Eye, EyeOff, LogIn, AlertCircle, UserPlus, Check, X,
  User, Mail, Phone, KeyRound, ChevronLeft
} from "lucide-react";

// ── Password strength helpers ────────────────────────────────────────────────
const RULES = [
  { id: "len",     label: "Mínimo 8 caracteres",           test: (p: string) => p.length >= 8 },
  { id: "upper",   label: "Letra maiúscula",                test: (p: string) => /[A-Z]/.test(p) },
  { id: "number",  label: "Número",                         test: (p: string) => /\d/.test(p) },
  { id: "special", label: "Caractere especial (!@#$%...)",  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function passwordStrength(p: string) {
  const passed = RULES.filter(r => r.test(p)).length;
  if (passed <= 1) return { level: 0, label: "Muito fraca",  color: "bg-red-500" };
  if (passed === 2) return { level: 1, label: "Fraca",        color: "bg-orange-400" };
  if (passed === 3) return { level: 2, label: "Boa",          color: "bg-yellow-400" };
  return                  { level: 3, label: "Forte",         color: "bg-green-500" };
}

// ── Phone mask ───────────────────────────────────────────────────────────────
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2)  return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 7)  return d.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

// ── Login form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [checking, setChecking] = useState(true);

  // Login state
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Register state
  const [reg, setReg] = useState({
    nome: "", username: "", email: "", phone: "", password: "", confirm: "",
  });
  const [showRegPwd, setShowRegPwd]         = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regLoading, setRegLoading]         = useState(false);
  const [regError, setRegError]             = useState<string | null>(null);
  const [regSuccess, setRegSuccess]         = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(next);
      else setChecking(false);
    });
  }, [next, router]);

  // ── Login handler ──────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos. Verifique e tente novamente."
          : err.message
      );
      setLoading(false);
    } else {
      router.replace(next);
    }
  }

  // ── Register handler ───────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);

    if (reg.password !== reg.confirm) {
      setRegError("As senhas não coincidem.");
      return;
    }
    const strength = passwordStrength(reg.password);
    if (strength.level < 2) {
      setRegError("A senha não atende aos requisitos mínimos de segurança.");
      return;
    }

    setRegLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: reg.email.trim(),
      password: reg.password,
      options: {
        data: {
          nome:     reg.nome,
          username: reg.username,
          phone:    reg.phone,
        },
      },
    });
    setRegLoading(false);

    if (err) {
      setRegError(
        err.message.includes("already registered")
          ? "Este e-mail já está cadastrado. Tente fazer login."
          : err.message
      );
    } else {
      setRegSuccess(true);
    }
  }

  const strength = passwordStrength(reg.password);
  const rules    = RULES.map(r => ({ ...r, ok: r.test(reg.password) }));

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#085ba7] to-[#108bd1]">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#085ba7] via-[#0a6ec4] to-[#108bd1] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#085ba7] to-[#108bd1] px-8 pt-8 pb-7 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-[#085ba7] font-bold text-2xl">CP</span>
            </div>
            <h1 className="text-xl font-bold text-white">Chiller Peças</h1>
            <p className="text-blue-100 text-xs mt-0.5 font-medium">Marketing Intelligence Platform</p>
          </div>

          {/* ── LOGIN mode ─────────────────────────────────────────────────── */}
          {mode === "login" && (
            <div className="px-8 py-8">
              <h2 className="text-xl font-bold text-slate-900 mb-0.5">Bem-vindo de volta</h2>
              <p className="text-slate-500 text-sm mb-6">Entre com suas credenciais para acessar</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#085ba7] focus:outline-none text-slate-900 font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:border-[#085ba7] focus:outline-none text-slate-900 font-medium transition-colors"
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#ff901c] hover:bg-[#e58318] disabled:opacity-60 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-base">
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Entrando...</>
                  ) : (
                    <><LogIn className="w-5 h-5" /> Entrar</>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-slate-500 text-sm">
                  Ainda não tem conta?{" "}
                  <button onClick={() => { setMode("register"); setError(null); }}
                    className="text-[#085ba7] font-semibold hover:underline">
                    Criar conta
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ── REGISTER mode ──────────────────────────────────────────────── */}
          {mode === "register" && !regSuccess && (
            <div className="px-8 py-8">
              <button onClick={() => { setMode("login"); setRegError(null); }}
                className="flex items-center gap-1 text-slate-500 hover:text-[#085ba7] text-sm font-medium mb-4">
                <ChevronLeft className="w-4 h-4" /> Voltar para login
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-0.5">Criar conta</h2>
              <p className="text-slate-500 text-sm mb-6">Preencha seus dados para solicitar acesso</p>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reg.nome}
                      onChange={e => setReg({ ...reg, nome: e.target.value })}
                      required
                      placeholder="Ana Lima"
                      className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#085ba7] focus:outline-none text-slate-900 font-medium transition-colors"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nome de usuário <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">@</span>
                    <input
                      type="text"
                      value={reg.username}
                      onChange={e => setReg({ ...reg, username: e.target.value.replace(/[^a-z0-9_.]/gi, "").toLowerCase() })}
                      required
                      placeholder="ana.lima"
                      className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#085ba7] focus:outline-none text-slate-900 font-medium transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Apenas letras, números, ponto e underscore</p>
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={reg.email}
                      onChange={e => setReg({ ...reg, email: e.target.value })}
                      required
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#085ba7] focus:outline-none text-slate-900 font-medium transition-colors"
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={reg.phone}
                      onChange={e => setReg({ ...reg, phone: maskPhone(e.target.value) })}
                      placeholder="(11) 99999-9999"
                      className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#085ba7] focus:outline-none text-slate-900 font-medium transition-colors"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPwd ? "text" : "password"}
                      value={reg.password}
                      onChange={e => setReg({ ...reg, password: e.target.value })}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:border-[#085ba7] focus:outline-none text-slate-900 font-medium transition-colors"
                    />
                    <button type="button" onClick={() => setShowRegPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                      {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {reg.password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : "bg-slate-200"}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strength.level >= 3 ? "text-green-600" : strength.level >= 2 ? "text-yellow-600" : "text-red-500"}`}>
                        {strength.label}
                      </p>
                      <ul className="space-y-0.5">
                        {rules.map(r => (
                          <li key={r.id} className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-green-600" : "text-slate-400"}`}>
                            {r.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {r.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirmação */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Confirmar senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegConfirm ? "text" : "password"}
                      value={reg.confirm}
                      onChange={e => setReg({ ...reg, confirm: e.target.value })}
                      required
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-12 py-3 border-2 rounded-xl focus:outline-none text-slate-900 font-medium transition-colors ${
                        reg.confirm && reg.confirm !== reg.password
                          ? "border-red-300 focus:border-red-500"
                          : reg.confirm && reg.confirm === reg.password
                          ? "border-green-400 focus:border-green-500"
                          : "border-slate-200 focus:border-[#085ba7]"
                      }`}
                    />
                    <button type="button" onClick={() => setShowRegConfirm(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                      {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {reg.confirm && reg.confirm !== reg.password && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                  )}
                  {reg.confirm && reg.confirm === reg.password && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Senhas conferem
                    </p>
                  )}
                </div>

                {regError && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{regError}</p>
                  </div>
                )}

                <button type="submit" disabled={regLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#ff901c] hover:bg-[#e58318] disabled:opacity-60 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-base">
                  {regLoading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Criando conta...</>
                  ) : (
                    <><UserPlus className="w-5 h-5" /> Criar conta</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── REGISTER success ───────────────────────────────────────────── */}
          {mode === "register" && regSuccess && (
            <div className="px-8 py-10 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Conta criada!</h2>
              <p className="text-slate-600 text-sm mb-1">
                Enviamos um e-mail de confirmação para <strong>{reg.email}</strong>.
              </p>
              <p className="text-slate-500 text-sm mb-8">
                Verifique sua caixa de entrada e clique no link para ativar seu acesso.
              </p>
              <button
                onClick={() => { setMode("login"); setRegSuccess(false); setReg({ nome: "", username: "", email: "", phone: "", password: "", confirm: "" }); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#085ba7] hover:bg-[#074d8e] text-white font-bold rounded-xl transition-all">
                <LogIn className="w-5 h-5" /> Ir para o login
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-blue-100/70 text-xs mt-6">
          Acesso restrito à equipe Chiller Peças
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#085ba7] to-[#108bd1]">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
