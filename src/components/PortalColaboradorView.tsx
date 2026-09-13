import React, { useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeftRight, 
  MessageCircle, 
  AlertCircle, 
  PlusCircle, 
  FileText,
  Smartphone,
  Send,
  CalendarOff,
  User as UserIcon
} from 'lucide-react';
import { db } from '../services/db';
import { Escala, Profissional, User } from '../types';
import { ModalSolicitarTroca } from './ModalSolicitarTroca';
import { ModalDisparoWhatsApp } from './ModalDisparoWhatsApp';
import { ModalNovaIndisponibilidade } from './ModalNovaIndisponibilidade';

interface PortalColaboradorViewProps {
  currentUser: User | null;
  onRefresh?: () => void;
}

export const PortalColaboradorView: React.FC<PortalColaboradorViewProps> = ({ currentUser, onRefresh }) => {
  const profissionais = db.getProfissionais();
  const setores = db.getSetores();
  const cargos = db.getCargos();
  const todasEscalas = db.getEscalas();
  const indisponibilidades = db.getIndisponibilidades();

  const userProfissional = profissionais.find(p => p.usuario_id === currentUser?.id) || profissionais[0];
  const [selectedProfId, setSelectedProfId] = useState<string>(userProfissional?.id || '');
  
  const [mesAno, setMesAno] = useState<string>(new Date().toISOString().substring(0, 7)); // AAAA-MM
  const [escalaParaTrocar, setEscalaParaTrocar] = useState<Escala | null>(null);
  const [isModalTrocaOpen, setIsModalTrocaOpen] = useState<boolean>(false);
  const [isModalWhatsAppOpen, setIsModalWhatsAppOpen] = useState<boolean>(false);
  const [isModalIndispOpen, setIsModalIndispOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const profissionalAtivo = profissionais.find(p => p.id === selectedProfId) || userProfissional;
  const cargoAtivo = cargos.find(c => c.id === profissionalAtivo?.cargo_id);

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
    if (onRefresh) onRefresh();
  };

  // Plantões do mês selecionado
  const plantoesMes = todasEscalas
    .filter(e => e.profissional_id === profissionalAtivo?.id && e.data.startsWith(mesAno))
    .sort((a, b) => a.data.localeCompare(b.data));

  // Próximo plantão a partir de hoje
  const hojeStr = new Date().toISOString().split('T')[0];
  const proximosPlantoes = todasEscalas
    .filter(e => e.profissional_id === profissionalAtivo?.id && e.data >= hojeStr)
    .sort((a, b) => a.data.localeCompare(b.data));
  const proximoPlantao = proximosPlantoes[0];

  // Checar se já registrou ciência para este mês
  const ciencia = profissionalAtivo ? db.getCiencia(profissionalAtivo.id, mesAno) : undefined;

  const handleConfirmarCiencia = () => {
    if (!profissionalAtivo) return;
    const res = db.registrarCiencia(
      profissionalAtivo.id,
      profissionalAtivo.nome_completo,
      mesAno,
      currentUser?.nome || profissionalAtivo.nome_completo
    );
    if (res.success) {
      notify('Ciência da escala confirmada e registrada com sucesso!');
    } else {
      alert(res.message);
    }
  };

  // Total de horas (12h por turno regular)
  const totalHorasMes = plantoesMes.length * 12;

  return (
    <div id="portal-colaborador" className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {feedback && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 z-50 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header do Portal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/20 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              PORTAL DO COLABORADOR • MEU PLANTÃO
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização individualizada, ciência formal da escala mensal e solicitação rápida de trocas
            </p>
          </div>
        </div>

        {/* Seletor de Mês e de Profissional (para gestão / teste) */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.tipo_acesso === 'ADM' && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 pl-1.5 text-[11px] font-medium">Ver como:</span>
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none pr-2 py-1"
              >
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome_completo}</option>
                ))}
              </select>
            </div>
          )}

          <input
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Identificação do Profissional & Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Profissional</span>
          <p className="font-bold text-slate-900 text-sm truncate">{profissionalAtivo?.nome_completo}</p>
          <p className="text-xs text-emerald-700 font-medium">
            {cargoAtivo?.nome || 'Profissional'} • Mat: {profissionalAtivo?.matricula}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Plantões no Mês</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{plantoesMes.length}</span>
            <span className="text-xs text-slate-500">plantões</span>
          </div>
          <p className="text-[11px] text-slate-400">Total estimado: ~{totalHorasMes} horas</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Próximo Plantão</span>
          {proximoPlantao ? (
            <div>
              <p className="font-bold text-emerald-700 text-xs">
                📅 {proximoPlantao.data.split('-').reverse().join('/')} ({proximoPlantao.turno})
              </p>
              <p className="text-[11px] text-slate-500">
                {setores.find(s => s.id === proximoPlantao.setor_id)?.nome} • {proximoPlantao.hora_inicio} - {proximoPlantao.hora_fim}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Nenhum plantão agendado à frente</p>
          )}
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status da Ciência</span>
          {ciencia ? (
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">Cientificado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">Pendente de Confirmação</span>
            </div>
          )}
          <p className="text-[10px] text-slate-400">Exigência para conformidade hospitalar</p>
        </div>
      </div>

      {/* Banner de Ciência Formal da Escala Mensal */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        ciencia ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/80 border-amber-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${ciencia ? 'text-emerald-600' : 'text-amber-600'}`} />
              <h3 className={`font-bold text-sm ${ciencia ? 'text-emerald-950' : 'text-amber-950'}`}>
                Termo de Ciência da Escala Mensal ({mesAno.split('-').reverse().join('/')})
              </h3>
            </div>
            {ciencia ? (
              <p className="text-xs text-emerald-800 leading-relaxed">
                ✅ Você confirmou formalmente ciência da escala deste mês em{' '}
                <strong>{new Date(ciencia.data_hora).toLocaleString('pt-BR')}</strong> (Registrado por: {ciencia.registrado_por}).
              </p>
            ) : (
              <p className="text-xs text-amber-900 leading-relaxed">
                Por favor, verifique seus dias e horários escalados abaixo e clique para registrar formalmente a sua ciência e concordância para o mês vigente.
              </p>
            )}
          </div>

          {!ciencia && (
            <button
              type="button"
              onClick={handleConfirmarCiencia}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-transform active:scale-95 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Ciência da Minha Escala</span>
            </button>
          )}
        </div>
      </div>

      {/* Ações Rápidas de Comunicação & Agenda */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Meus Plantões Programados ({plantoesMes.length})</span>
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalIndispOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <CalendarOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Cadastrar Indisponibilidade</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalWhatsAppOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Minha Agenda (WhatsApp)</span>
          </button>
        </div>
      </div>

      {/* Tabela / Grid de Plantões do Mês */}
      {plantoesMes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Nenhum plantão agendado para este mês</h4>
          <p className="text-xs text-slate-500">
            Você não possui escalas cadastradas para o período de {mesAno.split('-').reverse().join('/')}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {plantoesMes.map(escala => {
            const setor = setores.find(s => s.id === escala.setor_id);
            const dataObj = new Date(escala.data + 'T00:00:00');
            const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
            const diaNum = escala.data.split('-').reverse().join('/');
            const isPassado = escala.data < hojeStr;
            const isHoje = escala.data === hojeStr;

            return (
              <div 
                key={escala.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${
                  isHoje 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
                    : isPassado
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {diaSemana}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {diaNum}
                    </span>
                  </div>

                  {isHoje ? (
                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                      Hoje
                    </span>
                  ) : isPassado ? (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-full">
                      Concluído
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full">
                      Programado
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Turno & Horário:</span>
                    <span className="font-bold text-slate-800">
                      {escala.turno === 'DIURNO' ? '☀️ Diurno' : '🌙 Noturno'} ({escala.hora_inicio} - {escala.hora_fim})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Posto / Setor:</span>
                    <span className="font-bold text-slate-800">{setor?.nome || 'Geral'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tipo de Alocação:</span>
                    <span className="text-slate-700">{escala.tipo_escala}</span>
                  </div>
                </div>

                {/* Botão para solicitar troca deste plantão específico */}
                {!isPassado && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEscalaParaTrocar(escala);
                        setIsModalTrocaOpen(true);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Solicitar Troca / Permuta</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modais Integrados */}
      {isModalTrocaOpen && (
        <ModalSolicitarTroca
          isOpen={isModalTrocaOpen}
          onClose={() => {
            setIsModalTrocaOpen(false);
            setEscalaParaTrocar(null);
          }}
          escalaOrigem={escalaParaTrocar}
          currentUser={currentUser}
          onSuccess={() => notify('Solicitação de troca enviada com sucesso!')}
        />
      )}

      {isModalWhatsAppOpen && (
        <ModalDisparoWhatsApp
          isOpen={isModalWhatsAppOpen}
          onClose={() => setIsModalWhatsAppOpen(false)}
          selectedDate={hojeStr}
          initialProfissionalId={profissionalAtivo?.id}
        />
      )}

      {isModalIndispOpen && (
        <ModalNovaIndisponibilidade
          isOpen={isModalIndispOpen}
          onClose={() => setIsModalIndispOpen(false)}
          currentUser={currentUser}
          onSuccess={() => notify('Indisponibilidade registrada com sucesso!')}
        />
      )}
    </div>
  );
};
