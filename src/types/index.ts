export type UserRole = 'ADM' | 'PADRÃO' | 'PADRAO';

export interface User {
  id: string;
  nome: string;
  login: string;
  senhaHash?: string;
  tipo_acesso: UserRole;
  ativo: boolean;
  status?: 'ATIVO' | 'INATIVO';
  deve_alterar_senha: boolean;
  profissional_id?: string;
  criado_em: string;
  ultimo_login?: string;
}

export interface Setor {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  criado_em: string;
}

export interface Cargo {
  id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
}

export interface Profissional {
  id: string;
  nome_completo: string;
  matricula: string;
  cargo_id: string;
  setor_id: string;
  telefone?: string;
  email?: string;
  status: 'ATIVO' | 'INATIVO';
  observacao?: string; // Campo sensível
  // Acesso e usuário vinculado no sistema
  usuario_id?: string;
  tipo_usuario?: 'SEM_ACESSO' | 'ADM' | 'PADRÃO';
  login_usuario?: string;
  criado_em: string;
}

export type TipoEscala = 
  | 'TRABALHO'
  | 'FOLGA'
  | 'FÉRIAS'
  | 'ATESTADO'
  | 'AFASTAMENTO'
  | 'TREINAMENTO'
  | 'OUTRO';

export type Turno = 'MANHÃ' | 'TARDE' | 'NOITE' | 'DIURNO' | 'NOTURNO';

export interface Escala {
  id: string;
  data: string; // YYYY-MM-DD
  setor_id: string;
  profissional_id: string;
  cargo_id: string;
  turno: Turno;
  hora_inicio: string;
  hora_fim: string;
  tipo_escala: TipoEscala;
  observacao?: string; // Campo sensível
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export type SituacaoPlantao = 
  | 'PRESENTE'
  | 'AUSENTE'
  | 'FÉRIAS'
  | 'ATESTADO'
  | 'FOLGA'
  | 'AFASTADO'
  | 'PENDENTE';

export interface PlantaoRegistro {
  id: string;
  escala_id: string;
  data: string; // YYYY-MM-DD
  profissional_id: string;
  setor_id: string;
  situacao: SituacaoPlantao;
  motivo_ausencia?: string; // Campo sensível
  observacao?: string;
  observacao_adm?: string; // Campo sensível
  registrado_por: string;
  horario_registro?: string;
  registrado_em: string;
}

export interface PeriodoAfastamento {
  id: string;
  tipo: 'FÉRIAS' | 'ATESTADO';
  profissional_id: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  observacao?: string;
  observacao_adm?: string; // Campo sensível (sem diagnóstico clínico)
  registrado_por: string;
  registrado_em: string;
}

export interface RegistroAuditoria {
  id: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_login: string;
  data_hora: string;
  acao: string;
  tabela: string;
  registro_id: string;
  detalhes: string;
  ip: string;
  valor_anterior?: string;
  novo_valor?: string;
}

export interface IndicadoresSetor {
  setor_id: string;
  setor_nome: string;
  escalados: number;
  presentes: number;
  ausentes: number;
  ferias: number;
  atestados: number;
  pendentes: number;
  percentualPresenca: number;
  status: 'NORMAL' | 'ATENÇÃO' | 'CRÍTICO';
}

export interface ResumoDia {
  data: string;
  escaladosTotal: number;
  presentesTotal: number;
  ausentesTotal: number;
  feriasTotal: number;
  atestadosTotal: number;
  pendentesTotal: number;
  deveriamTrabalhar: number;
  percentualGeral: number;
  statusGeral: 'NORMAL' | 'ATENÇÃO' | 'CRÍTICO';
  alertas: {
    id: string;
    tipo: 'alerta' | 'aviso' | 'info';
    mensagem: string;
    sensivel: boolean;
  }[];
  setores: IndicadoresSetor[];
}
