import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  History, 
  ShieldAlert, 
  UserCog, 
  HardDrive, 
  LogOut, 
  KeyRound,
  ShieldCheck,
  UserCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onSwitchUser: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenChangePassword,
  onSwitchUser,
}) => {
  const isAdmin = currentUser?.tipo_acesso === 'ADM';

  const menuGeral = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'escala', label: 'Escala Diária', icon: Clock },
    { id: 'calendario', label: 'Calendário', icon: CalendarDays },
    { id: 'profissionais', label: 'Profissionais', icon: Users },
    { id: 'setores_cargos', label: 'Setores e Cargos', icon: Building2 },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
  ];

  const menuAdmin = [
    { id: 'usuarios', label: 'Usuários', icon: UserCog },
    { id: 'auditoria', label: 'Auditoria', icon: ShieldAlert },
    { id: 'backup', label: 'Backup & Dados', icon: HardDrive },
  ];

  return (
    <aside 
      id="sidebar-container" 
      className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-white leading-tight">GESTÃO DE PLANTÕES</h1>
          <p className="text-[11px] text-slate-400">Escala & Monitoramento</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Operacional
          </p>
          <nav className="space-y-1">
            {menuGeral.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Restricted Section */}
        {isAdmin && (
          <div>
            <div className="px-3 flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                Administração (ADM)
              </p>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <nav className="space-y-1">
              {menuAdmin.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400/80'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white truncate max-w-[130px]">
              {currentUser?.nome || 'Usuário'}
            </span>
            <span 
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              }`}
            >
              {currentUser?.tipo_acesso || 'PADRÃO'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-mono mb-2">@{currentUser?.login}</p>

          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
            <button
              id="btn-alterar-senha-sidebar"
              onClick={onOpenChangePassword}
              title="Alterar Minha Senha"
              className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>Senha</span>
            </button>

            <button
              id="btn-switch-user-role"
              onClick={onSwitchUser}
              title="Alternar Perfil para Testes (ADM <-> Padrão)"
              className="flex items-center justify-center p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-logout-sidebar"
              onClick={onLogout}
              title="Encerrar Sessão"
              className="flex items-center justify-center p-1 rounded bg-rose-950/50 hover:bg-rose-900/80 text-rose-400 hover:text-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
