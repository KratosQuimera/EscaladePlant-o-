import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, PlusCircle, CheckCircle2, User as UserIcon } from 'lucide-react';
import { db } from '../services/db';
import { PeriodoIndisponibilidade, User } from '../types';

interface ModalNovaIndisponibilidadeProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: () => void;
}

export const ModalNovaIndisponibilidade: React.FC<ModalNovaIndisponibilidadeProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const profissionais = db.getProfissionais();
  const userProfissional = profissionais.find(p => p.usuario_id === currentUser?.id) || profissionais[0];

  const [profissionalId, setProfissionalId] = useState<string>(userProfissional?.id || '');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [periodo, setPeriodo] = useState<PeriodoIndisponibilidade>('INTEGRAL');
  const [motivo, setMotivo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profissionalId) {
      setError('Selecione o profissional.');
      return;
    }
    if (!data) {
      setError('Informe a data da indisponibilidade.');
      return;
    }
    if (!motivo.trim()) {
      setError('Informe o motivo ou justificativa da indisponibilidade.');
      return;
    }

    const prof = profissionais.find(p => p.id === profissionalId);

    const res = db.salvarIndisponibilidade({
      profissional_id: profissionalId,
      profissional_nome: prof?.nome_completo,
      data,
      periodo,
      motivo: motivo.trim(),
      registrado_por: currentUser?.nome || 'Sistema',
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-950/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Registrar Indisponibilidade</h3>
              <p className="text-xs text-slate-500">Comunique restrições de agenda antes do fechamento da escala</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Profissional</label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {profissionais.map(p => (
                <option key={p.id} value={p.id}>{p.nome_completo} ({p.matricula})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Data</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Período</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as PeriodoIndisponibilidade)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="INTEGRAL">Dia Todo (24h)</option>
                <option value="DIURNO">Diurno (07h às 19h)</option>
                <option value="NOTURNO">Noturno (19h às 07h)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Motivo / Justificativa <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Congresso médico de cardiologia, pós-graduação, motivo familiar..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-md shadow-amber-950/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Indisponibilidade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
