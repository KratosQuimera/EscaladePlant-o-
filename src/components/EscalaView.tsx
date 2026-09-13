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
  Briefcase,
  ChevronDown,
  ChevronUp,
  X,
  Share2,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { User, Escala, Profissional, Setor, Cargo, SituacaoPlantao } from '../types';
import { db } from '../services/db';
import { ModalAusencia, ModalFerias, ModalAtestado } from './Modals';
import { ModalDisparoWhatsApp } from './ModalDisparoWhatsApp';
import { ModalSolicitarTroca } from './ModalSolicitarTroca';
import { complianceService, ComplianceAlert } from '../services/complianceService';

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modais de ação rápida
  const [modalAusenciaOpen, setModalAusenciaOpen] = useState(false);
  const [modalFeriasOpen, setModalFeriasOpen] = useState(false);
  const [modalAtestadoOpen, setModalAtestadoOpen] = useState(false);
  const [modalDisparoOpen, setModalDisparoOpen] = useState(false);
  const [modalTrocaOpen, setModalTrocaOpen] = useState(false);
  const [trocaEscalaOrigem, setTrocaEscalaOrigem] = useState<Escala | null>(null);
  const [showComplianceDetails, setShowComplianceDetails] = useState(false);

  const [selectedEscala, setSelectedEscala] = useState<Escala | null>(null);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.tipo_acesso === 'ADM';

  const setores = db.getSetores().filter(s => s.ativo);
  const cargos = db.getCargos().filter(c => c.ativo);
  const profissionais = db.getProfissionais(currentUser?.tipo_acesso);
  const escalas = db.getEscalas(selectedDate);
  const plantaoRegistros = db.getPlantaoRegistros(selectedDate);

  // Análise de Compliance e Regras Trabalhistas
  const todasEscalas = db.getEscalas();
  const afastamentos = db.getAfastamentos();
  const indisponibilidades = db.getIndisponibilidades();
  const todosAlertasCompliance = complianceService.analisarComplianceEscalas(
    todasEscalas,
    profissionais,
    afastamentos,
    indisponibilidades
  );

  // Alertas que afetam a data atual
  const alertasData = todosAlertasCompliance.filter(a => a.data_escala === selectedDate);

  // Contadores para chips rápidos de situação
  const totalEscalasCount = escalas.length;
  const countPendentes = escalas.filter(e => {
    const r = plantaoRegistros.find(pr => pr.escala_id === e.id);
    return !r || r.situacao === 'PENDENTE';
  }).length;
  const countPresentes = plantaoRegistros.filter(r => r.situacao === 'PRESENTE').length;
  const countAusentes = plantaoRegistros.filter(r => r.situacao === 'AUSENTE').length;
  const countFerias = plantaoRegistros.filter(r => r.situacao === 'FÉRIAS').length;
  const countAtestados = plantaoRegistros.filter(r => r.situacao === 'ATESTADO').length;

  const hasAdvancedFilters = filterSetor !== 'TODOS' || filterCargo !== 'TODOS' || filterTurno !== 'TODOS';

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
    <div id="escala-view" className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
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
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
            <span>ESCALA & REGISTRO DIÁRIO DE PLANTÃO</span>
            {!isAdmin && (
              <span className="text-[10px] sm:text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Modo Consulta (Somente Leitura)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento pontual de presença e ocorrências por posto • Data: <strong className="text-slate-800">{selectedDate.split('-').reverse().join('/')}</strong>
          </p>
        </div>

        {/* Ações e Resumo do Header */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Disparo WhatsApp */}
          <button
            id="btn-disparo-whatsapp"
            onClick={() => setModalDisparoOpen(true)}
            title="Enviar escalas para o WhatsApp dos profissionais"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Disparo WhatsApp</span>
          </button>

          {/* Botão de Solicitar Troca */}
          <button
            id="btn-solicitar-troca-header"
            onClick={() => {
              setTrocaEscalaOrigem(null);
              setModalTrocaOpen(true);
            }}
            title="Solicitar troca ou permuta de plantão"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Solicitar Troca</span>
          </button>

          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs text-xs font-semibold text-slate-700">
            Exibindo: <strong>{escalasFiltradas.length}</strong> de {escalas.length}
          </span>
        </div>
      </div>

      {/* Painel de Validação de Regras Trabalhistas (Compliance) */}
      <div className={`rounded-xl border p-3.5 transition-all ${
        alertasData.length > 0 
          ? 'bg-amber-50/70 border-amber-300 text-amber-950' 
          : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2.5">
            {alertasData.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs">
                  {alertasData.length > 0 
                    ? `Atenção: ${alertasData.length} Regra(s) Trabalhista(s) Exigem Revisão nesta Data`
                    : '100% em Conformidade Trabalhista'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  alertasData.length > 0 ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-200/80 text-emerald-900'
                }`}>
                  {alertasData.length > 0 ? `${alertasData.length} Alertas` : 'Conforme'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {alertasData.length > 0
                  ? 'Foram identificadas escalas que podem violar intervalo de 11h interjornada, afastamentos legais ou indisponibilidades.'
                  : 'Nenhum conflito de interjornada (11h), atestado, férias ou indisponibilidade detectado para esta data.'}
              </p>
            </div>
          </div>

          {alertasData.length > 0 && (
            <button
              onClick={() => setShowComplianceDetails(prev => !prev)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white/80 hover:bg-white text-amber-900 border border-amber-300 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <span>{showComplianceDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
              {showComplianceDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Lista expansível de inconformidades */}
        {showComplianceDetails && alertasData.length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Ocorrências Detectadas na Data ({selectedDate.split('-').reverse().join('/')}):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {alertasData.map((alerta, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-lg border text-xs ${
                    alerta.severidade === 'CRITICO'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-amber-100/50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold">{alerta.profissional_nome}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      alerta.severidade === 'CRITICO' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {alerta.tipo.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">{alerta.mensagem}</p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    💡 Sugestão: {alerta.sugestao}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros (Requirement 28) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 shadow-2xs space-y-3">
        {/* Topo dos Filtros com Limpeza Rápida */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtros Operacionais</span>
          </div>

          {(searchName || filterSetor !== 'TODOS' || filterCargo !== 'TODOS' || filterTurno !== 'TODOS' || filterSituacao !== 'TODOS') && (
            <button
              onClick={() => {
                setSearchName('');
                setFilterSetor('TODOS');
                setFilterCargo('TODOS');
                setFilterTurno('TODOS');
                setFilterSituacao('TODOS');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Chips de Situação Rápidos (Especialmente úteis no celular com 1 toque) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 text-xs">
          <button
            onClick={() => setFilterSituacao('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] flex items-center gap-1 shrink-0 ${
              filterSituacao === 'TODOS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] opacity-75">({totalEscalasCount})</span>
          </button>

          <button
            onClick={() => setFilterSituacao('PENDENTE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] flex items-center gap-1 shrink-0 ${
              filterSituacao === 'PENDENTE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>⏳ Pendentes</span>
            <span className="text-[10px] opacity-75">({countPendentes})</span>
          </button>

          <button
            onClick={() => setFilterSituacao('PRESENTE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] flex items-center gap-1 shrink-0 ${
              filterSituacao === 'PRESENTE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            <span>✅ Presentes</span>
            <span className="text-[10px] opacity-75">({countPresentes})</span>
          </button>

          <button
            onClick={() => setFilterSituacao('AUSENTE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] flex items-center gap-1 shrink-0 ${
              filterSituacao === 'AUSENTE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
            }`}
          >
            <span>❌ Ausentes</span>
            <span className="text-[10px] opacity-75">({countAusentes})</span>
          </button>

          <button
            onClick={() => setFilterSituacao('FÉRIAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] flex items-center gap-1 shrink-0 ${
              filterSituacao === 'FÉRIAS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
            }`}
          >
            <span>🌴 Férias</span>
            <span className="text-[10px] opacity-75">({countFerias})</span>
          </button>

          <button
            onClick={() => setFilterSituacao('ATESTADO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] flex items-center gap-1 shrink-0 ${
              filterSituacao === 'ATESTADO'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
          >
            <span>📋 Atestados</span>
            <span className="text-[10px] opacity-75">({countAtestados})</span>
          </button>
        </div>

        {/* Campo de Busca Principal (Sempre Visível) */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Filtrar por nome ou matrícula..."
            className="w-full text-xs pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
          />
          {searchName && (
            <button 
              onClick={() => setSearchName('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Toggle para Filtros Avançados no Celular */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold min-h-[40px] transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filtros Específicos (Setor, Cargo, Turno)</span>
              {hasAdvancedFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdowns de Filtro: Expansíveis no celular, Grid no Desktop */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 ${showAdvancedFilters ? 'block' : 'hidden sm:grid'}`}>
          {/* Filtro Setor */}
          <div>
            <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase block mb-1">Setor</label>
            <select
              value={filterSetor}
              onChange={(e) => setFilterSetor(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer min-h-[40px]"
            >
              <option value="TODOS">Todos os Setores</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>Setor {s.nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro Cargo */}
          <div>
            <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase block mb-1">Cargo</label>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer min-h-[40px]"
            >
              <option value="TODOS">Todos os Cargos</option>
              {cargos.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro Turno */}
          <div>
            <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase block mb-1">Turno</label>
            <select
              value={filterTurno}
              onChange={(e) => setFilterTurno(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer min-h-[40px]"
            >
              <option value="TODOS">Todos os Turnos</option>
              <option value="DIURNO">Diurno (07:00 - 19:00)</option>
              <option value="NOTURNO">Noturno (19:00 - 07:00)</option>
              <option value="MANHÃ">Manhã (07:00 - 13:00)</option>
              <option value="TARDE">Tarde (13:00 - 19:00)</option>
            </select>
          </div>

          {/* Filtro Situação (Drop alternativo visível no desktop) */}
          <div className="hidden sm:block">
            <select
              value={filterSituacao}
              onChange={(e) => setFilterSituacao(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer font-medium min-h-[40px]"
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

      {/* VISUALIZAÇÃO 1: CARDS RESPONSIVOS PARA CELULAR (md:hidden) */}
      <div className="md:hidden space-y-3">
        {escalasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <p className="font-semibold text-sm">Nenhuma escala encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros acima ou verifique a data selecionada.</p>
          </div>
        ) : (
          escalasFiltradas.map(escala => {
            const prof = profissionais.find(p => p.id === escala.profissional_id);
            const cargo = cargos.find(c => c.id === escala.cargo_id)?.nome;
            const setor = setores.find(s => s.id === escala.setor_id)?.nome;
            const reg = plantaoRegistros.find(r => r.escala_id === escala.id);
            const situacao: SituacaoPlantao = reg ? reg.situacao : 'PENDENTE';

            if (!prof) return null;

            const alertaProf = todosAlertasCompliance.find(
              a => a.profissional_id === escala.profissional_id && (a.escala_id === escala.id || a.data_escala === escala.data)
            );

            return (
              <div 
                key={`mobile-${escala.id}`}
                className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3"
              >
                {/* Topo do Card: Nome e Situação */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{prof.nome_completo}</h3>
                      {alertaProf && (
                        <span 
                          title={`${alertaProf.tipo}: ${alertaProf.mensagem}`}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Regra
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-[11px] text-slate-400">Mat: {prof.matricula}</span>
                      <span>•</span>
                      <span>{cargo}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border shrink-0 ${getSituacaoBadge(situacao)}`}>
                    {situacao}
                  </span>
                </div>

                {/* Alerta de Compliance Trabalhista Específico */}
                {alertaProf && (
                  <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">{alertaProf.tipo.replace('_', ' ')}:</strong>
                      <span>{alertaProf.mensagem}</span>
                    </div>
                  </div>
                )}

                {/* Dados de Setor e Horário */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Setor</span>
                    <span className="font-bold text-slate-800">Setor {setor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Horário & Turno</span>
                    <span className="font-medium text-slate-800">{escala.hora_inicio} às {escala.hora_fim} ({escala.turno})</span>
                  </div>
                </div>

                {/* Motivos informativos */}
                {situacao === 'AUSENTE' && reg?.motivo_ausencia && (
                  <div className="text-xs bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1.5 rounded-lg">
                    <strong>Motivo:</strong> {isAdmin ? reg.motivo_ausencia : 'Justificativa registrada'}
                  </div>
                )}

                {/* Ação de Troca rápida no Card */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setTrocaEscalaOrigem(escala);
                      setModalTrocaOpen(true);
                    }}
                    className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                    <span>Solicitar Troca deste Plantão</span>
                  </button>
                </div>

                {/* Botões de Ação Touch-Friendly no Celular */}
                {isAdmin && (
                  <div className="pt-1 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ações Rápidas de Registro (ADM)</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* PRESENTE */}
                      <button
                        onClick={() => handleMarcarPresente(escala)}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[42px] transition-all ${
                          situacao === 'PRESENTE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-emerald-50 text-emerald-700 border border-slate-200'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Presente</span>
                      </button>

                      {/* AUSENTE */}
                      <button
                        onClick={() => handleAbrirAusencia(escala, prof)}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[42px] transition-all ${
                          situacao === 'AUSENTE'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-rose-50 text-rose-700 border border-slate-200'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Ausente</span>
                      </button>

                      {/* FÉRIAS */}
                      <button
                        onClick={() => handleAbrirFerias(prof)}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[42px] transition-all ${
                          situacao === 'FÉRIAS'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200'
                        }`}
                      >
                        <Palmtree className="w-3.5 h-3.5" />
                        <span>Férias</span>
                      </button>

                      {/* ATESTADO */}
                      <button
                        onClick={() => handleAbrirAtestado(prof)}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[42px] transition-all ${
                          situacao === 'ATESTADO'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-amber-50 text-amber-700 border border-slate-200'
                        }`}
                      >
                        <FileHeart className="w-3.5 h-3.5" />
                        <span>Atestado</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* VISUALIZAÇÃO 2: TABELA COMPLETA DESKTOP (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
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

                  const alertaProf = todosAlertasCompliance.find(
                    a => a.profissional_id === escala.profissional_id && (a.escala_id === escala.id || a.data_escala === escala.data)
                  );

                  return (
                    <tr key={escala.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Profissional */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">{prof.nome_completo}</span>
                          {alertaProf && (
                            <span 
                              title={`${alertaProf.tipo}: ${alertaProf.mensagem}`}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Regra
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">Mat: {prof.matricula}</div>
                        {alertaProf && (
                          <div className="text-[10px] text-amber-800 mt-0.5 max-w-xs truncate" title={alertaProf.mensagem}>
                            ⚠️ {alertaProf.mensagem}
                          </div>
                        )}
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

                      {/* Ações */}
                      <td className="py-2 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Botão Trocar Plantão */}
                          <button
                            id={`btn-trocar-escala-${escala.id}`}
                            onClick={() => {
                              setTrocaEscalaOrigem(escala);
                              setModalTrocaOpen(true);
                            }}
                            title="Solicitar troca deste plantão"
                            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <ArrowLeftRight className="w-3 h-3 text-blue-600" />
                            <span>Trocar</span>
                          </button>

                          {isAdmin ? (
                            <div className="inline-flex items-center gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200 shadow-2xs">
                              {/* PRESENTE */}
                              <button
                                id={`btn-presente-${escala.id}`}
                                onClick={() => handleMarcarPresente(escala)}
                                title="Marcar como PRESENTE"
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
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
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais de Ausência, Férias e Atestado */}
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

      {/* Modal de Disparo WhatsApp */}
      <ModalDisparoWhatsApp
        isOpen={modalDisparoOpen}
        onClose={() => setModalDisparoOpen(false)}
        defaultDate={selectedDate}
        defaultSetorId={filterSetor !== 'TODOS' ? filterSetor : undefined}
      />

      {/* Modal de Solicitação de Troca de Plantão */}
      <ModalSolicitarTroca
        isOpen={modalTrocaOpen}
        onClose={() => {
          setModalTrocaOpen(false);
          setTrocaEscalaOrigem(null);
        }}
        escalaOrigem={trocaEscalaOrigem || undefined}
        currentUser={currentUser}
        onSuccess={() => {
          showToast('Solicitação de troca cadastrada com sucesso!');
          onRefresh();
        }}
      />
    </div>
  );
};
