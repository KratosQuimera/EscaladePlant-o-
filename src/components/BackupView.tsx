import React, { useState, useRef } from 'react';
import { 
  HardDrive, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2,
  Database,
  Sparkles
} from 'lucide-react';
import { db } from '../services/db';
import { User } from '../types';

interface BackupViewProps {
  currentUser: User | null;
  onRefreshAll: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  currentUser,
  onRefreshAll,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    const backupJson = db.exportFullBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_plantoes_hospital_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback('Backup exportado com sucesso em arquivo seguro JSON/SQLite.');
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = db.importFullBackup(content, currentUser?.login || 'admin');
        if (res.success) {
          setFeedback(res.message);
          onRefreshAll();
          setTimeout(() => setFeedback(null), 4000);
        } else {
          setErrorMsg(res.message);
        }
      } catch (err: any) {
        setErrorMsg('Erro ao ler o arquivo de backup: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRecarregarDemo = () => {
    if (window.confirm('Deseja recarregar os dados de demonstração (30 profissionais com escalas completas para Setembro 2026)?')) {
      const res = db.carregarDadosDemonstracao(currentUser?.login || 'admin');
      setFeedback(res.message);
      onRefreshAll();
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div id="backup-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-amber-600" />
          <span>BACKUP, RESTAURAÇÃO & GESTÃO DA BASE DE DADOS</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Ferramentas administrativas de salvaguarda, restauração e exportação de dados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Exportação de Backup */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Backup Completo</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gera uma cópia fiel e consolidada de todas as tabelas: Usuários, Profissionais, Setores, Cargos, Escalas, Registros de Plantões, Férias, Atestados e Histórico de Auditoria.
          </p>
          <div className="pt-2">
            <button
              id="btn-exportar-backup"
              onClick={handleExportBackup}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Backup Completo (.JSON / Dump)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Restauração de Backup */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Restaurar Sistema a Partir de Backup</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Carrega um arquivo de backup previamente exportado. O sistema valida a integridade do arquivo antes de aplicar a restauração.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
              id="file-input-backup"
            />
            <button
              id="btn-importar-backup"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Selecionar Arquivo e Restaurar</span>
            </button>
          </div>
        </div>

        {/* Card 3: Carga de Demonstração */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Dados de Demonstração (Ambiente de Testes)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Preenche o banco com 30 profissionais distribuídos nos setores (5°A a 7°B), com médicos especialistas, enfermeiros, técnicos, e escalas de Setembro de 2026 com plantões marcados, férias e atestados.
          </p>
          <div className="pt-2">
            <button
              id="btn-recarregar-demo"
              onClick={handleRecarregarDemo}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Carregar Dados Demonstrativos</span>
            </button>
          </div>
        </div>

        {/* Card 4: Informações do Banco Local */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Database className="w-4 h-4 text-slate-600" />
            <span>Informações de Armazenamento Local</span>
          </div>
          <p>
            Persistência em execução: <strong>Armazenamento Local Autônomo com Estrutura Relacional Simil-SQLite</strong>.
          </p>
          <p>
            • Chave de armazenamento: <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border">sistema_plantoes_db_v1</code>
          </p>
          <p>
            • Não há envio de dados médicos sensíveis para servidores externos ou nuvem de terceiros.
          </p>
          <p>
            • Atende integralmente aos requisitos de isolamento local sem terminais abertos para o usuário.
          </p>
        </div>
      </div>
    </div>
  );
};
