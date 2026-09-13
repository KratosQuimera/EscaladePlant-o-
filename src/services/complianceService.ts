import { Escala, Profissional, PeriodoAfastamento, RestricaoIndisponibilidade, ComplianceAlert } from '../types';

export type { ComplianceAlert };

/**
 * Calcula a diferença em horas entre o fim do turno anterior e o início do próximo turno.
 */
function calcularDiferencaHoras(dataFim: string, horaFim: string, dataInicio: string, horaInicio: string): number {
  try {
    const dtFim = new Date(`${dataFim}T${horaFim}:00`);
    const dtInicio = new Date(`${dataInicio}T${horaInicio}:00`);
    const diffMs = dtInicio.getTime() - dtFim.getTime();
    return diffMs / (1000 * 60 * 60);
  } catch {
    return 24;
  }
}

/**
 * Verifica sobreposição de horário entre dois intervalos no mesmo dia.
 */
function temSobreposicao(ini1: string, fim1: string, ini2: string, fim2: string): boolean {
  const toMin = (h: string) => {
    const [hrs, mins] = h.split(':').map(Number);
    return (hrs || 0) * 60 + (mins || 0);
  };
  const start1 = toMin(ini1);
  const end1 = toMin(fim1) <= start1 ? toMin(fim1) + 24 * 60 : toMin(fim1);
  const start2 = toMin(ini2);
  const end2 = toMin(fim2) <= start2 ? toMin(fim2) + 24 * 60 : toMin(fim2);

  return Math.max(start1, start2) < Math.min(end1, end2);
}

export function analisarComplianceEscalas(
  todasEscalas: Escala[],
  profissionais: Profissional[],
  afastamentos: PeriodoAfastamento[] = [],
  indisponibilidades: RestricaoIndisponibilidade[] = [],
  dataFiltro?: string
): ComplianceAlert[] {
  const alertas: ComplianceAlert[] = [];
  const profMap = new Map<string, Profissional>(profissionais.map(p => [p.id, p]));

  // Agrupar escalas por profissional
  const escalasPorProf = new Map<string, Escala[]>();
  todasEscalas.forEach(e => {
    if (!escalasPorProf.has(e.profissional_id)) {
      escalasPorProf.set(e.profissional_id, []);
    }
    escalasPorProf.get(e.profissional_id)!.push(e);
  });

  // Analisar cada profissional
  escalasPorProf.forEach((escalasDoProf, profId) => {
    const prof = profMap.get(profId);
    const profNome = prof?.nome_completo || 'Profissional';

    // Ordenar cronologicamente
    const ordenadas = [...escalasDoProf].sort((a, b) => {
      const cmpData = a.data.localeCompare(b.data);
      if (cmpData !== 0) return cmpData;
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });

    // 1. Verificar sobreposições no mesmo dia e interjornada consecutiva
    for (let i = 0; i < ordenadas.length; i++) {
      const atual = ordenadas[i];

      // Se filtro de data estiver ativo, checar se este ou o vizinho envolve a data
      if (dataFiltro && atual.data !== dataFiltro) {
        continue;
      }

      // Checar se o mesmo profissional está escalado duas vezes no mesmo dia
      for (let j = i + 1; j < ordenadas.length; j++) {
        const prox = ordenadas[j];
        if (prox.data !== atual.data) break; // Só compara mesmo dia aqui

        if (temSobreposicao(atual.hora_inicio, atual.hora_fim, prox.hora_inicio, prox.hora_fim)) {
          alertas.push({
            id: `conf-${atual.id}-${prox.id}`,
            nivel: 'CRITICO',
            severidade: 'CRITICO',
            tipo: 'SOBREPOSICAO',
            profissionalId: profId,
            profissional_id: profId,
            profissionalNome: profNome,
            profissional_nome: profNome,
            data: atual.data,
            data_escala: atual.data,
            escala_id: atual.id,
            mensagem: `Conflito de Turnos Sobrepostos em ${atual.data.split('-').reverse().join('/')}`,
            detalhes: `${profNome} está escalado(a) simultaneamente em dois postos com horários sobrepostos (${atual.hora_inicio} às ${atual.hora_fim} e ${prox.hora_inicio} às ${prox.hora_fim}).`,
            sugestao: 'Substituir profissional em um dos postos ou ajustar o horário do turno.',
          });
        }
      }

      // 2. Intervalo Interjornada Mínimo (< 11 horas) - Art. 66 da CLT
      if (i > 0) {
        const anterior = ordenadas[i - 1];
        const horasDescanso = calcularDiferencaHoras(anterior.data, anterior.hora_fim, atual.data, atual.hora_inicio);

        if (horasDescanso >= 0 && horasDescanso < 11) {
          alertas.push({
            id: `inter-${anterior.id}-${atual.id}`,
            nivel: 'CRITICO',
            severidade: 'CRITICO',
            tipo: 'INTERJORNADA',
            profissionalId: profId,
            profissional_id: profId,
            profissionalNome: profNome,
            profissional_nome: profNome,
            data: atual.data,
            data_escala: atual.data,
            escala_id: atual.id,
            mensagem: `Descanso Interjornada Insuficiente (${horasDescanso.toFixed(1)}h < 11h)`,
            detalhes: `${profNome} sai do plantão anterior em ${anterior.data.split('-').reverse().join('/')} às ${anterior.hora_fim} e já inicia o próximo em ${atual.data.split('-').reverse().join('/')} às ${atual.hora_inicio}. Intervalo de apenas ${horasDescanso.toFixed(1)} horas (mínimo legal CLT Art. 66: 11h).`,
            sugestao: 'Realocar o plantão para garantir intervalo mínimo de descanso de 11 horas.',
          });
        }
      }

      // 3. Teto de Horas Consecutivas (> 24h sem intervalo)
      if (i > 0) {
        const anterior = ordenadas[i - 1];
        const intervalo = calcularDiferencaHoras(anterior.data, anterior.hora_fim, atual.data, atual.hora_inicio);
        if (intervalo <= 1) {
          alertas.push({
            id: `teto-${anterior.id}-${atual.id}`,
            nivel: 'ALERTA',
            severidade: 'ALERTA',
            tipo: 'TETO_HORAS',
            profissionalId: profId,
            profissional_id: profId,
            profissionalNome: profNome,
            profissional_nome: profNome,
            data: atual.data,
            data_escala: atual.data,
            escala_id: atual.id,
            mensagem: `Atenção: Plantões Consecutivos / Risco de Fadiga`,
            detalhes: `${profNome} emendou turnos consecutivos (${anterior.turno} + ${atual.turno}) totalizando 24h contínuas de plantão. Recomenda-se acompanhamento de fadiga.`,
            sugestao: 'Avaliar troca voluntária para evitar sobrecarga e riscos assistenciais.',
          });
        }
      }

      // 4. Afastamento ativo (Férias ou Atestado)
      const dataEscalaObj = new Date(atual.data);
      const afastamentoAtivo = afastamentos.find(af => {
        if (af.profissional_id !== profId) return false;
        const ini = new Date(af.data_inicio);
        const fim = new Date(af.data_fim);
        return dataEscalaObj >= ini && dataEscalaObj <= fim;
      });

      if (afastamentoAtivo) {
        alertas.push({
          id: `afast-${afastamentoAtivo.id}-${atual.id}`,
          nivel: 'CRITICO',
          severidade: 'CRITICO',
          tipo: 'AFASTAMENTO',
          profissionalId: profId,
          profissional_id: profId,
          profissionalNome: profNome,
          profissional_nome: profNome,
          data: atual.data,
          data_escala: atual.data,
          escala_id: atual.id,
          mensagem: `Escalado durante ${afastamentoAtivo.tipo}`,
          detalhes: `${profNome} possui período de ${afastamentoAtivo.tipo} registrado de ${afastamentoAtivo.data_inicio.split('-').reverse().join('/')} a ${afastamentoAtivo.data_fim.split('-').reverse().join('/')}.`,
          sugestao: 'Substituir escala por profissional disponível ou abrir vaga no banco de trocas.',
        });
      }

      // 5. Indisponibilidade Prévia Cadastrada
      const restricao = indisponibilidades.find(r => {
        if (r.profissional_id !== profId || r.data !== atual.data) return false;
        if (r.periodo === 'DIA_TODO') return true;
        if (r.periodo === atual.turno) return true;
        if ((r.periodo === 'MANHÃ' || r.periodo === 'TARDE') && atual.turno === 'DIURNO') return true;
        if (r.periodo === 'NOITE' && atual.turno === 'NOTURNO') return true;
        return false;
      });

      if (restricao) {
        alertas.push({
          id: `restr-${restricao.id}-${atual.id}`,
          nivel: 'ALERTA',
          severidade: 'ALERTA',
          tipo: 'INDISPONIBILIDADE',
          profissionalId: profId,
          profissional_id: profId,
          profissionalNome: profNome,
          profissional_nome: profNome,
          data: atual.data,
          data_escala: atual.data,
          escala_id: atual.id,
          mensagem: `Indisponibilidade Prévia Cadastrada`,
          detalhes: `${profNome} cadastrou indisponibilidade para ${atual.data.split('-').reverse().join('/')} (${restricao.periodo}). Motivo: "${restricao.motivo}".`,
          sugestao: 'Verificar justificativa do colaborador e readequar a grade de escalas.',
        });
      }
    }
  });

  return alertas;
}

export const complianceService = {
  analisarComplianceEscalas,
};

