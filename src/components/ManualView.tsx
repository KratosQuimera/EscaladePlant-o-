import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Clock, 
  ArrowLeftRight, 
  UserCheck, 
  CalendarDays, 
  Share2, 
  Smartphone, 
  ShieldAlert, 
  HelpCircle, 
  ChevronRight,
  Sparkles,
  Users,
  HardDrive,
  Copy,
  Check
} from 'lucide-react';
import { User } from '../types';

interface ManualViewProps {
  currentUser: User;
  onNavigateTab?: (tabId: string) => void;
}

interface SecaoManual {
  id: string;
  titulo: string;
  categoria: string;
  icone: any;
  resumo: string;
  destaque?: string;
  passos: string[];
  dicas?: string[];
  regras?: string[];
}

export const ManualView: React.FC<ManualViewProps> = ({ currentUser, onNavigateTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TODAS');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const categorias = [
    { id: 'TODAS', label: 'Todas as Áreas' },
    { id: 'INICIO', label: '🚀 Início Rápido' },
    { id: 'ESCALA', label: '📋 Escala Diária' },
    { id: 'COMPLIANCE', label: '⚖️ Regras & CLT' },
    { id: 'TROCAS', label: '🔄 Trocas de Plantão' },
    { id: 'PORTAL', label: '👤 Portal Colaborador' },
    { id: 'WHATSAPP', label: '💬 WhatsApp' },
    { id: 'PWA', label: '📱 Instalação App' },
    { id: 'ADMIN', label: '🛡️ Gestão & Auditoria' },
    { id: 'FAQ', label: '❓ Dúvidas Frequentes' },
  ];

  const secoes: SecaoManual[] = [
    {
      id: 'login-perfis',
      titulo: 'Primeiro Acesso e Perfis de Permissão',
      categoria: 'INICIO',
      icone: Users,
      resumo: 'Conheça os níveis de acesso disponíveis no sistema e como realizar login com segurança.',
      destaque: 'O sistema utiliza controle baseado em funções (RBAC). Administradores possuem controle total, enquanto plantonistas acessam suas escalas e o fluxo de trocas.',
      passos: [
        'Ao acessar o sistema pela primeira vez ou após efetuar logout, informe seu usuário e senha no formulário.',
        'Perfis e credenciais padrão: admin (Administrador), gestor (Coordenação/Gestor) e padrao (Plantonista/Padrão) — senha inicial padrão: esc@l@.',
        'Dependendo do tipo de usuário (ADM, GESTOR ou PADRÃO), o menu lateral, os painéis e as permissões de edição se adaptam automaticamente.',
        'Após entrar, você pode alterar sua senha a qualquer momento clicando no botão "Senha" no rodapé do menu lateral.'
      ],
      dicas: [
        'Mantenha seu e-mail e telefone de WhatsApp sempre atualizados no cadastro para receber avisos.',
        'Sessões ativas são monitoradas para garantir a segurança dos registros clínicos e operacionais.'
      ]
    },
    {
      id: 'gestao-escala-diaria',
      titulo: 'Operação da Escala Diária & Registro de Presenças',
      categoria: 'ESCALA',
      icone: Clock,
      resumo: 'Passo a passo para consultar a grade do dia, registrar quem compareceu, ausências, férias e atestados.',
      destaque: 'Todos os registros de presença ou ausência geram carimbo de data, hora e responsável na trilha de auditoria imutável.',
      passos: [
        'Selecione a data desejada no seletor do cabeçalho ou use as setas de navegação rápida.',
        'Utilize os filtros por Setor (UTI, Pronto Atendimento, etc.), Cargo ou Turno (Diurno/Noturno).',
        'Para registrar PRESENÇA: Clique no botão verde "Presente" na linha do profissional correspondente.',
        'Para registrar FALTA: Clique no botão "Ausente" e informe o motivo detalhado para registro administrativo.',
        'Para registrar FÉRIAS ou ATESTADO: Utilize os botões específicos informando o período de início/fim e CID quando aplicável.',
        'Para adicionar um novo plantão: Clique no botão superior "+ Novo Plantão", preencha os dados e confirme.'
      ],
      dicas: [
        'No celular, a tela se adapta automaticamente a cards verticais ergonômicos com botões de toque largo.',
        'A barra de busca rápida aceita pesquisa tanto pelo nome completo quanto pelo número de matrícula.'
      ]
    },
    {
      id: 'compliance-regras-trabalhistas',
      titulo: 'Motor de Compliance & Regras Trabalhistas (CLT)',
      categoria: 'COMPLIANCE',
      icone: AlertTriangle,
      resumo: 'Entenda como o sistema valida automaticamente o descanso interjornada de 11h, sobreposições e limites de fadiga.',
      destaque: 'A análise é contínua e em tempo real. O painel superior sinaliza conformidade 100% ou destaca as escalas com alertas imediatos.',
      passos: [
        'Observe o painel de conformidade no topo da grade de escalas.',
        'Quando houver inconformidades, um banner âmbar/vermelho indicará o número total de ocorrências.',
        'Clique em "Ver Detalhes" para ler a descrição jurídica do problema e a sugestão de correção automática.',
        'Na própria tabela ou nos cards, profissionais com inconformidade exibem a etiqueta "Regra".'
      ],
      regras: [
        'Artigo 66 da CLT: Descanso mínimo obrigatório de 11 horas consecutivas entre dois plantões.',
        'Prevenção de Fadiga: Alerta disparado caso o colaborador some mais de 24 horas contínuas de plantão.',
        'Sobreposição de Horários: Bloqueio caso o mesmo profissional seja escalado em dois postos no mesmo horário.',
        'Afastamentos Legais: Conflito imediato se o colaborador for escalado durante período de licença médica ou férias.'
      ],
      dicas: [
        'A resolução de conflitos pode ser realizada substituindo o plantonista ou abrindo a vaga no banco de trocas.'
      ]
    },
    {
      id: 'fluxo-trocas-permutas',
      titulo: 'Central de Trocas e Permutas de Plantão',
      categoria: 'TROCAS',
      icone: ArrowLeftRight,
      resumo: 'Como solicitar trocas 1-para-1, doação de plantão ou vagas abertas com o fluxo de dupla anuência e homologação da coordenação.',
      destaque: 'Ao ser homologada pela coordenação, a escala oficial é invertida no banco de dados automaticamente, sem retrabalho manual.',
      passos: [
        'Para solicitar: Acesse o menu "Trocas & Permutas" ou clique no botão "Trocar" na linha da escala diária.',
        'Selecione o tipo: PERMUTA (troca com plantão específico do colega), DOAÇÃO (colega assume seu plantão) ou BANCO DE VAGAS.',
        'Informe a justificativa e confirme a solicitação.',
        'Aceite do Colega: O profissional destinatário entra no sistema e clica em "Aceitar Proposta".',
        'Homologação Final: O coordenador/administrador revisa e clica em "Homologar Troca".'
      ],
      dicas: [
        'Acompanhe o status em tempo real pelos selos coloridos: "Aguardando Colega", "Aguardando Coordenação" e "Aprovada".',
        'Solicitações com pendência de mais de 72 horas podem ser canceladas pelo próprio solicitante.'
      ]
    },
    {
      id: 'portal-do-colaborador',
      titulo: 'Portal do Colaborador & Confirmação de Ciência Digital',
      categoria: 'PORTAL',
      icone: UserCheck,
      resumo: 'Visão individual simplificada para consulta direta no smartphone e registro de ciência mensal formal da grade.',
      destaque: 'Elimine listas impressas assinadas à caneta com a confirmação digital com carimbo de data, hora e IP do colaborador.',
      passos: [
        'Abra o menu "Portal do Colaborador" (Meu Plantão).',
        'Selecione seu nome na listagem para carregar seu prontuário operacional.',
        'Visualize o card de destaque com a contagem regressiva para seu próximo turno e setor de apresentação.',
        'Consulte o calendário mensal com todos os seus plantões destacados em cor contrastante.',
        'Para confirmar ciência: Clique no botão "Confirmar Ciência da Escala", registrando formalmente o recebimento da escala.'
      ],
      dicas: [
        'Salve a página nos favoritos do celular ou instale como aplicativo para acesso diário com um toque.'
      ]
    },
    {
      id: 'indisponibilidades-pre-escala',
      titulo: 'Coleta de Indisponibilidades (Pré-Escala Mensal)',
      categoria: 'PORTAL',
      icone: CalendarDays,
      resumo: 'Como os profissionais comunicam com antecedência suas restrições de agenda para facilitar a montagem da escala.',
      destaque: 'O motor de compliance avisa o coordenador caso ele tente escalar um profissional em dia/turno previamente registrado como indisponível.',
      passos: [
        'Acesse a aba "Indisponibilidades".',
        'Clique no botão "+ Nova Indisponibilidade".',
        'Selecione a data, o período de impedimento (Manhã, Tarde, Noite ou Dia Todo) e forneça a justificativa.',
        'Clique em "Salvar Restrição". O registro constará na pré-escala daquele mês.'
      ],
      dicas: [
        'Cadastre as restrições até o dia limite estipulado pela coordenação do seu hospital (geralmente até dia 15 do mês anterior).'
      ]
    },
    {
      id: 'disparo-whatsapp',
      titulo: 'Comunicação e Disparo de Escalas via WhatsApp',
      categoria: 'WHATSAPP',
      icone: Share2,
      resumo: 'Envio rápido de escalas diárias e lembretes para os profissionais através da integração com a API do WhatsApp.',
      destaque: 'Mensagens pré-formatadas com emojis institucionais e todos os dados operacionais com link direto para o chat.',
      passos: [
        'Na tela de Escala Diária, clique no botão "Disparo WhatsApp" no topo.',
        'O sistema carrega os profissionais escalados para a data selecionada.',
        'Você pode filtrar por um setor específico (ex: Apenas UTI) ou manter todos.',
        'Clique em "Enviar WhatsApp" para abrir instantaneamente o chat com a mensagem preenchida.',
        'Ou clique em "Copiar Mensagem" para colar diretamente em grupos institucionais de comunicação.'
      ],
      dicas: [
        'Certifique-se de que o telefone do profissional contenha o DDD correto no cadastro.'
      ]
    },
    {
      id: 'instalacao-pwa',
      titulo: 'Instalação como Aplicativo Nativo (PWA & Offline)',
      categoria: 'PWA',
      icone: Smartphone,
      resumo: 'Como instalar o sistema no celular (Android e iOS) ou computador (Windows e Mac) com funcionamento offline.',
      destaque: 'Mesmo sem conexão com a internet, o sistema permanece acessível para consulta e registro de plantões.',
      passos: [
        'Clique no botão "Instalar App (PWA)" presente no cabeçalho da aplicação.',
        'No Android (Chrome): Clique em "Instalar" no diálogo que surge na tela.',
        'No iPhone (Safari): Toque no ícone de Compartilhar (quadrado com seta para cima) e selecione "Adicionar à Tela de Início".',
        'No Computador: Clique no ícone de instalação na barra de endereços do Chrome ou Edge.',
        'O ícone do sistema aparecerá junto aos demais aplicativos instalados no seu dispositivo.'
      ],
      dicas: [
        'O indicador de conectividade no topo avisa se você está online (verde) ou operando em cache local offline (laranja).'
      ]
    },
    {
      id: 'auditoria-backup-seguranca',
      titulo: 'Auditoria, Backups e Sincronização em Nuvem',
      categoria: 'ADMIN',
      icone: ShieldAlert,
      resumo: 'Ferramentas de segurança corporativa para rastreabilidade de ações e preservação do banco de dados.',
      destaque: 'Todos os registros sensíveis são sincronizados com a nuvem Firebase Firestore e contam com exportação manual em arquivo JSON.',
      passos: [
        'Para consultar logs: Acesse o menu "Auditoria" para filtrar ações por usuário, data ou tipo de operação.',
        'Para gerar cópia de segurança: Acesse "Backup & Dados" e clique em "Exportar Backup Completo (JSON)".',
        'Para restaurar dados: Arraste o arquivo JSON exportado na área demarcada de restauração.',
        'Sincronização em Nuvem: O status de conexão exibe o número de itens espelhados e pendências de envio.'
      ],
      dicas: [
        'Recomenda-se realizar o download do arquivo de backup mensalmente após o fechamento da folha de plantões.'
      ]
    },
    {
      id: 'faq-duvidas-comuns',
      titulo: 'Perguntas Frequentes & Resolução de Problemas (FAQ)',
      categoria: 'FAQ',
      icone: HelpCircle,
      resumo: 'Respostas para as dúvidas mais comuns de coordenadores e plantonistas.',
      destaque: 'Consulte estas orientações rápidas antes de abrir um chamado técnico de suporte.',
      passos: [
        'O que fazer se a internet cair durante a checagem de presença? Continue operando normalmente! O sistema armazenará tudo no dispositivo e sincronizará quando a rede voltar.',
        'Como cadastrar novos setores hospitalares? Acesse "Setores e Cargos" e clique em "+ Novo Setor". Defina o nome e a cor de identificação.',
        'Posso desfazer uma homologação de troca errada? Sim, um Administrador pode acessar o plantão na Escala Diária e reatribuir o profissional original.',
        'Como exportar a escala em PDF ou imprimir? Utilize o atalho de impressão (Ctrl+P ou botão Imprimir no Relatório) para gerar layout limpo padrão A4.'
      ],
      dicas: [
        'Para limpar filtros ativos rapidamente na Escala Diária, basta clicar no botão "Limpar Filtros" no topo dos seletores.'
      ]
    }
  ];

  // Filtragem de seções
  const secoesFiltradas = useMemo(() => {
    return secoes.filter(secao => {
      const matchCategoria = activeCategory === 'TODAS' || secao.categoria === activeCategory;
      const matchTexto = searchTerm.trim() === '' || 
        secao.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        secao.resumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        secao.passos.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (secao.dicas && secao.dicas.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())));
      return matchCategoria && matchTexto;
    });
  }, [activeCategory, searchTerm]);

  const handleCopySection = (secao: SecaoManual) => {
    const texto = `${secao.titulo}\n\n${secao.resumo}\n\nPassos:\n${secao.passos.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
    navigator.clipboard.writeText(texto);
    setCopiedSection(secao.id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Cabeçalho Principal do Manual */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 bg-emerald-100/80 text-emerald-800 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Manual de Uso & Documentação
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  v12.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Guia interativo completo de operação, regras trabalhistas CLT, fluxos de troca e instalação.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              id="btn-imprimir-manual"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Imprimir ou salvar manual em PDF"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa Rápida */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-busca-manual"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar no manual (ex: interjornada, trocar plantão, atestado, backup, senha)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded bg-slate-200"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Pílulas de Navegação por Categoria */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Seções do Manual */}
      {secoesFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum tópico encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Não encontramos nenhum artigo correspondente à sua pesquisa por "{searchTerm}". Tente palavras-chave mais genéricas.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setActiveCategory('TODAS'); }}
            className="mt-4 px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Ver Todos os Tópicos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secoesFiltradas.map(secao => {
            const Icone = secao.icone;
            const isCopied = copiedSection === secao.id;

            return (
              <div 
                key={secao.id}
                id={`manual-card-${secao.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-all group"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                        <Icone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-950 transition-colors">
                          {secao.titulo}
                        </h3>
                        <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                          {secao.categoria}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopySection(secao)}
                      title="Copiar texto do guia"
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Resumo */}
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {secao.resumo}
                  </p>

                  {/* Destaque Importante / Caixa de Atenção */}
                  {secao.destaque && (
                    <div className="mb-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{secao.destaque}</span>
                    </div>
                  )}

                  {/* Lista de Passos */}
                  <div className="space-y-2 mt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Instruções Passo a Passo:
                    </p>
                    <ol className="space-y-1.5 text-xs text-slate-700 pl-0">
                      {secao.passos.map((passo, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{passo}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Regras de Compliance quando existirem */}
                  {secao.regras && secao.regras.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                        Normas Inspecionadas:
                      </p>
                      <ul className="space-y-1 text-xs text-amber-950">
                        {secao.regras.map((regra, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{regra}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dicas Operacionais */}
                  {secao.dicas && secao.dicas.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        💡 Dicas e Boas Práticas:
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {secao.dicas.map((dica, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500">✔</span>
                            <span>{dica}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cartão de Informações e Suporte Técnico */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Precisa de Ajuda Adicional ou Parametrização?</h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Consulte a equipe técnica de TI Hospitalar ou a Coordenação Geral de Enfermagem para permissões de perfil elevado, configuração de novas unidades de internação ou integração com prontuários eletrônicos.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">Banco de Dados Ativo</div>
            <div className="text-xs font-mono font-bold text-emerald-400">Firebase Firestore + Offline</div>
          </div>
        </div>
      </div>
    </div>
  );
};
