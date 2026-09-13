import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Gift, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Building2, 
  User as UserIcon,
  HelpCircle
} from 'lucide-react';
import { db } from '../services/db';
import { Escala, Profissional, Setor, Cargo, TipoTroca, User } from '../types';

interface ModalSolicitarTrocaProps {
  isOpen: boolean;
  onClose: () => void;
  escalaOrigem?: Escala | null;
  currentUser: User | null;
  onSuccess: () => void;
}

export const ModalSolicitarTroca: React.FC<ModalSolicitarTrocaProps> = ({
  isOpen,
  onClose,
  escalaOrigem,
  currentUser,
  onSuccess,
}) => {
  const [tipo, setTipo] = useState<TipoTroca>('PERMUTA');
  const [escalaOrigemSelecionadaId, setEscalaOrigemSelecionadaId] = useState<string>(escalaOrigem?.id || '');
  const [destinatarioId, setDestinatarioId] = useState<string>('');
  const [escalaDestinoId, setEscalaDestinoId] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const profissionais = db.getProfissionais();
  const setores = db.getSetores();
  const cargos = db.getCargos();
  const todasEscalas = db.getEscalas();

  // Profissional solicitante (se o usuário for um profissional específico ou escolher)
  const solicitanteProfissional = profissionais.find(p => p.usuario_id === currentUser?.id) ||
    (escalaOrigem ? profissionais.find(p => p.id === escalaOrigem.profissional_id) : profissionais[0]);

  // Lista de escalas do solicitante para selecionar como origem se não foi passada uma fixa
  const minhasEscalas = todasEscalas.filter(e => e.profissional_id === solicitanteProfissional?.id);
  const escalaAtiva = todasEscalas.find(e => e.id === (escalaOrigem?.id || escalaOrigemSelecionadaId)) || minhasEscalas[0];

  const setorOrigem = setores.find(s => s.id === escalaAtiva?.setor_id);
  const cargoOrigem = cargos.find(c => c.id === escalaAtiva?.cargo_id);

  // Lista de colegas elegíveis (mesmo cargo ou compatíveis, exceto o solicitante)
  const colegasCompativeis = profissionais.filter(p => p.id !== solicitanteProfissional?.id && p.status === 'ATIVO');

  // Escalas do colega destinatário para permuta
  const escalasDoColega = destinatarioId 
    ? todasEscalas.filter(e => e.profissional_id === destinatarioId)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!escalaAtiva) {
      setError('Selecione o plantão de origem para troca.');
      return;
    }

    if (tipo === 'PERMUTA') {
      if (!destinatarioId) {
        setError('Selecione o colega com quem deseja realizar a permuta.');
        return;
      }
      if (!escalaDestinoId) {
        setError('Selecione qual plantão do colega você assumirá em troca.');
        return;
      }
    }

    if (tipo === 'DOACAO' && !destinatarioId) {
      setError('Selecione o colega que assumirá a doação deste plantão.');
      return;
    }

    const colega = destinatarioId ? profissionais.find(p => p.id === destinatarioId) : undefined;
    const escalaDest = escalaDestinoId ? todasEscalas.find(e => e.id === escalaDestinoId) : undefined;

    const res = db.solicitarTroca({
      tipo,
      escalaOrigemId: escalaAtiva.id,
      dataOrigem: escalaAtiva.data,
      turnoOrigem: escalaAtiva.turno,
      setorOrigemId: escalaAtiva.setor_id,
      setorOrigemNome: setorOrigem?.nome || 'Setor Hospitalar',
      solicitanteId: solicitanteProfissional?.id || 'prof_anon',
      solicitanteNome: solicitanteProfissional?.nome_completo || 'Solicitante',
      solicitanteCargo: cargoOrigem?.nome || 'Profissional',
      destinatarioId: colega?.id,
      destinatarioNome: colega?.nome_completo,
      escalaDestinoId: escalaDest?.id,
      dataDestino: escalaDest?.data,
      turnoDestino: escalaDest?.turno,
      motivo: motivo.trim() || undefined,
    });

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-950/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Solicitar Troca de Plantão</h3>
              <p className="text-xs text-slate-500">Permuta direta, doação ou abertura de vaga emergencial</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Seleção do Tipo de Troca */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setTipo('PERMUTA'); setDestinatarioId(''); setEscalaDestinoId(''); }}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                tipo === 'PERMUTA'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 text-blue-600" />
              <span>Permuta (1x1)</span>
            </button>

            <button
              type="button"
              onClick={() => { setTipo('DOACAO'); setEscalaDestinoId(''); }}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                tipo === 'DOACAO'
                  ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Gift className="w-4 h-4 text-purple-600" />
              <span>Ceder / Doar</span>
            </button>

            <button
              type="button"
              onClick={() => { setTipo('VAGO'); setDestinatarioId(''); setEscalaDestinoId(''); }}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                tipo === 'VAGO'
                  ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Abrir Vaga</span>
            </button>
          </div>

          {/* Detalhes do Plantão de Origem */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Plantão a ser Negociado</span>
              <span className="text-slate-500">Solicitante: <strong>{solicitanteProfissional?.nome_completo}</strong></span>
            </div>

            {escalaOrigem ? (
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-medium text-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold">
                    📅 {escalaOrigem.data.split('-').reverse().join('/')} • Turno {escalaOrigem.turno} ({escalaOrigem.hora_inicio} - {escalaOrigem.hora_fim})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Posto: {setorOrigem?.nome} • Cargo: {cargoOrigem?.nome}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Escolha seu plantão</label>
                <select
                  value={escalaOrigemSelecionadaId}
                  onChange={(e) => setEscalaOrigemSelecionadaId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {minhasEscalas.map(e => {
                    const s = setores.find(st => st.id === e.setor_id);
                    return (
                      <option key={e.id} value={e.id}>
                        {e.data.split('-').reverse().join('/')} ({e.turno}) - {s?.nome}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Configuração de Contrapartida para Permuta ou Doação */}
          {tipo !== 'VAGO' && (
            <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Colega de Equipe Destinatário <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={destinatarioId}
                  onChange={(e) => {
                    setDestinatarioId(e.target.value);
                    setEscalaDestinoId('');
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                >
                  <option value="">Selecione um profissional cadastrado...</option>
                  {colegasCompativeis.map(p => {
                    const c = cargos.find(cg => cg.id === p.cargo_id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.nome_completo} ({c?.nome || 'Profissional'}) - Matrícula: {p.matricula}
                      </option>
                    );
                  })}
                </select>
              </div>

              {tipo === 'PERMUTA' && destinatarioId && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Plantão do Colega que você assumirá em troca <span className="text-rose-500">*</span>
                  </label>
                  {escalasDoColega.length === 0 ? (
                    <div className="p-2.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-xs">
                      Este colega ainda não possui escalas cadastradas para o período.
                    </div>
                  ) : (
                    <select
                      required
                      value={escalaDestinoId}
                      onChange={(e) => setEscalaDestinoId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                    >
                      <option value="">Selecione o plantão de contrapartida...</option>
                      {escalasDoColega.map(e => {
                        const s = setores.find(st => st.id === e.setor_id);
                        return (
                          <option key={e.id} value={e.id}>
                            {e.data.split('-').reverse().join('/')} ({e.turno}) • Posto: {s?.nome} ({e.hora_inicio} às {e.hora_fim})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {tipo === 'VAGO' && (
            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Plantão Aberto para Cobertura Voluntária
              </p>
              <p className="text-[11px] leading-relaxed">
                Este plantão será publicado no Banco de Vagas da equipe. Qualquer profissional habilitado poderá se voluntariar para cobri-lo, sujeito à aprovação final da coordenação.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justificativa / Observação (Opcional)
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Compromisso acadêmico inadiável, acerto de folga..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md shadow-blue-950/20 flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Enviar Solicitação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
