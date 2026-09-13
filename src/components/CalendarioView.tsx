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
  Search,
  List,
  Grid,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
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
  const [mobileMode, setMobileMode] = useState<'GRADE' | 'LISTA'>('GRADE');
  const [selectedDiaMobile, setSelectedDiaMobile] = useState<number>(() => {
    const [ano, mes, dia] = currentDate.split('-').map(Number);
    if (ano === 2026 && mes === 9) {
      return dia || 1;
    }
    return 1;
  });

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

  const diasSemanaCompleto = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
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

  // Helper para dados do dia selecionado no mobile
  const diaMobileStr = String(Math.min(selectedDiaMobile, diasNoMes)).padStart(2, '0');
  const mesStr = String(mesAtual + 1).padStart(2, '0');
  const dataMobileFormatada = `${anoAtual}-${mesStr}-${diaMobileStr}`;
  const dataMobileObj = new Date(anoAtual, mesAtual, Math.min(selectedDiaMobile, diasNoMes));
  const diaSemanaNome = diasSemanaCompleto[dataMobileObj.getDay()];

  const escalasDiaMobile = todasEscalas.filter(e => e.data === dataMobileFormatada);
  const registrosDiaMobile = todosPlantao.filter(r => r.data === dataMobileFormatada);

  let mobPresentes = 0;
  let mobAusentes = 0;
  let mobFerias = 0;
  let mobAtestados = 0;
  let mobPendentes = 0;

  escalasDiaMobile.forEach(e => {
    const reg = registrosDiaMobile.find(r => r.escala_id === e.id);
    const sit = reg ? reg.situacao : 'PENDENTE';
    if (sit === 'PRESENTE') mobPresentes++;
    else if (sit === 'AUSENTE') mobAusentes++;
    else if (sit === 'FÉRIAS') mobFerias++;
    else if (sit === 'ATESTADO') mobAtestados++;
    else mobPendentes++;
  });

  return (
    <div id="calendario-view" className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <span>CALENDÁRIO DE PLANTÕES E ESCALAS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualização agregada mensal e calendário individual de profissionais
          </p>
        </div>

        {/* Alternância Mensal vs Individual */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('MENSAL')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold transition-all min-h-[36px] ${
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
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold transition-all min-h-[36px] ${
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
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
        <button
          onClick={handleMesAnterior}
          className="p-2 sm:p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold min-h-[38px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Mês Anterior</span>
          <span className="sm:hidden">Anterior</span>
        </button>

        <div className="text-center font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
          {mesesNomes[mesAtual]} {anoAtual}
        </div>

        <button
          onClick={handleProximoMes}
          className="p-2 sm:p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold min-h-[38px]"
        >
          <span className="hidden sm:inline">Próximo Mês</span>
          <span className="sm:hidden">Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ABA 1: CALENDÁRIO MENSAL GERAL */}
      {activeSubTab === 'MENSAL' && (
        <div className="space-y-4">
          {/* ======================================================== */}
          {/* VISUALIZAÇÃO MOBILE (md:hidden) - TOTALMENTE RESPONSIVA */}
          {/* ======================================================== */}
          <div className="md:hidden space-y-3">
            {/* Seletor de Modo no Celular: Grade Interativa vs Agenda Lista */}
            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setMobileMode('GRADE')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all min-h-[36px] ${
                  mobileMode === 'GRADE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-emerald-600" />
                <span>Grade Interativa</span>
              </button>
              <button
                onClick={() => setMobileMode('LISTA')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all min-h-[36px] ${
                  mobileMode === 'LISTA' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5 text-emerald-600" />
                <span>Agenda do Mês</span>
              </button>
            </div>

            {/* MODO 1: GRADE INTERATIVA MOBILE (SEM SCROLL HORIZONTAL) */}
            {mobileMode === 'GRADE' && (
              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
                  {/* Dias da semana compactos */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 uppercase pb-2 border-b border-slate-100">
                    <span className="text-rose-500">D</span>
                    <span>S</span>
                    <span>T</span>
                    <span>Q</span>
                    <span>Q</span>
                    <span>S</span>
                    <span className="text-slate-500">S</span>
                  </div>

                  {/* Grid de Dias */}
                  <div className="grid grid-cols-7 gap-1 pt-2">
                    {/* Espaços vazios no início */}
                    {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                      <div key={`mob-empty-${i}`} className="min-h-[44px] rounded-lg bg-slate-50/50 opacity-30 border border-dashed border-slate-200"></div>
                    ))}

                    {/* Dias reais com touch target generoso */}
                    {Array.from({ length: diasNoMes }).map((_, i) => {
                      const dia = i + 1;
                      const diaPad = String(dia).padStart(2, '0');
                      const dataFmt = `${anoAtual}-${mesStr}-${diaPad}`;
                      const escalasD = todasEscalas.filter(e => e.data === dataFmt);
                      const isSelected = dia === Math.min(selectedDiaMobile, diasNoMes);
                      const isToday = dataFmt === currentDate;

                      return (
                        <button
                          type="button"
                          key={`mob-day-${dia}`}
                          onClick={() => setSelectedDiaMobile(dia)}
                          className={`min-h-[46px] p-1 rounded-lg border flex flex-col items-center justify-between transition-all select-none ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300 font-bold'
                              : isToday
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                              : escalasD.length > 0
                              ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
                              : 'bg-slate-50/70 text-slate-400 border-slate-100'
                          }`}
                        >
                          <span className="text-xs">{diaPad}</span>

                          {escalasD.length > 0 ? (
                            <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                              isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {escalasD.length}
                            </span>
                          ) : (
                            <span className="text-[9px] opacity-0">-</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DETALHES DO DIA SELECIONADO NO CELULAR */}
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">{diaSemanaNome}</span>
                      <h3 className="font-bold text-sm text-slate-900">
                        {diaMobileStr} de {mesesNomes[mesAtual]} de {anoAtual}
                      </h3>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
                      {escalasDiaMobile.length} Plantonista(s)
                    </span>
                  </div>

                  {/* Resumo em mini-pills */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Presentes</span>
                      <strong className="text-emerald-800 text-sm">{mobPresentes}</strong>
                    </div>
                    <div className="bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                      <span className="text-[10px] text-rose-600 uppercase font-semibold block">Ausentes</span>
                      <strong className="text-rose-800 text-sm">{mobAusentes}</strong>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pendentes</span>
                      <strong className="text-slate-700 text-sm">{mobPendentes}</strong>
                    </div>
                  </div>

                  {(mobFerias > 0 || mobAtestados > 0) && (
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span>Férias: <strong className="text-blue-700">{mobFerias}</strong></span>
                      <span>Atestados Médicos: <strong className="text-amber-700">{mobAtestados}</strong></span>
                    </div>
                  )}

                  {/* Lista de Profissionais Escalados no Dia */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Profissionais Escalados no Dia ({escalasDiaMobile.length})
                    </h4>

                    {escalasDiaMobile.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                        Nenhum profissional com escala cadastrada nesta data.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {escalasDiaMobile.map(escala => {
                          const prof = profissionais.find(p => p.id === escala.profissional_id);
                          const cargo = cargos.find(c => c.id === escala.cargo_id)?.nome;
                          const setor = setores.find(s => s.id === escala.setor_id)?.nome;
                          const reg = registrosDiaMobile.find(r => r.escala_id === escala.id);
                          const sit = reg ? reg.situacao : 'PENDENTE';

                          return (
                            <div 
                              key={`mob-prof-${escala.id}`}
                              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2"
                            >
                              <div>
                                <h5 className="font-bold text-xs text-slate-900">{prof?.nome_completo || 'Profissional'}</h5>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="font-semibold text-slate-700">Setor {setor}</span>
                                  <span>•</span>
                                  <span>{escala.turno}</span>
                                  <span>•</span>
                                  <span className="text-slate-400">{cargo}</span>
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 border ${
                                sit === 'PRESENTE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                sit === 'AUSENTE' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                sit === 'FÉRIAS' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                sit === 'ATESTADO' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                'bg-slate-200 text-slate-700 border-slate-300'
                              }`}>
                                {sit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MODO 2: AGENDA EM LISTA CRONOLÓGICA MOBILE */}
            {mobileMode === 'LISTA' && (
              <div className="space-y-2.5">
                {Array.from({ length: diasNoMes }).map((_, i) => {
                  const dia = i + 1;
                  const diaPad = String(dia).padStart(2, '0');
                  const dataFmt = `${anoAtual}-${mesStr}-${diaPad}`;
                  const escalasD = todasEscalas.filter(e => e.data === dataFmt);
                  if (escalasD.length === 0) return null;

                  const dataObj = new Date(anoAtual, mesAtual, dia);
                  const diaSemana = diasSemanaCompleto[dataObj.getDay()];
                  const regsD = todosPlantao.filter(r => r.data === dataFmt);
                  const pres = regsD.filter(r => r.situacao === 'PRESENTE').length;
                  const aus = regsD.filter(r => r.situacao === 'AUSENTE').length;

                  return (
                    <div 
                      key={`agenda-${dia}`}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">{diaSemana}</span>
                          <h4 className="font-bold text-xs text-slate-900">{diaPad}/{mesStr}/{anoAtual}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            {pres} Pres.
                          </span>
                          {aus > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              {aus} Aus.
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {escalasD.length} total
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {escalasD.slice(0, 3).map(escala => {
                          const prof = profissionais.find(p => p.id === escala.profissional_id);
                          const setor = setores.find(s => s.id === escala.setor_id)?.nome;
                          const reg = regsD.find(r => r.escala_id === escala.id);
                          const sit = reg ? reg.situacao : 'PENDENTE';

                          return (
                            <div key={`agenda-item-${escala.id}`} className="text-xs flex items-center justify-between text-slate-600 py-0.5">
                              <span className="truncate max-w-[200px]">{prof?.nome_completo} (Setor {setor})</span>
                              <span className="text-[10px] font-mono uppercase font-semibold">{sit}</span>
                            </div>
                          );
                        })}
                        {escalasD.length > 3 && (
                          <p className="text-[10px] text-slate-400 italic pt-1">
                            + {escalasD.length - 3} outro(s) profissional(is)...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* VISUALIZAÇÃO DESKTOP (hidden md:block) - GRID COMPLETO   */}
          {/* ======================================================== */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
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

            {/* Grid dos Dias Desktop */}
            <div className="grid grid-cols-7 gap-2 pt-3">
              {/* Espaços vazios do início do mês */}
              {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-24 bg-slate-50/50 rounded-lg border border-dashed border-slate-200/60 opacity-40"></div>
              ))}

              {/* Dias reais */}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const diaStr = String(dia).padStart(2, '0');
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

      {/* ABA 2: CALENDÁRIO INDIVIDUAL DO PROFISSIONAL */}
      {activeSubTab === 'INDIVIDUAL' && (
        <div className="space-y-4">
          {/* Seletor de Profissional */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selecionar Profissional:
              </label>
            </div>
            <select
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none w-full sm:w-auto font-semibold text-slate-800"
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
            <div className="bg-emerald-50/40 p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-emerald-950">{selectedProfissional.nome_completo}</h3>
                <p className="text-xs text-emerald-800">
                  Matrícula: <span className="font-mono font-bold">{selectedProfissional.matricula}</span> • Cargo: {cargos.find(c => c.id === selectedProfissional.cargo_id)?.nome} • Setor: {setores.find(s => s.id === selectedProfissional.setor_id)?.nome}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold shadow-xs self-start sm:self-auto">
                Grade Mensal Individual
              </span>
            </div>
          )}

          {/* Grid Individual por Dia (01 - Presente, 02 - Folga, etc.) */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const diaStr = String(dia).padStart(2, '0');
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
                    situacaoDisplay = 'Escalado';
                    situacaoBadge = 'bg-slate-100 text-slate-700 border-slate-300';
                  }
                }

                return (
                  <div 
                    key={`indiv-${dia}`}
                    className="p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between min-h-[72px] bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{diaStr}/{mesStr}</span>
                      {escala && <span className="text-[10px] text-slate-400 uppercase font-mono">{escala.turno}</span>}
                    </div>

                    <div className="mt-2">
                      <span className={`inline-block w-full text-center px-1.5 py-1 rounded text-[11px] border ${situacaoBadge}`}>
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
