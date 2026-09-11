import React, { useState } from 'react';
import { 
  CalendarDays, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Palmtree, 
  FileHeart, 
  Clock, 
  Filter,
  Users,
  Search
} from 'lucide-react';
import { Profissional, SituacaoPlantao, Escala, PlantaoRegistro, PeriodoAfastamento } from '../types';
import { db } from '../services/db';

interface CalendarioViewProps {
  currentDate: string;
}

export const CalendarioView: React.FC<CalendarioViewProps> = ({ currentDate }) => {
  const [activeSubTab, setActiveSubTab] = useState<'MENSAL' | 'INDIVIDUAL'>('MENSAL');
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [mesAtual, setMesAtual] = useState<number>(8); // 8 = Setembro (0-indexed)
  const [anoAtual, setAnoAtual] = useState<number>(2026);

  const profissionais = db.getProfissionais();
  const cargos = db.getCargos();
  const setores = db.getSetores();
  const todasEscalas = db.getEscalas();
  const todosPlantao = db.getPlantaoRegistros();
  const todosAfastamentos = db.getAfastamentos();

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();

  const handleProximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  const handleMesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const selectedProfissional = profissionais.find(p => p.id === selectedProfId) || profissionais[0];

  return (
    <div id="calendario-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <span>CALENDÁRIO DE PLANTÕES E ESCALAS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualização agregada mensal e calendário individual de profissionais
          </p>
        </div>

        {/* Alternância Mensal vs Individual */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
            <button
              onClick={() => setActiveSubTab('MENSAL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeSubTab === 'MENSAL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Mensal Geral
            </button>
            <button
              onClick={() => {
                setActiveSubTab('INDIVIDUAL');
                if (!selectedProfId && profissionais.length > 0) {
                  setSelectedProfId(profissionais[0].id);
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeSubTab === 'INDIVIDUAL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendário Individual
            </button>
          </div>
        </div>
      </div>

      {/* Navegação de Mês/Ano */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
        <button
          onClick={handleMesAnterior}
          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors flex items-center gap-1 text-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Mês Anterior</span>
        </button>

        <div className="text-center font-bold text-sm text-slate-800 uppercase tracking-wide">
          {mesesNomes[mesAtual]} de {anoAtual}
        </div>

        <button
          onClick={handleProximoMes}
          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors flex items-center gap-1 text-xs"
        >
          <span>Próximo Mês</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ABA 1: CALENDÁRIO MENSAL GERAL (Requirement 21) */}
      {activeSubTab === 'MENSAL' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
              <span>Dom</span>
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
            </div>

            {/* Grid dos Dias */}
            <div className="grid grid-cols-7 gap-2 pt-3">
              {/* Espaços vazios do início do mês */}
              {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-24 bg-slate-50/50 rounded-lg border border-dashed border-slate-200/60 opacity-40"></div>
              ))}

              {/* Dias reais */}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const diaStr = String(dia).padStart(2, '0');
                const mesStr = String(mesAtual + 1).padStart(2, '0');
                const dataFormatada = `${anoAtual}-${mesStr}-${diaStr}`;

                const escalasDia = todasEscalas.filter(e => e.data === dataFormatada);
                const registrosDia = todosPlantao.filter(r => r.data === dataFormatada);

                let presentes = 0;
                let ausentes = 0;
                let ferias = 0;
                let atestados = 0;
                let pendentes = 0;

                escalasDia.forEach(e => {
                  const reg = registrosDia.find(r => r.escala_id === e.id);
                  const sit = reg ? reg.situacao : 'PENDENTE';
                  if (sit === 'PRESENTE') presentes++;
                  else if (sit === 'AUSENTE') ausentes++;
                  else if (sit === 'FÉRIAS') ferias++;
                  else if (sit === 'ATESTADO') atestados++;
                  else pendentes++;
                });

                const isToday = dataFormatada === currentDate;

                return (
                  <div
                    key={`dia-${dia}`}
                    className={`min-h-24 p-2 rounded-xl border flex flex-col justify-between transition-all ${
                      isToday
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isToday ? 'text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded' : 'text-slate-700'}`}>
                        {diaStr}
                      </span>
                      {escalasDia.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {escalasDia.length} esc.
                        </span>
                      )}
                    </div>

                    {escalasDia.length > 0 ? (
                      <div className="space-y-1 text-[10px] mt-1.5">
                        {presentes > 0 && (
                          <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                            <span>Pres.</span>
                            <strong>{presentes}</strong>
                          </div>
                        )}
                        {ausentes > 0 && (
                          <div className="flex items-center justify-between text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-medium">
                            <span>Aus.</span>
                            <strong>{ausentes}</strong>
                          </div>
                        )}
                        {ferias > 0 && (
                          <div className="flex items-center justify-between text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                            <span>Férias</span>
                            <strong>{ferias}</strong>
                          </div>
                        )}
                        {atestados > 0 && (
                          <div className="flex items-center justify-between text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                            <span>Atest.</span>
                            <strong>{atestados}</strong>
                          </div>
                        )}
                        {pendentes > 0 && (
                          <div className="flex items-center justify-between text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            <span>Pend.</span>
                            <strong>{pendentes}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic text-center py-2">Sem escala</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CALENDÁRIO INDIVIDUAL DO PROFISSIONAL (Requirement 22) */}
      {activeSubTab === 'INDIVIDUAL' && (
        <div className="space-y-4">
          {/* Seletor de Profissional */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selecionar Profissional:
              </label>
            </div>
            <select
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none min-w-72 font-semibold text-slate-800"
            >
              {profissionais.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome_completo} ({p.matricula}) - Setor {setores.find(s => s.id === p.setor_id)?.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Cartão de Identificação do Profissional */}
          {selectedProfissional && (
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-emerald-950">{selectedProfissional.nome_completo}</h3>
                <p className="text-xs text-emerald-800">
                  Matrícula: <span className="font-mono font-bold">{selectedProfissional.matricula}</span> • Cargo: {cargos.find(c => c.id === selectedProfissional.cargo_id)?.nome} • Setor: {setores.find(s => s.id === selectedProfissional.setor_id)?.nome}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold shadow-xs">
                Grade Mensal Individual
              </span>
            </div>
          )}

          {/* Grid Individual por Dia (01 - Presente, 02 - Folga, etc.) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const diaStr = String(dia).padStart(2, '0');
                const mesStr = String(mesAtual + 1).padStart(2, '0');
                const dataFormatada = `${anoAtual}-${mesStr}-${diaStr}`;

                // Verificar Férias ou Atestado cadastrados para este profissional
                const afastamento = todosAfastamentos.find(a => {
                  if (a.profissional_id !== selectedProfissional?.id) return false;
                  return dataFormatada >= a.data_inicio && dataFormatada <= a.data_fim;
                });

                // Verificar Escala
                const escala = todasEscalas.find(
                  e => e.profissional_id === selectedProfissional?.id && e.data === dataFormatada
                );

                const reg = escala ? todosPlantao.find(r => r.escala_id === escala.id) : null;

                let situacaoDisplay = 'Folga';
                let situacaoBadge = 'bg-slate-50 text-slate-400 border-slate-200';

                if (afastamento) {
                  if (afastamento.tipo === 'FÉRIAS') {
                    situacaoDisplay = 'Férias';
                    situacaoBadge = 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
                  } else {
                    situacaoDisplay = 'Atestado';
                    situacaoBadge = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                  }
                } else if (escala) {
                  const sit = reg ? reg.situacao : 'PENDENTE';
                  if (sit === 'PRESENTE') {
                    situacaoDisplay = 'Presente';
                    situacaoBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                  } else if (sit === 'AUSENTE') {
                    situacaoDisplay = 'Ausente';
                    situacaoBadge = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
                  } else {
                    situacaoDisplay = 'Escalado (Pendente)';
                    situacaoBadge = 'bg-slate-100 text-slate-700 border-slate-300';
                  }
                }

                return (
                  <div 
                    key={`indiv-${dia}`}
                    className="p-3 rounded-lg border border-slate-200 flex flex-col justify-between min-h-20 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>{diaStr}/{mesStr}</span>
                      {escala && <span className="text-[10px] text-slate-400 uppercase font-mono">{escala.turno}</span>}
                    </div>

                    <div className="mt-2">
                      <span className={`inline-block w-full text-center px-2 py-1 rounded text-[11px] border ${situacaoBadge}`}>
                        {situacaoDisplay}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
