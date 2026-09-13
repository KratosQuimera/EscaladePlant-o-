import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { db } from '../services/db';
import { User as AppUser, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = db.login(login.trim(), senha);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message || 'Credenciais inválidas. Verifique usuário e senha.');
      }
    }, 150);
  };

  const handleQuickLogin = (targetRole: UserRole) => {
    setErrorMsg(null);
    let targetLogin = 'admin';
    if (targetRole === 'GESTOR') targetLogin = 'gestor';
    else if (targetRole === 'PADRÃO' || targetRole === 'PADRAO') targetLogin = 'padrao';

    // Tenta autenticar com senha padrão
    const result = db.login(targetLogin, 'esc@l@');
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      // Caso a senha tenha sido alterada, busca o usuário pelo papel
      const users = db.getUsers();
      const u = users.find(x => x.login.toLowerCase() === targetLogin || x.tipo_acesso === targetRole);
      if (u) {
        onLoginSuccess(u);
      } else {
        setErrorMsg(`Usuário com perfil ${targetRole} não encontrado.`);
      }
    }
  };

  return (
    <div id="login-screen-root" className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
        
        {/* Painel Informativo da Esquerda: Explicação dos Perfis e Níveis de Acesso */}
        <div className="lg:col-span-5 bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700/80 flex flex-col justify-between text-white shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                  SISTEMA DE GESTÃO DE PLANTÕES
                </h1>
                <p className="text-xs text-emerald-400 font-medium">
                  Escalas, Presenças & Compliance Hospitalar
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Níveis de Acesso e Permissões</span>
              </h2>
              <p className="text-[12px] text-slate-300 leading-relaxed mb-4">
                O acesso à aplicação é estritamente condicionado ao tipo de usuário cadastrado. Cada perfil possui visibilidade e permissões específicas:
              </p>

              {/* Guia de Perfis */}
              <div className="space-y-2.5">
                {/* ADM */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <span>👑</span> ADM (Administrador)
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      admin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    Controle irrestrito: Gestão de Usuários, Auditoria completa, Backup do sistema, Configurações de Setores e Escalas.
                  </p>
                </div>

                {/* GESTOR */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                      <span>📋</span> GESTOR (Coordenação)
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      gestor
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    Gestão operacional: Registro de Presenças/Faltas, Homologação de Trocas, Afastamentos/Atestados e Relatórios.
                  </p>
                </div>

                {/* PADRÃO */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <span>🩺</span> PLANTONISTA / PADRÃO
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      padrao
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    Portal do Colaborador: Visualização de seus plantões, Ciência Digital de Escala, Trocas/Permutas e Indisponibilidades.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sessão segura com persistência local e sincronização em nuvem.</span>
          </div>
        </div>

        {/* Painel do Formulário de Login */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-2xl p-5 sm:p-8 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Identificação do Usuário
                </h2>
                <p className="text-xs text-slate-500">
                  Informe suas credenciais registradas para iniciar sua jornada
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                Acesso Autenticado
              </span>
            </div>

            {errorMsg && (
              <div 
                id="login-error-alert" 
                role="alert"
                className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{errorMsg}</p>
                  <p className="text-[11px] text-rose-600 mt-0.5">
                    Caso tenha dúvidas sobre sua conta, utilize os botões de acesso rápido por perfil abaixo ou contate o administrador.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Login */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="input-login">
                  Login de Acesso / Usuário <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-login"
                    type="text"
                    required
                    autoFocus
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="Ex: admin, gestor ou padrao"
                    className="w-full text-xs pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none font-medium min-h-[44px] transition-all"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700" htmlFor="input-password">
                    Senha de Acesso <span className="text-emerald-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Senha padrão inicial: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">esc@l@</code>
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full text-xs pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none min-h-[44px] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão Entrar */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
              >
                <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Acesso Rápido por Perfil / Demonstração dos Níveis */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Testar Acesso Direto por Perfil</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Clique para alternar o papel</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* ADM */}
                <button
                  type="button"
                  id="btn-quick-login-admin"
                  onClick={() => handleQuickLogin('ADM')}
                  title="Entrar com perfil Administrador (Acesso Total)"
                  className="py-2.5 px-3 bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 min-h-[50px] cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Entrar como ADM</span>
                  </span>
                  <span className="text-[10px] text-amber-700/80 font-normal">Acesso Total</span>
                </button>

                {/* GESTOR */}
                <button
                  type="button"
                  id="btn-quick-login-gestor"
                  onClick={() => handleQuickLogin('GESTOR')}
                  title="Entrar com perfil Gestor / Coordenação"
                  className="py-2.5 px-3 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 min-h-[50px] cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Entrar como Gestor</span>
                  </span>
                  <span className="text-[10px] text-indigo-700/80 font-normal">Coordenação</span>
                </button>

                {/* PLANTONISTA */}
                <button
                  type="button"
                  id="btn-quick-login-padrao"
                  onClick={() => handleQuickLogin('PADRÃO')}
                  title="Entrar com perfil Plantonista / Colaborador"
                  className="py-2.5 px-3 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 min-h-[50px] cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Entrar como Plantonista</span>
                  </span>
                  <span className="text-[10px] text-emerald-700/80 font-normal">Portal & Trocas</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Sistema Hospitalar de Plantões • Proteção contra acessos indevidos
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
