import { db } from './db';
import { IndicadoresSetor, ResumoDia, SituacaoPlantao, UserRole } from '../types';

export function calcularStatusPresenca(percentual: number): 'NORMAL' | 'ATENÇÃO' | 'CRÍTICO' {
  if (percentual >= 90) return 'NORMAL';
  if (percentual >= 80) return 'ATENÇÃO';
  return 'CRÍTICO';
}

export function obterResumoDia(dataStr: string, userRole: UserRole = 'ADM'): ResumoDia {
  const setores = db.getSetores().filter(s => s.ativo);
  const escalas = db.getEscalas(dataStr);
  const plantaoRegistros = db.getPlantaoRegistros(dataStr);

  let escaladosTotal = 0;
  let presentesTotal = 0;
  let ausentesTotal = 0;
  let feriasTotal = 0;
  let atestadosTotal = 0;
  let pendentesTotal = 0;

  const setoresCalculados: IndicadoresSetor[] = setores.map(setor => {
    const escalasSetor = escalas.filter(e => e.setor_id === setor.id);
    const escalados = escalasSetor.length;

    let presentes = 0;
    let ausentes = 0;
    let ferias = 0;
    let atestados = 0;
    let pendentes = 0;

    escalasSetor.forEach(escala => {
      const reg = plantaoRegistros.find(r => r.escala_id === escala.id);
      const situacao: SituacaoPlantao = reg ? reg.situacao : 'PENDENTE';

      if (situacao === 'PRESENTE') presentes++;
      else if (situacao === 'AUSENTE') ausentes++;
      else if (situacao === 'FÉRIAS') ferias++;
      else if (situacao === 'ATESTADO') atestados++;
      else pendentes++;
    });

    escaladosTotal += escalados;
    presentesTotal += presentes;
    ausentesTotal += ausentes;
    feriasTotal += ferias;
    atestadosTotal += atestados;
    pendentesTotal += pendentes;

    // Regra de Cálculo Oficial:
    // Deveriam trabalhar = escalados - (ferias + atestados + afastamentos + folgas)
    const deveriamTrabalharSetor = Math.max(0, escalados - (ferias + atestados));
    const percentualSetor = deveriamTrabalharSetor > 0 
      ? Number(((presentes / deveriamTrabalharSetor) * 100).toFixed(1))
      : 100;

    return {
      setor_id: setor.id,
      setor_nome: setor.nome,
      escalados,
      presentes,
      ausentes,
      ferias,
      atestados,
      pendentes,
      percentualPresenca: percentualSetor,
      status: calcularStatusPresenca(percentualSetor),
    };
  });

  const deveriamTrabalharGeral = Math.max(0, escaladosTotal - (feriasTotal + atestadosTotal));
  const percentualGeral = deveriamTrabalharGeral > 0
    ? Number(((presentesTotal / deveriamTrabalharGeral) * 100).toFixed(1))
    : 100;

  // Geração de Alertas Dinâmicos do Dia
  const alertas: ResumoDia['alertas'] = [];

  if (pendentesTotal > 0) {
    alertas.push({
      id: 'alt-pendentes',
      tipo: 'aviso',
      mensagem: `${pendentesTotal} profissional(is) ainda com status pendente de confirmação.`,
      sensivel: false,
    });
  }

  setoresCalculados.forEach(s => {
    if (s.ausentes > 0) {
      alertas.push({
        id: `alt-aus-${s.setor_id}`,
        tipo: 'alerta',
        mensagem: `Setor ${s.setor_nome} possui ${s.ausentes} ausência(s) registrada(s).`,
        sensivel: false,
      });
    }

    if (s.status === 'CRÍTICO') {
      alertas.push({
        id: `alt-crit-${s.setor_id}`,
        tipo: 'alerta',
        mensagem: `Setor ${s.setor_nome} está abaixo do índice mínimo operacional (${s.percentualPresenca}%).`,
        sensivel: false,
      });
    }
  });

  if (feriasTotal > 0) {
    alertas.push({
      id: 'alt-ferias',
      tipo: 'info',
      mensagem: `${feriasTotal} profissional(is) em período regular de férias hoje.`,
      sensivel: false,
    });
  }

  if (atestadosTotal > 0) {
    alertas.push({
      id: 'alt-atestados',
      tipo: 'info',
      mensagem: userRole === 'ADM'
        ? `${atestadosTotal} profissional(is) afastado(s) por atestado médico homologado.`
        : `${atestadosTotal} profissional(is) com atestado registrado.`,
      sensivel: false,
    });
  }

  return {
    data: dataStr,
    escaladosTotal,
    presentesTotal,
    ausentesTotal,
    feriasTotal,
    atestadosTotal,
    pendentesTotal,
    deveriamTrabalhar: deveriamTrabalharGeral,
    percentualGeral,
    statusGeral: calcularStatusPresenca(percentualGeral),
    alertas,
    setores: setoresCalculados,
  };
}
