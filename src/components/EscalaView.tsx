import React, { useState } from 'react';
import { 
  UserCheck, 
  UserX, 
  Palmtree, 
  FileHeart, 
  Filter, 
  Clock, 
  Search, 
  ShieldAlert, 
  Check, 
  Calendar, 
  Info,
  Building,
  Briefcase
} from 'lucide-react';
import { User, Escala, Profissional, Setor, Cargo, SituacaoPlantao } from '../types';
import { db } from '../services/db';
import { ModalAusencia, ModalFerias, ModalAtestado } from './Modals';

interface EscalaViewProps {
  selectedDate: string;
  initialSetorId?: string;
  currentUser: User | null;
  onRefresh: () => void;
}

export const EscalaView: React.FC<EscalaViewProps> = ({
  selectedDate,
  initialSetorId,
  currentUser,
  onRefresh,
}) => {
  const [filterSetor, setFilterSetor] = useState(initialSetorId || 'TODOS');
  const [filterCargo, setFilterCargo] = useState('TODOS');
  const [filterTurno, setFilterTurno] = useState('TODOS');
  const [filterSituacao, setFilterSituacao] = useState('TODOS');
  const [searchName, setSearchName] = useState('');

  // Modais de ação rápida
  const [modalAusenciaOpen, setModalAusenciaOpen] = useState(false);
  const [modalFeriasOpen, setModalFeriasOpen] = useState(false);
  const [modalAtestadoOpen, setModalAtestadoOpen] = useState(false);
  const [selectedEscala, setSelectedEscala] = useState<Escala | null>(null);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.tipo_acesso === 'ADM';

  const setores = db.getSetores().filter(s => s.ativo);
  const cargos = db.getCargos().filter(c => c.ativo);
  const profissionais = db.getProfissionais(currentUser?.tipo_acesso);
  const escalas = db.getEscalas(selectedDate);
  const plantaoRegistros = db.getPlantaoRegistros(selectedDate);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handler de Presença Imediata (Requirement 16)
  const handleMarcarPresente = (escala: Escala) => {
    if (!isAdmin) {
      alert('Acesso negado. Esta função requer privilégios de administrador.');
      return;
    }
    const res = db.registrarPresenca(escala.id);
    if (res.success) {
      showToast('Presença confirmada com sucesso!');
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  // Abrir Modal de Ausência (Requirement 17)
  const handleAbrirAusencia = (escala: Escala, prof: Profissional) => {
    if (!isAdmin) return;
    setSelectedEscala(escala);
    setSelectedProfissional(prof);
    setModalAusenciaOpen(true);
  };

  // Abrir Modal de Férias (Requirement 18)
  const handleAbrirFerias = (prof: Profissional) => {
    if (!isAdmin) return;
    setSelectedProfissional(prof);
    setModalFeriasOpen(true);
  };

  // Abrir Modal de Atestado (Requirement 19)
  const handleAbrirAtestado = (prof: Profissional) => {
    if (!isAdmin) return;
    setSelectedProfissional(prof);
    setModalAtestadoOpen(true);
  };

  // Filtragem da Lista
  const escalasFiltradas = escalas.filter(escala => {
    const prof = profissionais.find(p => p.id === escala.profissional_id);
    if (!prof) return false;

    const reg = plantaoRegistros.find(r => r.escala_id === escala.id);
    const situacao: SituacaoPlantao = reg ? reg.situacao : 'PENDENTE';

    if (filterSetor !== 'TODOS' && escala.setor_id !== filterSetor) return false;
    if (filterCargo !== 'TODOS' && escala.cargo_id !== filterCargo) return false;
    if (filterTurno !== 'TODOS' && escala.turno !== filterTurno) return false;
    if (filterSituacao !== 'TODOS' && situacao !== filterSituacao) return false;

    if (searchName.trim()) {
      const termo = searchName.toLowerCase();
      const matchNome = prof.nome_completo.toLowerCase().includes(termo);
      const matchMat = prof.matricula.toLowerCase().includes(termo);
      if (!matchNome && !matchMat) return false;
    }

    return true;
  });

  const getSituacaoBadge = (situacao: SituacaoPlantao) => {
    switch (situacao) {
      case 'PRESENTE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'AUSENTE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'FÉRIAS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ATESTADO':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'FOLGA':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'PENDENTE':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <div id="escala-view" className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 z-50 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header com Data e Informações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>ESCALA & REGISTRO DIÁRIO DE PLANTÃO</span>
            {!isAdmin && (
              <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Modo Consulta (Somente Leitura)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento pontual de presença e ocorrências por posto • Data: <strong className="text-slate-800">{selectedDate.split('-').reverse().join('/')}</strong>
          </p>
        </div>

        {/* Resumo Rápido da Lista */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
            Exibindo: <strong>{escalasFiltradas.length}</strong> de {escalas.length}
          </span>
        </div>
      </div>

      {/* Barra de Filtros (Requirement 28) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filtros Operacionais</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Busca por Nome/Matrícula */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Filtrar por nome ou matrícula..."
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Filtro Setor */}
          <div>
            <select
              value={filterSetor}
              onChange={(e) => setFilterSetor(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Setores</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>Setor {s.nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro Cargo */}
          <div>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Cargos</option>
              {cargos.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro Turno */}
          <div>
            <select
              value={filterTurno}
              onChange={(e) => setFilterTurno(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Turnos</option>
              <option value="DIURNO">Diurno (07:00 - 19:00)</option>
              <option value="NOTURNO">Noturno (19:00 - 07:00)</option>
              <option value="MANHÃ">Manhã (07:00 - 13:00)</option>
              <option value="TARDE">Tarde (13:00 - 19:00)</option>
            </select>
          </div>

          {/* Filtro Situação */}
          <div>
            <select
              value={filterSituacao}
              onChange={(e) => setFilterSituacao(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer font-medium"
            >
              <option value="TODOS">Todas as Situações</option>
              <option value="PENDENTE">⏳ Pendentes</option>
              <option value="PRESENTE">✅ Presentes</option>
              <option value="AUSENTE">❌ Ausentes</option>
              <option value="FÉRIAS">🌴 Férias</option>
              <option value="ATESTADO">📋 Atestados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Escala & Plantões (Requirement 28 & 29) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Profissional / Matrícula</th>
                <th className="py-3 px-3">Cargo</th>
                <th className="py-3 px-3">Setor</th>
                <th className="py-3 px-3">Horário / Turno</th>
                <th className="py-3 px-3">Situação Atual</th>
                {isAdmin ? (
                  <th className="py-3 px-4 text-center">Registro do Plantão (Ações ADM)</th>
                ) : (
                  <th className="py-3 px-4 text-center">Status</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {escalasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <p className="font-semibold text-sm">Nenhuma escala encontrada</p>
                    <p className="text-[11px] text-slate-400 mt-1">Ajuste os filtros acima ou verifique se há escalas cadastradas para esta data.</p>
                  </td>
                </tr>
              ) : (
                escalasFiltradas.map(escala => {
                  const prof = profissionais.find(p => p.id === escala.profissional_id);
                  const cargo = cargos.find(c => c.id === escala.cargo_id)?.nome;
                  const setor = setores.find(s => s.id === escala.setor_id)?.nome;
                  const reg = plantaoRegistros.find(r => r.escala_id === escala.id);
                  const situacao: SituacaoPlantao = reg ? reg.situacao : 'PENDENTE';

                  if (!prof) return null;

                  return (
                    <tr key={escala.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Profissional */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{prof.nome_completo}</div>
                        <div className="text-[11px] font-mono text-slate-400">Mat: {prof.matricula}</div>
                      </td>

                      {/* Cargo */}
                      <td className="py-3 px-3 text-slate-600">
                        {cargo}
                      </td>

                      {/* Setor */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700">Setor {setor}</span>
                      </td>

                      {/* Horário e Turno */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-700">{escala.hora_inicio} às {escala.hora_fim}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{escala.turno}</div>
                      </td>

                      {/* Situação */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSituacaoBadge(situacao)}`}>
                            {situacao}
                          </span>

                          {/* Campo Sensível Mascarado para Usuário Padrão */}
                          {situacao === 'AUSENTE' && reg?.motivo_ausencia && (
                            isAdmin ? (
                              <span className="text-[10px] text-rose-600 font-medium">Motivo: {reg.motivo_ausencia}</span>
                            ) : null
                          )}

                          {situacao === 'ATESTADO' && (
                            <span className="text-[10px] text-slate-500">
                              {isAdmin ? 'Atestado homologado' : 'Afastamento regular'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ações (ADM: Botões de ação direta / Padrão: Apenas leitura) */}
                      <td className="py-2 px-4 text-center">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-200 shadow-2xs">
                            {/* PRESENTE */}
                            <button
                              id={`btn-presente-${escala.id}`}
                              onClick={() => handleMarcarPresente(escala)}
                              title="Marcar como PRESENTE"
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                                situacao === 'PRESENTE'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200'
                              }`}
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Presente</span>
                            </button>

                            {/* AUSENTE */}
                            <button
                              id={`btn-ausente-${escala.id}`}
                              onClick={() => handleAbrirAusencia(escala, prof)}
                              title="Registrar AUSÊNCIA com motivo"
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                                situacao === 'AUSENTE'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-rose-50 text-rose-700 border border-slate-200'
                              }`}
                            >
                              <UserX className="w-3 h-3" />
                              <span>Ausente</span>
                            </button>

                            {/* FÉRIAS */}
                            <button
                              id={`btn-ferias-${escala.id}`}
                              onClick={() => handleAbrirFerias(prof)}
                              title="Registrar Período de Férias"
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                                situacao === 'FÉRIAS'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-blue-50 text-blue-700 border border-slate-200'
                              }`}
                            >
                              <Palmtree className="w-3 h-3" />
                              <span>Férias</span>
                            </button>

                            {/* ATESTADO */}
                            <button
                              id={`btn-atestado-${escala.id}`}
                              onClick={() => handleAbrirAtestado(prof)}
                              title="Registrar Período de Atestado"
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                                situacao === 'ATESTADO'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-amber-50 text-amber-700 border border-slate-200'
                              }`}
                            >
                              <FileHeart className="w-3 h-3" />
                              <span>Atestado</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Sem permissão de alteração
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      <ModalAusencia
        isOpen={modalAusenciaOpen}
        onClose={() => setModalAusenciaOpen(false)}
        escala={selectedEscala}
        profissional={selectedProfissional}
        onSuccess={() => {
          showToast('Ausência registrada e auditoria gravada!');
          onRefresh();
        }}
      />

      <ModalFerias
        isOpen={modalFeriasOpen}
        onClose={() => setModalFeriasOpen(false)}
        profissional={selectedProfissional}
        onSuccess={() => {
          showToast('Período de férias cadastrado!');
          onRefresh();
        }}
      />

      <ModalAtestado
        isOpen={modalAtestadoOpen}
        onClose={() => setModalAtestadoOpen(false)}
        profissional={selectedProfissional}
        onSuccess={() => {
          showToast('Período de atestado cadastrado!');
          onRefresh();
        }}
      />
    </div>
  );
};
