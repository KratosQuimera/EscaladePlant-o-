import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  BarChart3, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileHeart,
  Palmtree
} from 'lucide-react';
import { User as AppUser, SituacaoPlantao } from '../types';
import { db } from '../services/db';
import { obterResumoDia } from '../services/presence';

interface RelatoriosViewProps {
  currentUser: AppUser | null;
  selectedDate: string;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  currentUser,
  selectedDate,
}) => {
  const [tipoRelatorio, setTipoRelatorio] = useState<'DIARIO' | 'SETOR' | 'PROFISSIONAL' | 'FERIAS_ATESTADOS'>('DIARIO');
  const [selectedSetorId, setSelectedSetorId] = useState<string>('TODOS');
  const [dataInicio, setDataInicio] = useState(selectedDate);
  const [dataFim, setDataFim] = useState(selectedDate);

  const setores = db.getSetores();
  const cargos = db.getCargos();
  const profissionais = db.getProfissionais(currentUser?.tipo_acesso);
  const todasEscalas = db.getEscalas();
  const todosPlantao = db.getPlantaoRegistros();
  const todosAfastamentos = db.getAfastamentos();

  const resumoDia = obterResumoDia(selectedDate, currentUser?.tipo_acesso);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let fileName = `relatorio_${tipoRelatorio.toLowerCase()}_${selectedDate}.csv`;

    if (tipoRelatorio === 'DIARIO') {
      headers = ['Setor', 'Escalados', 'Presentes', 'Ausentes', 'Ferias', 'Atestados', 'Pendentes', 'PercentualPresenca', 'Status'];
      rows = resumoDia.setores.map(s => [
        `"Setor ${s.setor_nome}"`,
        String(s.escalados),
        String(s.presentes),
        String(s.ausentes),
        String(s.ferias),
        String(s.atestados),
        String(s.pendentes),
        `${s.percentualPresenca}%`,
        s.status,
      ]);
    } else if (tipoRelatorio === 'FERIAS_ATESTADOS') {
      headers = ['Profissional', 'Matricula', 'Tipo', 'DataInicio', 'DataFim', 'ObservacaoADM'];
      rows = todosAfastamentos.map(a => {
        const prof = profissionais.find(p => p.id === a.profissional_id);
        return [
          `"${prof?.nome_completo || ''}"`,
          prof?.matricula || '',
          a.tipo,
          a.data_inicio,
          a.data_fim,
          `"${a.observacao || ''}"`,
        ];
      });
    } else {
      headers = ['Data', 'Profissional', 'Matricula', 'Cargo', 'Setor', 'Turno', 'Situacao'];
      const escalasFiltradas = todasEscalas.filter(e => {
        if (selectedSetorId !== 'TODOS' && e.setor_id !== selectedSetorId) return false;
        return e.data >= dataInicio && e.data <= dataFim;
      });

      rows = escalasFiltradas.map(e => {
        const prof = profissionais.find(p => p.id === e.profissional_id);
        const cargo = cargos.find(c => c.id === e.cargo_id);
        const setor = setores.find(s => s.id === e.setor_id);
        const reg = todosPlantao.find(r => r.escala_id === e.id);
        return [
          e.data,
          `"${prof?.nome_completo || ''}"`,
          prof?.matricula || '',
          `"${cargo?.nome || ''}"`,
          `"Setor ${setor?.nome || ''}"`,
          e.turno,
          reg?.situacao || 'PENDENTE',
        ];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="relatorios-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header com botões de Exportação e Impressão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>CENTRAL DE RELATÓRIOS GERENCIAIS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geração de demonstrativos analíticos de plantões, assiduidade e afastamentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir / Salvar PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Dados (CSV)</span>
          </button>
        </div>
      </div>

      {/* Seleção do Tipo de Relatório */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setTipoRelatorio('DIARIO')}
          className={`p-3 rounded-xl border text-left transition-all ${
            tipoRelatorio === 'DIARIO'
              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-bold text-slate-800 block">Relatório Diário Geral</span>
          <span className="text-[11px] text-slate-500">Balanço do dia e setores</span>
        </button>

        <button
          onClick={() => setTipoRelatorio('SETOR')}
          className={`p-3 rounded-xl border text-left transition-all ${
            tipoRelatorio === 'SETOR'
              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-bold text-slate-800 block">Relatório por Setor</span>
          <span className="text-[11px] text-slate-500">Filtro por ala ou setor</span>
        </button>

        <button
          onClick={() => setTipoRelatorio('PROFISSIONAL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            tipoRelatorio === 'PROFISSIONAL'
              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-bold text-slate-800 block">Assiduidade da Equipe</span>
          <span className="text-[11px] text-slate-500">Presenças e ausências</span>
        </button>

        <button
          onClick={() => setTipoRelatorio('FERIAS_ATESTADOS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            tipoRelatorio === 'FERIAS_ATESTADOS'
              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-bold text-slate-800 block">Férias e Atestados</span>
          <span className="text-[11px] text-slate-500">Afastamentos legais</span>
        </button>
      </div>

      {/* Filtros Contextuais */}
      {tipoRelatorio !== 'DIARIO' && (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Período:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
            />
            <span>até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
            />
          </div>

          {tipoRelatorio === 'SETOR' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Setor:</span>
              <select
                value={selectedSetorId}
                onChange={(e) => setSelectedSetorId(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer font-medium"
              >
                <option value="TODOS">Todos os Setores</option>
                {setores.map(s => (
                  <option key={s.id} value={s.id}>Setor {s.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Formatado para Visualização e Impressão */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 print:p-0 print:border-none">
        {/* Cabeçalho do Documento Impresso */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              Hospital Municipal & Pronto Atendimento
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              SISTEMA DE GESTÃO, ESCALA E MONITORAMENTO DE PLANTÕES
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Data do Relatório: <strong>{selectedDate.split('-').reverse().join('/')}</strong></p>
            <p>Emitido por: {currentUser?.nome || 'Administrador'}</p>
          </div>
        </div>

        {/* RELATÓRIO 1: DIÁRIO GERAL */}
        {tipoRelatorio === 'DIARIO' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Escalados</span>
                <p className="text-lg font-bold text-slate-800">{resumoDia.escaladosTotal}</p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 uppercase">Presentes</span>
                <p className="text-lg font-bold text-emerald-700">{resumoDia.presentesTotal}</p>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 uppercase">Ausentes</span>
                <p className="text-lg font-bold text-rose-700">{resumoDia.ausentesTotal}</p>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 uppercase">Férias</span>
                <p className="text-lg font-bold text-blue-700">{resumoDia.feriasTotal}</p>
              </div>
              <div>
                <span className="text-[10px] text-amber-600 uppercase">Atestados</span>
                <p className="text-lg font-bold text-amber-700">{resumoDia.atestadosTotal}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase">Presença %</span>
                <p className="text-lg font-bold text-emerald-700">{resumoDia.percentualGeral}%</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Demonstrativo Analítico por Setor Hospitalar
              </h3>
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-2 border-r border-slate-200">Setor</th>
                    <th className="p-2 text-center border-r border-slate-200">Escalados</th>
                    <th className="p-2 text-center border-r border-slate-200">Presentes</th>
                    <th className="p-2 text-center border-r border-slate-200">Ausentes</th>
                    <th className="p-2 text-center border-r border-slate-200">Férias</th>
                    <th className="p-2 text-center border-r border-slate-200">Atestados</th>
                    <th className="p-2 text-center border-r border-slate-200">Pendentes</th>
                    <th className="p-2 text-center border-r border-slate-200">Presença %</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {resumoDia.setores.map(s => (
                    <tr key={s.setor_id} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-200">Setor {s.setor_nome}</td>
                      <td className="p-2 text-center border-r border-slate-200">{s.escalados}</td>
                      <td className="p-2 text-center text-emerald-700 font-bold border-r border-slate-200">{s.presentes}</td>
                      <td className="p-2 text-center text-rose-700 font-bold border-r border-slate-200">{s.ausentes}</td>
                      <td className="p-2 text-center text-blue-700 border-r border-slate-200">{s.ferias}</td>
                      <td className="p-2 text-center text-amber-700 border-r border-slate-200">{s.atestados}</td>
                      <td className="p-2 text-center text-slate-500 border-r border-slate-200">{s.pendentes}</td>
                      <td className="p-2 text-center font-bold border-r border-slate-200">{s.percentualPresenca}%</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' :
                          s.status === 'ATENÇÃO' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RELATÓRIO 2: FÉRIAS E ATESTADOS */}
        {tipoRelatorio === 'FERIAS_ATESTADOS' && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Mapeamento de Férias e Afastamentos Médicos Registrados
            </h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200">Profissional</th>
                  <th className="p-2 border-r border-slate-200">Matrícula</th>
                  <th className="p-2 border-r border-slate-200">Tipo de Afastamento</th>
                  <th className="p-2 text-center border-r border-slate-200">Período Inicial</th>
                  <th className="p-2 text-center border-r border-slate-200">Período Final</th>
                  <th className="p-2">Observação ADM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {todosAfastamentos.map(a => {
                  const prof = profissionais.find(p => p.id === a.profissional_id);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{prof?.nome_completo}</td>
                      <td className="p-2 font-mono text-slate-600 border-r border-slate-200">{prof?.matricula}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          a.tipo === 'FÉRIAS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {a.tipo}
                        </span>
                      </td>
                      <td className="p-2 text-center border-r border-slate-200">{a.data_inicio.split('-').reverse().join('/')}</td>
                      <td className="p-2 text-center border-r border-slate-200">{a.data_fim.split('-').reverse().join('/')}</td>
                      <td className="p-2 text-slate-600">{a.observacao || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* RELATÓRIO 3 / 4: SETOR OU PROFISSIONAL */}
        {(tipoRelatorio === 'SETOR' || tipoRelatorio === 'PROFISSIONAL') && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Listagem Operacional de Escalas e Ocorrências ({dataInicio} até {dataFim})
            </h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200">Data</th>
                  <th className="p-2 border-r border-slate-200">Profissional</th>
                  <th className="p-2 border-r border-slate-200">Cargo</th>
                  <th className="p-2 border-r border-slate-200">Setor</th>
                  <th className="p-2 border-r border-slate-200">Turno</th>
                  <th className="p-2 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {todasEscalas
                  .filter(e => {
                    if (selectedSetorId !== 'TODOS' && e.setor_id !== selectedSetorId) return false;
                    return e.data >= dataInicio && e.data <= dataFim;
                  })
                  .map(e => {
                    const prof = profissionais.find(p => p.id === e.profissional_id);
                    const cargo = cargos.find(c => c.id === e.cargo_id);
                    const setor = setores.find(s => s.id === e.setor_id);
                    const reg = todosPlantao.find(r => r.escala_id === e.id);
                    const sit = reg ? reg.situacao : 'PENDENTE';

                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 font-mono">{e.data.split('-').reverse().join('/')}</td>
                        <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{prof?.nome_completo}</td>
                        <td className="p-2 border-r border-slate-200">{cargo?.nome}</td>
                        <td className="p-2 border-r border-slate-200">Setor {setor?.nome}</td>
                        <td className="p-2 border-r border-slate-200 uppercase">{e.turno}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            sit === 'PRESENTE' ? 'bg-emerald-100 text-emerald-800' :
                            sit === 'AUSENTE' ? 'bg-rose-100 text-rose-800' :
                            sit === 'FÉRIAS' ? 'bg-blue-100 text-blue-800' :
                            sit === 'ATESTADO' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sit}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
