import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Palmtree, 
  FileHeart, 
  Clock, 
  Percent, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronRight, 
  ArrowUpRight, 
  Building2,
  Calendar,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { User, ResumoDia, IndicadoresSetor } from '../types';
import { obterResumoDia } from '../services/presence';

interface DashboardViewProps {
  selectedDate: string;
  currentUser: User | null;
  onNavigateToEscala: (setorId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedDate,
  currentUser,
  onNavigateToEscala,
}) => {
  const [selectedSectorModal, setSelectedSectorModal] = useState<IndicadoresSetor | null>(null);
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  const resumo: ResumoDia = obterResumoDia(selectedDate, currentUser?.tipo_acesso);

  const getStatusColor = (status: 'NORMAL' | 'ATENÇÃO' | 'CRÍTICO') => {
    switch (status) {
      case 'NORMAL':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          indicator: 'bg-emerald-500',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
        };
      case 'ATENÇÃO':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          indicator: 'bg-amber-500',
          text: 'text-amber-700',
          border: 'border-amber-200',
        };
      case 'CRÍTICO':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          indicator: 'bg-rose-500',
          text: 'text-rose-700',
          border: 'border-rose-200',
        };
    }
  };

  const statusGeralStyle = getStatusColor(resumo.statusGeral);

  return (
    <div id="dashboard-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Date Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>MONITORAMENTO DE PLANTÕES</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase border ${statusGeralStyle.badge}`}>
              {resumo.statusGeral}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Panorama diário em tempo real • Data: <strong className="text-slate-700">{selectedDate.split('-').reverse().join('/')}</strong>
          </p>
        </div>

        {/* Quick Legend & Rule Info */}
        <div className="relative flex items-center gap-2">
          <button
            id="btn-info-regra-presenca"
            onClick={() => setShowFormulaTooltip(!showFormulaTooltip)}
            className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Regra de Cálculo de Presença</span>
          </button>

          {showFormulaTooltip && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-xs z-30 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-semibold text-slate-800">
                <span>Fórmula Oficial de Presença</span>
                <button onClick={() => setShowFormulaTooltip(false)} className="text-slate-400 hover:text-slate-600">×</button>
              </div>
              <div className="py-2 space-y-2 text-slate-600">
                <p className="font-mono bg-slate-50 p-2 rounded border border-slate-200 text-slate-800 text-[11px]">
                  (Presentes / Que Deveriam Trabalhar) × 100
                </p>
                <p className="text-[11px] leading-relaxed">
                  <strong>Regra:</strong> Profissionais em <em>Férias</em>, <em>Atestado</em> ou <em>Folga</em> NÃO são considerados como ausentes e são deduzidos da base esperada de trabalho.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                  <p><span className="text-emerald-700 font-bold">≥ 90%:</span> NORMAL</p>
                  <p><span className="text-amber-700 font-bold">80% a 89,99%:</span> ATENÇÃO</p>
                  <p><span className="text-rose-700 font-bold">&lt; 80%:</span> CRÍTICO</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7 Principal Cards (Requirement 23) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Escalados */}
        <div id="card-escalados" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Escalados</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{resumo.escaladosTotal}</p>
          <span className="text-[10px] text-slate-500">Planejados no dia</span>
        </div>

        {/* 2. Presentes */}
        <div id="card-presentes" className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Presentes</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{resumo.presentesTotal}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Em posto de trabalho</span>
        </div>

        {/* 3. Ausentes */}
        <div id="card-ausentes" className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ausentes</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700">{resumo.ausentesTotal}</p>
          <span className="text-[10px] text-rose-600 font-medium">Faltas não justificadas</span>
        </div>

        {/* 4. Férias */}
        <div id="card-ferias" className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/20">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Férias</span>
            <Palmtree className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">{resumo.feriasTotal}</p>
          <span className="text-[10px] text-blue-600 font-medium">Período regular</span>
        </div>

        {/* 5. Atestados */}
        <div id="card-atestados" className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Atestados</span>
            <FileHeart className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{resumo.atestadosTotal}</p>
          <span className="text-[10px] text-amber-600 font-medium">Afastamentos médicos</span>
        </div>

        {/* 6. Pendentes */}
        <div id="card-pendentes" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pendentes</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-700">{resumo.pendentesTotal}</p>
          <span className="text-[10px] text-slate-500">Aguardando registro</span>
        </div>

        {/* 7. Presença % */}
        <div id="card-presenca-percentual" className={`bg-white p-3.5 rounded-xl border ${statusGeralStyle.border} shadow-2xs col-span-2 sm:col-span-1`}>
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Presença %</span>
            <Percent className="w-4 h-4 text-slate-500" />
          </div>
          <p className={`text-2xl font-bold ${statusGeralStyle.text}`}>
            {resumo.percentualGeral}%
          </p>
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase">
            <span className={`w-1.5 h-1.5 rounded-full ${statusGeralStyle.indicator}`}></span>
            <span className={statusGeralStyle.text}>{resumo.statusGeral}</span>
          </div>
        </div>
      </div>

      {/* Alertas do Dia (Requirement 27) */}
      <div id="container-alertas-dia" className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Alertas Operacionais do Dia</span>
          </h3>
          <span className="text-[11px] text-slate-500">{resumo.alertas.length} ocorrência(s) detectada(s)</span>
        </div>

        {resumo.alertas.length === 0 ? (
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Operação 100% regular. Não existem pendências ou ausências críticas registradas para hoje.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {resumo.alertas.map(alerta => (
              <div 
                key={alerta.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                  alerta.tipo === 'alerta'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : alerta.tipo === 'aviso'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-blue-50/70 border-blue-200 text-blue-900'
                }`}
              >
                {alerta.tipo === 'alerta' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : alerta.tipo === 'aviso' ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{alerta.mensagem}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cards por Setor (Requirement 25: Gerados Dinamicamente, ex: 5°A, 5°B, 6°A, 6°B, 7°A, 7°B, 8°A...) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>SITUAÇÃO POR SETOR HOSPITALAR</span>
            </h3>
            <p className="text-xs text-slate-500">Clique em qualquer setor para filtrar a escala e visualizar os profissionais</p>
          </div>

          <button
            onClick={() => onNavigateToEscala()}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors"
          >
            <span>Ver Escala Geral Completa</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumo.setores.map(setor => {
            const statusStyle = getStatusColor(setor.status);
            return (
              <div
                key={setor.setor_id}
                id={`card-setor-${setor.setor_nome}`}
                onClick={() => onNavigateToEscala(setor.setor_id)}
                className={`bg-white rounded-xl border ${statusStyle.border} p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                      <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                        Setor {setor.setor_nome}
                      </h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusStyle.badge}`}>
                      {setor.status}
                    </span>
                  </div>

                  {/* Indicadores do Setor */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                    <div className="p-1 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500 uppercase block">Escalados</span>
                      <strong className="text-sm text-slate-800">{setor.escalados}</strong>
                    </div>
                    <div className="p-1 rounded bg-emerald-50">
                      <span className="text-[10px] text-emerald-600 uppercase block">Presentes</span>
                      <strong className="text-sm text-emerald-700">{setor.presentes}</strong>
                    </div>
                    <div className="p-1 rounded bg-rose-50">
                      <span className="text-[10px] text-rose-600 uppercase block">Ausentes</span>
                      <strong className="text-sm text-rose-700">{setor.ausentes}</strong>
                    </div>
                  </div>

                  {/* Detalhes Secundários */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5">
                    <span>Férias: <strong className="text-slate-700">{setor.ferias}</strong></span>
                    <span>Atestados: <strong className="text-slate-700">{setor.atestados}</strong></span>
                    <span>Pendentes: <strong className="text-slate-700">{setor.pendentes}</strong></span>
                  </div>
                </div>

                {/* Barra de Progresso e Presença % */}
                <div className="mt-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                    <span className="text-slate-600">Presença Efetiva:</span>
                    <span className={statusStyle.text}>{setor.percentualPresenca}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${statusStyle.indicator} transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(0, setor.percentualPresenca))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
