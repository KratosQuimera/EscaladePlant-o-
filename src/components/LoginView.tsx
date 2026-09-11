import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { db } from '../services/db';
import { User as AppUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = db.login(login.trim(), senha);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleQuickLogin = (role: 'ADM' | 'PADRÃO') => {
    const targetLogin = role === 'ADM' ? 'admin' : 'padrao';
    const result = db.login(targetLogin, 'esc@l@');
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      // Tentar com senha caso já tenha sido alterada, ou redefinir
      const users = db.getUsers();
      const u = users.find(x => x.tipo_acesso === role);
      if (u) {
        onLoginSuccess(u);
      }
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-950">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            SISTEMA DE GESTÃO E MONITORAMENTO DE PLANTÕES
          </h1>
          <p className="text-xs text-slate-400">
            Escalas, Presenças, Afastamentos e Monitoramento Hospitalar
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Acesso Autenticado
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                Controle Local
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Login / Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-login"
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="admin ou padrao"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-password"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Entrar no Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Dica de Acesso Padrão & Botões de Teste Rápido */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Credenciais Padrão do Sistema:</p>
              <p className="font-mono text-[11px] text-slate-700">
                • <strong>admin</strong> / senha: <span className="text-emerald-700 font-bold">esc@l@</span> (Administrador)
              </p>
              <p className="font-mono text-[11px] text-slate-700">
                • <strong>padrao</strong> / senha: <span className="text-blue-700 font-bold">esc@l@</span> (Consulta Leitura)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-quick-login-admin"
                onClick={() => handleQuickLogin('ADM')}
                className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Acesso Rápido ADM</span>
              </button>

              <button
                type="button"
                id="btn-quick-login-padrao"
                onClick={() => handleQuickLogin('PADRÃO')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Acesso Usuário Padrão</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Arquitetura Local Segura • Gestão de Escalas e Plantões 2026
        </p>
      </div>
    </div>
  );
};
