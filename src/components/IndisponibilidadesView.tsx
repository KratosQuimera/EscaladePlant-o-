import React, { useState } from 'react';
import { 
  CalendarOff, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  Filter, 
  Calendar, 
  User as UserIcon,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { db } from '../services/db';
import { RestricaoIndisponibilidade, User } from '../types';
import { ModalNovaIndisponibilidade } from './ModalNovaIndisponibilidade';

interface IndisponibilidadesViewProps {
  currentUser: User | null;
  onRefresh?: () => void;
}

export const IndisponibilidadesView: React.FC<IndisponibilidadesViewProps> = ({ currentUser, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [filterProf, setFilterProf] = useState<string>('TODOS');
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAdmin = currentUser?.tipo_acesso === 'ADM';
  const indisponibilidades = db.getIndisponibilidades();
  const profissionais = db.getProfissionais();

  const handleExcluir = (id: string) => {
    if (confirm('Deseja remover este registro de indisponibilidade?')) {
      const res = db.excluirIndisponibilidade(id);
      if (res.success) {
        setFeedback('Registro removido com sucesso.');
        setTimeout(() => setFeedback(null), 3000);
        if (onRefresh) onRefresh();
      }
    }
  };

  const listaFiltrada = indisponibilidades.filter(item => {
    if (filterProf !== 'TODOS' && item.profissional_id !== filterProf) return false;
    return true;
  });

  return (
    <div id="indisponibilidades-view" className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
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
            <CalendarOff className="w-5 h-5 text-amber-600" />
            <span>COLETA PRÉVIA DE INDISPONIBILIDADES & RESTRIÇÕES</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro antecipado de datas e períodos que os profissionais não podem ser escalados
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-950/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Informar Indisponibilidade</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Filtrar por Profissional:</span>
          <select
            value={filterProf}
            onChange={(e) => setFilterProf(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="TODOS">Todos os Profissionais ({indisponibilidades.length})</option>
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome_completo}</option>
            ))}
          </select>
        </div>

        <span className="text-slate-500 text-[11px]">
          Mostrando {listaFiltrada.length} registro(s)
        </span>
      </div>

      {/* Grid de Cards */}
      {listaFiltrada.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
          <CalendarOff className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Nenhuma indisponibilidade registrada</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não há restrições de agenda cadastradas para os critérios selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaFiltrada.map(item => {
            const dataFormatada = item.data.split('-').reverse().join('/');
            return (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{item.profissional_nome}</h4>
                      <p className="text-[10px] text-slate-400">Registrado por: {item.registrado_por || 'Sistema'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExcluir(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remover restrição"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-slate-700">
                    <span className="font-semibold flex items-center gap-1.5">
                      📅 {dataFormatada}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {item.periodo === 'DIA_TODO' ? 'Dia Todo (24h)' : item.periodo}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                    <strong className="text-slate-700">Motivo:</strong> {item.motivo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ModalNovaIndisponibilidade
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          setFeedback('Indisponibilidade cadastrada com sucesso!');
          setTimeout(() => setFeedback(null), 3000);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
