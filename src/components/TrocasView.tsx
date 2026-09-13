import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Gift, 
  HelpCircle, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Calendar, 
  User as UserIcon,
  Building2,
  Sparkles,
  PlusCircle,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { db } from '../services/db';
import { TrocaPlantao, User, StatusTroca } from '../types';
import { ModalSolicitarTroca } from './ModalSolicitarTroca';

interface TrocasViewProps {
  currentUser: User | null;
  onRefresh?: () => void;
}

export const TrocasView: React.FC<TrocasViewProps> = ({ currentUser, onRefresh }) => {
  const [subAba, setSubAba] = useState<'MINHAS' | 'VAGAS' | 'COORDENACAO'>('MINHAS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [isModalNovaTrocaOpen, setIsModalNovaTrocaOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAdmin = currentUser?.tipo_acesso === 'ADM';
  const trocas = db.getTrocas();
  const profissionais = db.getProfissionais();

  const userProfissional = profissionais.find(p => p.usuario_id === currentUser?.id);

  const notifySuccess = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
    if (onRefresh) onRefresh();
  };

  const handleResponderColega = (trocaId: string, aceitou: boolean) => {
    const res = db.responderTrocaColega(trocaId, aceitou);
    if (res.success) {
      notifySuccess(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleVoluntariar = (trocaId: string) => {
    const profAlvo = userProfissional || profissionais[0];
    if (!profAlvo) return;
    const res = db.voluntariarPlantaoVago(trocaId, profAlvo.id);
    if (res.success) {
      notifySuccess(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleAprovarCoordenacao = (trocaId: string, aprovado: boolean) => {
    const res = db.aprovarTrocaCoordenacao(trocaId, aprovado);
    if (res.success) {
      notifySuccess(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleCancelar = (trocaId: string) => {
    if (confirm('Deseja realmente cancelar esta solicitação?')) {
      const res = db.cancelarTroca(trocaId);
      if (res.success) {
        notifySuccess(res.message);
      } else {
        alert(res.message);
      }
    }
  };

  // Contadores
  const totalPendentesCoord = trocas.filter(t => t.status === 'PENDENTE_COORDENACAO').length;
  const totalVagasAbertas = trocas.filter(t => t.tipo === 'VAGO' && t.status !== 'APROVADA' && t.status !== 'CANCELADA').length;

  // Filtragem
  const trocasFiltradas = trocas.filter(t => {
    if (subAba === 'MINHAS') {
      // Se não for ADM, mostra apenas onde o profissional está envolvido
      if (userProfissional) {
        const isInvolved = t.solicitanteId === userProfissional.id || t.destinatarioId === userProfissional.id || t.voluntarioId === userProfissional.id;
        if (!isInvolved) return false;
      }
    } else if (subAba === 'VAGAS') {
      if (t.tipo !== 'VAGO') return false;
    } else if (subAba === 'COORDENACAO') {
      // Aba do gestor
      if (t.status !== 'PENDENTE_COORDENACAO') return false;
    }

    if (filterStatus !== 'TODOS' && t.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: StatusTroca) => {
    switch (status) {
      case 'PENDENTE_COLEGA':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PENDENTE_COORDENACAO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APROVADA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'RECUSADA':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'CANCELADA':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: StatusTroca) => {
    switch (status) {
      case 'PENDENTE_COLEGA':
        return 'Aguardando Colega';
      case 'PENDENTE_COORDENACAO':
        return 'Aguardando Coordenação';
      case 'APROVADA':
        return 'Homologada / Aprovada';
      case 'RECUSADA':
        return 'Recusada';
      case 'CANCELADA':
        return 'Cancelada';
    }
  };

  return (
    <div id="trocas-view" className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 z-50 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <span>WORKFLOW DE TROCAS, PERMUTAS & COBERTURA DE PLANTÕES</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão transparente de permutas entre colegas, banco de vagas abertas e homologação da coordenação
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalNovaTrocaOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-950/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Solicitar Nova Troca</span>
        </button>
      </div>

      {/* Abas e Contadores */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubAba('MINHAS')}
            className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
              subAba === 'MINHAS' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Minhas Permutas</span>
          </button>

          <button
            type="button"
            onClick={() => setSubAba('VAGAS')}
            className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
              subAba === 'VAGAS' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Banco de Vagas</span>
            {totalVagasAbertas > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                {totalVagasAbertas}
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setSubAba('COORDENACAO')}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
                subAba === 'COORDENACAO' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Homologação (ADM)</span>
              {totalPendentesCoord > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full font-bold animate-pulse">
                  {totalPendentesCoord}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Filtro por Status */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE_COLEGA">Aguardando Colega</option>
            <option value="PENDENTE_COORDENACAO">Aguardando Coordenação</option>
            <option value="APROVADA">Aprovadas</option>
            <option value="RECUSADA">Recusadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Lista de Trocas */}
      {trocasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
          <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Nenhuma solicitação encontrada</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {subAba === 'VAGAS'
              ? 'Não há vagas abertas para cobertura voluntária no momento.'
              : subAba === 'COORDENACAO'
              ? 'Não há solicitações pendentes de homologação pela coordenação.'
              : 'Você não possui trocas ativas. Clique em "Solicitar Nova Troca" para iniciar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trocasFiltradas.map(troca => {
            const isSolicitante = userProfissional?.id === troca.solicitanteId;
            const isDestinatario = userProfissional?.id === troca.destinatarioId;
            const aguardaMeuAceite = isDestinatario && troca.status === 'PENDENTE_COLEGA';

            return (
              <div 
                key={troca.id} 
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 uppercase">
                      {troca.tipo}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(troca.status)}`}>
                      {getStatusLabel(troca.status)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(troca.criadoEm).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Detalhes do Plantão de Origem */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {troca.dataOrigem.split('-').reverse().join('/')} ({troca.turnoOrigem})
                    </span>
                    <span className="text-slate-500 font-normal">
                      Posto: <strong className="text-slate-700">{troca.setorOrigemNome}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Plantonista Titular: <strong>{troca.solicitanteNome}</strong> ({troca.solicitanteCargo})
                  </p>
                </div>

                {/* Destinatário ou Voluntário */}
                {troca.tipo === 'PERMUTA' && troca.dataDestino && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-blue-900">
                      <span className="flex items-center gap-1.5">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                        Contrapartida: {troca.dataDestino.split('-').reverse().join('/')} ({troca.turnoDestino})
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      Colega Envolvido: <strong>{troca.destinatarioNome || 'Colega'}</strong>
                    </p>
                  </div>
                )}

                {troca.tipo === 'DOACAO' && troca.destinatarioNome && (
                  <p className="text-xs text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                    Beneficiário da Cessão: <strong>{troca.destinatarioNome}</strong>
                  </p>
                )}

                {troca.tipo === 'VAGO' && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950">
                    {troca.voluntarioNome ? (
                      <p>
                        Voluntário para Cobertura: <strong>{troca.voluntarioNome}</strong> ({troca.voluntarioCargo})
                      </p>
                    ) : (
                      <p className="font-semibold text-amber-900">
                        Vaga aberta aguardando voluntário da equipe.
                      </p>
                    )}
                  </div>
                )}

                {troca.motivo && (
                  <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                    "{troca.motivo}"
                  </p>
                )}

                {troca.motivoRecusa && (
                  <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                    Motivo da Recusa: {troca.motivoRecusa}
                  </p>
                )}

                {/* Ações de Acordo com o Papel */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {/* Resposta do colega solicitado */}
                  {aguardaMeuAceite && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleResponderColega(troca.id, false)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResponderColega(troca.id, true)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aceitar Permuta</span>
                      </button>
                    </>
                  )}

                  {/* Voluntariar para vaga aberta */}
                  {troca.tipo === 'VAGO' && !troca.voluntarioId && (
                    <button
                      type="button"
                      onClick={() => handleVoluntariar(troca.id)}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Voluntariar-me para este Plantão</span>
                    </button>
                  )}

                  {/* Homologação da coordenação (ADM) */}
                  {isAdmin && troca.status === 'PENDENTE_COORDENACAO' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAprovarCoordenacao(troca.id, false)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        Indeferir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAprovarCoordenacao(troca.id, true)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Homologar e Atualizar Escala</span>
                      </button>
                    </div>
                  )}

                  {/* Cancelamento pelo próprio solicitante */}
                  {isSolicitante && (troca.status === 'PENDENTE_COLEGA' || troca.status === 'PENDENTE_COORDENACAO') && (
                    <button
                      type="button"
                      onClick={() => handleCancelar(troca.id)}
                      className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      Cancelar Solicitação
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Nova Solicitação */}
      <ModalSolicitarTroca
        isOpen={isModalNovaTrocaOpen}
        onClose={() => setIsModalNovaTrocaOpen(false)}
        currentUser={currentUser}
        onSuccess={() => notifySuccess('Solicitação de troca enviada com sucesso!')}
      />
    </div>
  );
};
