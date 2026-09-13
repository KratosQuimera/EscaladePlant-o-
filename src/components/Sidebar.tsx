import React from 'react';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  UserCheck,
  ArrowLeftRight,
  CalendarOff,
  Users,
  Building2,
  History,
  FileText,
  UserCog,
  ShieldAlert,
  HardDrive,
  BookOpen,
  LogOut,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  X,
  Stethoscope
} from 'lucide-react';
import { User } from '../types';
import { VersionInfo } from '../services/versionService';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onSwitchUser: () => void;
  versionInfo?: VersionInfo;
  onOpenVersionModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenChangePassword,
  onSwitchUser,
  versionInfo,
  onOpenVersionModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const isAdmin = currentUser?.tipo_acesso === 'ADM';
  const isGestor = currentUser?.tipo_acesso === 'GESTOR';
  const isPadrao = !isAdmin && !isGestor;

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Itens de menu para PLANTONISTA / USUÁRIO PADRÃO
  const menuPlantonista = [
    { id: 'portal_colaborador', label: 'Portal do Colaborador', icon: UserCheck, badge: 'Meu Plantão' },
    { id: 'trocas', label: 'Trocas & Permutas', icon: ArrowLeftRight },
    { id: 'indisponibilidades', label: 'Minhas Indisponibilidades', icon: CalendarOff },
    { id: 'escala', label: 'Escala Diária (Consulta)', icon: Clock },
    { id: 'calendario', label: 'Calendário Mensal', icon: CalendarDays },
    { id: 'profissionais', label: 'Equipe Hospitalar', icon: Users },
    { id: 'manual', label: 'Manual & Ajuda', icon: BookOpen, badge: 'Guia' },
  ];

  // Itens de menu para GESTOR / COORDENAÇÃO
  const menuGestor = [
    { id: 'dashboard', label: 'Dashboard Operacional', icon: LayoutDashboard },
    { id: 'escala', label: 'Escala Diária', icon: Clock },
    { id: 'calendario', label: 'Calendário de Plantões', icon: CalendarDays },
    { id: 'trocas', label: 'Trocas & Permutas', icon: ArrowLeftRight, badge: 'Homologar' },
    { id: 'indisponibilidades', label: 'Indisponibilidades Equipe', icon: CalendarOff },
    { id: 'portal_colaborador', label: 'Portal do Colaborador', icon: UserCheck },
    { id: 'profissionais', label: 'Profissionais', icon: Users },
    { id: 'setores_cargos', label: 'Setores e Cargos', icon: Building2 },
    { id: 'historico', label: 'Histórico de Ocorrências', icon: History },
    { id: 'relatorios', label: 'Relatórios & Atestados', icon: FileText },
    { id: 'manual', label: 'Manual & Ajuda', icon: BookOpen },
  ];

  // Itens de menu para ADMINISTRADOR (ADM)
  const menuAdminGeral = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'escala', label: 'Escala Diária', icon: Clock },
    { id: 'calendario', label: 'Calendário', icon: CalendarDays },
    { id: 'portal_colaborador', label: 'Portal do Colaborador', icon: UserCheck, badge: 'Plantões' },
    { id: 'trocas', label: 'Trocas & Permutas', icon: ArrowLeftRight },
    { id: 'indisponibilidades', label: 'Indisponibilidades', icon: CalendarOff },
    { id: 'profissionais', label: 'Profissionais', icon: Users },
    { id: 'setores_cargos', label: 'Setores e Cargos', icon: Building2 },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'manual', label: 'Manual & Ajuda', icon: BookOpen, badge: 'Docs' },
  ];

  const menuAdminExclusivo = [
    { id: 'usuarios', label: 'Gestão de Usuários', icon: UserCog },
    { id: 'auditoria', label: 'Auditoria & Logs', icon: ShieldAlert },
    { id: 'backup', label: 'Backup & Restauração', icon: HardDrive },
  ];

  const menuItems = isPadrao ? menuPlantonista : isGestor ? menuGestor : menuAdminGeral;

  return (
    <>
      {/* Backdrop para fechamento ao clicar fora no celular */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside 
        id="sidebar-container" 
        className={`w-72 md:w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-tight">GESTÃO DE PLANTÕES</h1>
              <p className="text-[11px] text-slate-400">Escala & Monitoramento</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Contador / Indicador de Versão Oficial */}
            <button
              id="btn-version-badge-sidebar"
              onClick={onOpenVersionModal}
              title="Ver detalhes da versão e contador"
              className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-[10px] font-mono font-bold tracking-wider transition-all shrink-0 cursor-pointer"
            >
              {versionInfo?.version || 'V12.0'}
            </button>

            {/* Botão de Fechar no Celular */}
            <button
              id="btn-close-sidebar-mobile"
              onClick={onCloseMobile}
              aria-label="Fechar menu"
              className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div>
            <div className="px-3 flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isPadrao ? 'Área do Plantonista' : isGestor ? 'Gestão da Equipe' : 'Operacional'}
              </p>
              {isPadrao && <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />}
            </div>

            <nav className="space-y-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${
                        isActive ? 'bg-white/25 text-white' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Seção Exclusiva para ADM */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="px-3 flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Administração (ADM)
                </p>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <nav className="space-y-1">
                {menuAdminExclusivo.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-btn-${item.id}`}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-sm font-bold'
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

        {/* Rodapé com Cartão do Usuário Logado */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[130px]">
                {currentUser?.nome || 'Usuário'}
              </span>
              <span 
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isAdmin 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : isGestor 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isAdmin ? '👑 ADM' : isGestor ? '📋 GESTOR' : '🩺 PLANTONISTA'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-mono mb-2.5">@{currentUser?.login}</p>

            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800">
              <button
                id="btn-alterar-senha-sidebar"
                onClick={onOpenChangePassword}
                title="Alterar Minha Senha"
                className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-slate-400" />
                <span>Senha</span>
              </button>

              <button
                id="btn-switch-user-role"
                onClick={onSwitchUser}
                title="Alternar Perfil para Testes (ADM ↔ GESTOR ↔ PLANTONISTA)"
                className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                id="btn-logout-sidebar"
                onClick={onLogout}
                title="Encerrar Sessão (Voltar à tela de login)"
                className="flex items-center justify-center p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Versão e Status do Sistema */}
          <div 
            onClick={onOpenVersionModal}
            className="mt-2 flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-300 px-1 font-mono cursor-pointer transition-colors"
            title="Clique para gerenciar ou visualizar detalhes da versão"
          >
            <span>Sistema de Plantões</span>
            <span className="text-emerald-400 font-bold">{versionInfo?.version || 'V12.0'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
