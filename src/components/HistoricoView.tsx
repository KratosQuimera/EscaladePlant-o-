import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  Download, 
  Filter, 
  UserCheck, 
  UserX, 
  Palmtree, 
  FileHeart, 
  Clock,
  Building,
  User as UserIcon
} from 'lucide-react';
import { User, SituacaoPlantao } from '../types';
import { db } from '../services/db';

interface HistoricoViewProps {
  currentUser: User | null;
}

export const HistoricoView: React.FC<HistoricoViewProps> = ({ currentUser }) => {
  const [dataInicio, setDataInicio] = useState('2026-09-01');
  const [dataFim, setDataFim] = useState('2026-09-30');
  const [selectedSetor, setSelectedSetor] = useState('TODOS');
  const [selectedProfissional, setSelectedProfissional] = useState('TODOS');
  const [selectedSituacao, setSelectedSituacao] = useState('TODOS');

  const isAdmin = currentUser?.tipo_acesso === 'ADM';

  const setores = db.getSetores();
  const cargos = db.getCargos();
  const profissionais = db.getProfissionais(currentUser?.tipo_acesso);
  const escalas = db.getEscalas();
  const registros = db.getPlantaoRegistros();

  // Junção histórica
  const historicoCompleto = escalas
    .filter(e => e.data >= dataInicio && e.data <= dataFim)
    .map(e => {
      const prof = profissionais.find(p => p.id === e.profissional_id);
      const reg = registros.find(r => r.escala_id === e.id);
      const situacao: SituacaoPlantao = reg ? reg.situacao : 'PENDENTE';
      const setor = setores.find(s => s.id === e.setor_id);
      const cargo = cargos.find(c => c.id === e.cargo_id);

      return {
        id: e.id,
        data: e.data,
        turno: e.turno,
        hora_inicio: e.hora_inicio,
        hora_fim: e.hora_fim,
        profissional_id: e.profissional_id,
        profissional_nome: prof?.nome_completo || 'Desconhecido',
        matricula: prof?.matricula || '-',
        setor_id: e.setor_id,
        setor_nome: setor?.nome || '-',
        cargo_nome: cargo?.nome || '-',
        situacao,
        motivo_ausencia: reg?.motivo_ausencia,
        observacao_ausencia: reg?.observacao,
        registrado_por: reg?.registrado_por || '-',
        horario_registro: reg?.horario_registro || '-',
      };
    })
    .filter(item => {
      if (selectedSetor !== 'TODOS' && item.setor_id !== selectedSetor) return false;
      if (selectedProfissional !== 'TODOS' && item.profissional_id !== selectedProfissional) return false;
      if (selectedSituacao !== 'TODOS' && item.situacao !== selectedSituacao) return false;
      return true;
    })
    .sort((a, b) => b.data.localeCompare(a.data));

  const handleExportCSV = () => {
    const headers = ['Data', 'Turno', 'Profissional', 'Matricula', 'Cargo', 'Setor', 'Situacao', 'Motivo', 'RegistradoPor', 'HorarioRegistro'];
    const rows = historicoCompleto.map(i => [
      i.data,
      i.turno,
      `"${i.profissional_nome}"`,
      i.matricula,
      `"${i.cargo_nome}"`,
      `"${i.setor_nome}"`,
      i.situacao,
      `"${i.motivo_ausencia || ''}"`,
      i.registrado_por,
      i.horario_registro,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historico_plantoes_${dataInicio}_a_${dataFim}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="historico-view" className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <span>HISTÓRICO COMPLETO DE PLANTÕES</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico inalterável de escalas, presenças, ausências e afastamentos
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors w-full sm:w-auto min-h-[38px] sm:min-h-0"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Exportar Dados (CSV)</span>
        </button>
      </div>

      {/* Painel de Filtros de Período e Entidades */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filtros de Período e Entidades</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Setor</label>
            <select
              value={selectedSetor}
              onChange={(e) => setSelectedSetor(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Setores</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>Setor {s.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Profissional</label>
            <select
              value={selectedProfissional}
              onChange={(e) => setSelectedProfissional(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Profissionais</option>
              {profissionais.map(p => (
                <option key={p.id} value={p.id}>{p.nome_completo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Situação</label>
            <select
              value={selectedSituacao}
              onChange={(e) => setSelectedSituacao(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none cursor-pointer font-semibold"
            >
              <option value="TODOS">Todas as Situações</option>
              <option value="PRESENTE">Presentes</option>
              <option value="AUSENTE">Ausentes</option>
              <option value="FÉRIAS">Férias</option>
              <option value="ATESTADO">Atestados</option>
              <option value="PENDENTE">Pendentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* VISUALIZAÇÃO MOBILE (md:hidden) */}
      <div className="md:hidden space-y-3">
        {historicoCompleto.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Nenhum registro encontrado no intervalo selecionado.
          </div>
        ) : (
          historicoCompleto.map(item => (
            <div 
              key={`mobile-hist-${item.id}`}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.profissional_nome}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-400">Mat: {item.matricula}</span>
                    <span>•</span>
                    <span>{item.cargo_nome}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                  item.situacao === 'PRESENTE' ? 'bg-emerald-100 text-emerald-800' :
                  item.situacao === 'AUSENTE' ? 'bg-rose-100 text-rose-800' :
                  item.situacao === 'FÉRIAS' ? 'bg-blue-100 text-blue-800' :
                  item.situacao === 'ATESTADO' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.situacao}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Data & Turno</span>
                  <span className="font-semibold text-slate-800">{item.data.split('-').reverse().join('/')}</span>
                  <span className="text-slate-500 text-[11px] block">{item.turno} ({item.hora_inicio}-{item.hora_fim})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Setor Hospitalar</span>
                  <span className="font-semibold text-slate-800">Setor {item.setor_nome}</span>
                </div>
              </div>

              {(item.motivo_ausencia || item.observacao_ausencia) && (
                <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                  <span className="font-semibold">Ocorrência:</span> {item.motivo_ausencia || item.observacao_ausencia}
                </div>
              )}

              {item.registrado_por && item.registrado_por !== '-' && (
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Registrado por: <strong className="text-slate-600">{item.registrado_por}</strong></span>
                  {item.horario_registro && item.horario_registro !== '-' && <span>{item.horario_registro}</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Tabela do Histórico DESKTOP */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Data / Turno</th>
                <th className="py-3 px-3">Profissional</th>
                <th className="py-3 px-3">Cargo / Setor</th>
                <th className="py-3 px-3">Situação</th>
                <th className="py-3 px-3">Ocorrência / Motivo</th>
                <th className="py-3 px-4 text-right">Auditoria (Registro)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historicoCompleto.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Nenhum registro encontrado no intervalo selecionado.
                  </td>
                </tr>
              ) : (
                historicoCompleto.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{item.data.split('-').reverse().join('/')}</span>
                      <div className="text-[10px] text-slate-500 uppercase">{item.turno} ({item.hora_inicio}-{item.hora_fim})</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{item.profissional_nome}</div>
                      <div className="text-[11px] font-mono text-slate-400">Mat: {item.matricula}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-700 font-medium">{item.cargo_nome}</div>
                      <div className="text-[11px] text-slate-500">Setor {item.setor_nome}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.situacao === 'PRESENTE' ? 'bg-emerald-100 text-emerald-800' :
                        item.situacao === 'AUSENTE' ? 'bg-rose-100 text-rose-800' :
                        item.situacao === 'FÉRIAS' ? 'bg-blue-100 text-blue-800' :
                        item.situacao === 'ATESTADO' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.situacao}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {item.motivo_ausencia ? (
                        <div>
                          <span className="font-medium text-rose-700">{item.motivo_ausencia}</span>
                          {isAdmin && item.observacao_ausencia && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.observacao_ausencia}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right text-[11px] text-slate-500">
                      <div className="font-mono text-slate-700">{item.registrado_por}</div>
                      <div className="text-[10px] text-slate-400">{item.horario_registro}</div>
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
