import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Download, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle2,
  FileCode,
  Layers
} from 'lucide-react';
import { db } from '../services/db';

export const AuditoriaView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcao, setFilterAcao] = useState('TODAS');

  const logs = db.getAuditLogs();

  const filteredLogs = logs.filter(log => {
    if (filterAcao !== 'TODAS' && log.acao !== filterAcao) return false;
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      return (
        log.detalhes.toLowerCase().includes(t) ||
        log.usuario_nome.toLowerCase().includes(t) ||
        log.tabela.toLowerCase().includes(t) ||
        log.registro_id.toLowerCase().includes(t)
      );
    }
    return true;
  });

  const handleExportAuditCSV = () => {
    const headers = ['DataHora', 'UsuarioNome', 'UsuarioLogin', 'Acao', 'Tabela', 'RegistroID', 'Detalhes', 'IP'];
    const rows = filteredLogs.map(l => [
      l.data_hora,
      `"${l.usuario_nome}"`,
      l.usuario_login,
      l.acao,
      l.tabela,
      l.registro_id,
      `"${l.detalhes.replace(/"/g, '""')}"`,
      l.ip,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_sistema_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="auditoria-view" className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>TRILHA DE AUDITORIA DO SISTEMA</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro imutável de todas as operações sensíveis, autenticações e modificações operacionais
          </p>
        </div>

        <button
          onClick={handleExportAuditCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        >
          <Download className="w-4 h-4 text-amber-600" />
          <span>Exportar Trilha (CSV)</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por detalhes, operador, tabela, ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterAcao}
            onChange={(e) => setFilterAcao(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none cursor-pointer font-medium"
          >
            <option value="TODAS">Todas as Operações</option>
            <option value="REGISTRO_PRESENCA">REGISTRO_PRESENCA</option>
            <option value="REGISTRO_AUSENCIA">REGISTRO_AUSENCIA</option>
            <option value="REGISTRO_FERIAS">REGISTRO_FERIAS</option>
            <option value="REGISTRO_ATESTADO">REGISTRO_ATESTADO</option>
            <option value="CRIACAO_USUARIO">CRIACAO_USUARIO</option>
            <option value="ALTERACAO_SENHA">ALTERACAO_SENHA</option>
            <option value="REDEFINICAO_SENHA">REDEFINICAO_SENHA</option>
            <option value="CARGA_DEMONSTRACAO">CARGA_DEMONSTRACAO</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
      </div>

      {/* Lista de Auditoria */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-3">Operador / IP</th>
                <th className="py-3 px-3">Ação Executada</th>
                <th className="py-3 px-3">Tabela / Módulo</th>
                <th className="py-3 px-4">Histórico & Detalhes da Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.data_hora}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{log.usuario_nome}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{log.usuario_login} • {log.ip}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {log.acao}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {log.tabela}
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {log.detalhes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
