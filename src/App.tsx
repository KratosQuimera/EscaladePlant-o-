import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-10');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [filterSetorEscala, setFilterSetorEscala] = useState<string | undefined>(undefined);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  // Inicialização e carregamento de sessão
  useEffect(() => {
    db.init();
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
      {/* Sidebar de Navegação */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setFilterSetorEscala(undefined);
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onSwitchUser={handleSwitchUser}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
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
        />

        {/* View Ativa */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              key={`dash-${refreshCount}-${selectedDate}`}
              selectedDate={selectedDate}
              currentUser={currentUser}
              onNavigateToEscala={handleNavigateToEscala}
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
    </div>
  );
}
