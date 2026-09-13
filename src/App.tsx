import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  CalendarDays, 
  Users, 
  Menu 
} from 'lucide-react';
import { db } from './services/db';
import { User, Profissional } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { EscalaView } from './components/EscalaView';
import { CalendarioView } from './components/CalendarioView';
import { ProfissionaisView } from './components/ProfissionaisView';
import { SetoresCargosView } from './components/SetoresCargosView';
import { HistoricoView } from './components/HistoricoView';
import { RelatoriosView } from './components/RelatoriosView';
import { UsuariosView } from './components/UsuariosView';
import { AuditoriaView } from './components/AuditoriaView';
import { BackupView } from './components/BackupView';
import { LoginView } from './components/LoginView';
import { ModalAlterarSenha } from './components/Modals';
import { ModalVersao } from './components/ModalVersao';
import { ModalPublicacao } from './components/ModalPublicacao';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TrocasView } from './components/TrocasView';
import { IndisponibilidadesView } from './components/IndisponibilidadesView';
import { PortalColaboradorView } from './components/PortalColaboradorView';
import { getVersionInfo, VersionInfo } from './services/versionService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-10');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [filterSetorEscala, setFilterSetorEscala] = useState<string | undefined>(undefined);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const [isPublicacaoModalOpen, setIsPublicacaoModalOpen] = useState<boolean>(false);
  const [isPWAModalOpen, setIsPWAModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(getVersionInfo());
  const [refreshCount, setRefreshCount] = useState<number>(0);

  // Inicialização e carregamento de sessão
  useEffect(() => {
    db.init();
    const v = getVersionInfo();
    setVersionInfo(v);
    document.title = `Sistema de Gestão e Escala de Plantões Hospitalares - ${v.version}`;

    const sessionUser = db.getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
    } else {
      // Login padrão para facilitar visualização imediata
      const user = db.login('admin', 'esc@l@').user;
      if (user) {
        setCurrentUser(user);
      }
    }

    // Assinatura em tempo real da nuvem (acesso web compartilhado)
    const unsubscribe = db.subscribe(() => {
      setRefreshCount(prev => prev + 1);
      const cur = db.getCurrentUser();
      if (cur) {
        const refreshed = db.getUsers().find(u => u.id === cur.id);
        if (refreshed) setCurrentUser(refreshed);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefreshData = () => {
    setRefreshCount(prev => prev + 1);
    // Atualizar usuário se status mudou
    if (currentUser) {
      const refreshed = db.getUsers().find(u => u.id === currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
    }
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
  };

  // Alternar rapidamente entre ADM e Usuário Padrão para testes de permissão
  const handleSwitchUser = () => {
    const nextRole = currentUser?.tipo_acesso === 'ADM' ? 'padrao' : 'admin';
    const res = db.login(nextRole, 'esc@l@');
    if (res.user) {
      setCurrentUser(res.user);
      // Se era aba administrativa e trocou para padrão, redireciona para dashboard
      if (nextRole === 'padrao' && ['usuarios', 'auditoria', 'backup'].includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  };

  const handleNavigateToEscala = (setorId?: string) => {
    setFilterSetorEscala(setorId);
    setActiveTab('escala');
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Sidebar de Navegação (Gaveta Mobile + Barra Fixa Desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setFilterSetorEscala(undefined);
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        versionInfo={versionInfo}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Superior com Busca e Controles Globais */}
        <Header
          currentUser={currentUser}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          onReloadData={handleRefreshData}
          onSelectProfissional={(prof: Profissional) => {
            setActiveTab('escala');
          }}
          versionInfo={versionInfo}
          onOpenVersionModal={() => setIsVersionModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          onOpenPublicacao={() => setIsPublicacaoModalOpen(true)}
          onOpenPWAInstall={() => setIsPWAModalOpen(true)}
        />

        {/* Indicador Global de Conexão Offline */}
        <OfflineIndicator />

        {/* View Ativa */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              key={`dash-${refreshCount}-${selectedDate}`}
              selectedDate={selectedDate}
              currentUser={currentUser}
              onNavigateToEscala={handleNavigateToEscala}
            />
          )}

          {activeTab === 'portal_colaborador' && (
            <PortalColaboradorView
              key={`portal-${refreshCount}-${selectedDate}`}
              currentUser={currentUser}
              onRefresh={handleRefreshData}
            />
          )}

          {activeTab === 'trocas' && (
            <TrocasView
              key={`trocas-${refreshCount}`}
              currentUser={currentUser}
              onRefresh={handleRefreshData}
            />
          )}

          {activeTab === 'indisponibilidades' && (
            <IndisponibilidadesView
              key={`indisp-${refreshCount}`}
              currentUser={currentUser}
              onRefresh={handleRefreshData}
            />
          )}

          {activeTab === 'escala' && (
            <EscalaView
              key={`escala-${refreshCount}-${selectedDate}-${filterSetorEscala}`}
              selectedDate={selectedDate}
              initialSetorId={filterSetorEscala}
              currentUser={currentUser}
              onRefresh={handleRefreshData}
            />
          )}

          {activeTab === 'calendario' && (
            <CalendarioView
              key={`cal-${refreshCount}-${selectedDate}`}
              currentDate={selectedDate}
            />
          )}

          {activeTab === 'profissionais' && (
            <ProfissionaisView
              key={`prof-${refreshCount}`}
              currentUser={currentUser}
              onRefresh={handleRefreshData}
            />
          )}

          {activeTab === 'setores_cargos' && (
            <SetoresCargosView
              key={`sc-${refreshCount}`}
              currentUser={currentUser}
              onRefresh={handleRefreshData}
            />
          )}

          {activeTab === 'historico' && (
            <HistoricoView
              key={`hist-${refreshCount}`}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'relatorios' && (
            <RelatoriosView
              key={`rel-${refreshCount}-${selectedDate}`}
              currentUser={currentUser}
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'usuarios' && currentUser.tipo_acesso === 'ADM' && (
            <UsuariosView
              key={`usr-${refreshCount}`}
              currentUser={currentUser}
              onRefresh={handleRefreshData}
            />
          )}

          {activeTab === 'auditoria' && currentUser.tipo_acesso === 'ADM' && (
            <AuditoriaView
              key={`audit-${refreshCount}`}
            />
          )}

          {activeTab === 'backup' && currentUser.tipo_acesso === 'ADM' && (
            <BackupView
              key={`bkp-${refreshCount}`}
              currentUser={currentUser}
              onRefreshAll={handleRefreshData}
            />
          )}
        </main>

        {/* Barra de Navegação Inferior Exclusiva para Celular (Mobile Bottom Navigation) */}
        <nav
          id="mobile-bottom-navigation"
          aria-label="Navegação rápida celular"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg"
        >
          <button
            id="mobile-tab-dashboard"
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Painel</span>
          </button>

          <button
            id="mobile-tab-escala"
            onClick={() => { setActiveTab('escala'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] rounded-lg transition-colors ${
              activeTab === 'escala' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Escala</span>
          </button>

          <button
            id="mobile-tab-calendario"
            onClick={() => { setActiveTab('calendario'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] rounded-lg transition-colors ${
              activeTab === 'calendario' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Calendário</span>
          </button>

          <button
            id="mobile-tab-profissionais"
            onClick={() => { setActiveTab('profissionais'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] rounded-lg transition-colors ${
              activeTab === 'profissionais' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Equipe</span>
          </button>

          <button
            id="mobile-tab-menu-mais"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] rounded-lg transition-colors ${
              isMobileMenuOpen ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Mais</span>
          </button>
        </nav>
      </div>

      {/* Modal Global de Alteração de Senha */}
      <ModalAlterarSenha
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          handleRefreshData();
          alert('Senha alterada com sucesso! O aviso de segurança foi removido.');
        }}
      />

      {/* Modal de Informações e Contador de Versão */}
      <ModalVersao
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versionInfo={versionInfo}
        onVersionUpdated={(newInfo) => {
          setVersionInfo(newInfo);
          document.title = `Sistema de Gestão e Escala de Plantões Hospitalares - ${newInfo.version}`;
        }}
        isAdmin={currentUser.tipo_acesso === 'ADM'}
      />

      {/* Modal de Publicação em Outro Endereço Web */}
      <ModalPublicacao
        isOpen={isPublicacaoModalOpen}
        onClose={() => setIsPublicacaoModalOpen(false)}
      />

      {/* Modal de Instalação PWA */}
      <PWAInstallModal
        isOpen={isPWAModalOpen}
        onClose={() => setIsPWAModalOpen(false)}
      />
    </div>
  );
}
