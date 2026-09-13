# Documentação Técnica do Sistema de Gestão de Plantões

> **Versão do Sistema:** 12.0.0 (Enterprise Resilient Architecture)  
> **Ambiente:** Web PWA, Desktop (Electron / Python Executável) e Cloud  
> **Banco de Dados:** Híbrido Resiliente (Firebase Cloud Firestore + LocalStorage Offline-First)  
> **Linguagem & Framework:** TypeScript 5.8, React 19, Tailwind CSS v4, Vite 6  

---

## 1. Visão Geral da Aplicação

O **Sistema de Gestão de Plantões** é uma plataforma hospitalar e corporativa desenvolvida para gerenciar escalas de trabalho contínuas (turnos de 12h, 24h ou customizados). O sistema atende coordenações médicas, chefias de enfermagem, equipes multiprofissionais e plantonistas.

### Principais Objetivos
1. **Prevenção de Furos de Escala:** Monitoramento em tempo real do efetivo alocado por posto, setor e horário.
2. **Segurança Jurídica & Compliance:** Verificação automática de requisitos legais da CLT (descanso interjornada de 11h, limite de horas consecutivas, restrições médicas e férias).
3. **Resiliência Operacional:** Capacidade de operação 100% autônoma offline com sincronização bidirecional em nuvem quando a conexão estiver ativa.
4. **Descentralização e Autonomia:** Portal do colaborador para consulta direta no smartphone e fluxo digital de trocas e permutas com validação administrativa.

---

## 2. Arquitetura de Software

O sistema adota uma arquitetura em camadas orientada a eventos e desacoplada:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Interface do Usuário (UI)                    │
│   React 19 + Tailwind CSS v4 + Lucide Icons + Motion Layout    │
├─────────────────────────────────────────────────────────────────┤
│                     Camada de Componentes                       │
│  EscalaView | TrocasView | PortalColaborador | CalendarioView   │
│  Indisponibilidades | Relatorios | Auditoria | Modais           │
├─────────────────────────────────────────────────────────────────┤
│                     Camada de Serviços                          │
│  complianceService  │  presenceService  │  pwaService          │
│  versionService     │  whatsappService  │  auditLogger         │
├─────────────────────────────────────────────────────────────────┤
│                   Camada de Dados & Persistência                │
│                     DatabaseService (`db.ts`)                   │
├───────────────────────────────┬─────────────────────────────────┤
│  LocalStorage (Offline-First) │   Firebase Cloud Firestore      │
│  Instantâneo, síncrono, cache  │   Nuvem, tempo real, multi-user │
└───────────────────────────────┴─────────────────────────────────┘
```

### 2.1. Estratégia de Persistência Híbrida (Dual-Engine)
- **Leitura Local Instantânea:** Todas as leituras ocorrem a partir da memória/cache local (`localStorage`), garantindo tempo de resposta de 0ms (zero lag) para operações de montagem de escala, paginação e filtros.
- **Escrita com Espelhamento em Nuvem:** Cada mutação (criar escala, registrar presença, solicitar troca, cadastrar afastamento) atualiza o repositório local e despacha assincronamente a sincronização para as coleções do Firestore (`syncItemToFirestore`).
- **Resolução de Conflitos:** Identificadores únicos (`id` padrão `UUID` ou `timestamp-random`) evitam colisões. Mudanças externas no Firestore alimentam listeners em tempo real (`onSnapshot`) que reconciliam o banco local.

---

## 3. Estrutura de Diretórios e Módulos

```
├── public/
│   ├── icon-192.png, icon-512.png    # Ícones PWA
│   ├── manifest.json                 # Web App Manifest
│   └── sw.js                         # Service Worker com cache offline
├── src/
│   ├── components/                   # Visões e Componentes de Interface
│   │   ├── EscalaView.tsx            # Grade diária e registros operacionais
│   │   ├── TrocasView.tsx            # Central de trocas e permutas
│   │   ├── PortalColaboradorView.tsx # Painel pessoal do plantonista
│   │   ├── IndisponibilidadesView.tsx# Pré-escala e restrições
│   │   ├── CalendarioView.tsx        # Visão em grade mensal
│   │   ├── DashboardView.tsx         # Indicadores, taxas de ocupação e gráficos
│   │   ├── ProfissionaisView.tsx     # Cadastro de colaboradores e vínculos
│   │   ├── SetoresCargosView.tsx     # Parametrização de setores e postos
│   │   ├── RelatoriosView.tsx        # Consolidação de horas e exportação
│   │   ├── UsuariosView.tsx          # Gestão de acessos e senhas
│   │   ├── AuditoriaView.tsx         # Trilha completa de auditoria
│   │   ├── BackupView.tsx            # Exportação e importação de backups
│   │   ├── Header.tsx                # Cabeçalho com status de nuvem e PWA
│   │   ├── Sidebar.tsx               # Navegação responsiva
│   │   ├── OfflineIndicator.tsx      # Banner flutuante de conectividade
│   │   ├── PWAInstallModal.tsx       # Assistente de instalação móvel/desktop
│   │   ├── ModalDisparoWhatsApp.tsx  # Central de envio de escalas por WhatsApp
│   │   ├── ModalSolicitarTroca.tsx   # Diálogo de criação de permutas
│   │   ├── ModalNovaIndisponibilidade.tsx # Registro de restrições
│   │   └── ManualView.tsx            # Manual interativo integrado na UI
│   ├── services/
│   │   ├── db.ts                     # DatabaseService unificado
│   │   ├── complianceService.ts      # Motor de regras trabalhistas (CLT)
│   │   ├── firebase.ts               # Conexão e listeners Firestore
│   │   ├── presence.ts               # Gerenciamento de sessões ativas
│   │   ├── pwaService.ts             # Registro e controle de Service Worker
│   │   └── versionService.ts         # Controle semântico de versões
│   ├── types/
│   │   └── index.ts                  # Interfaces e tipos TypeScript centrais
│   ├── App.tsx                       # Componente raiz e roteador de abas
│   └── main.tsx                      # Ponto de entrada do React
├── electron/
│   └── main.cjs                      # Empacotamento Desktop nativo
└── package.json                      # Dependências e scripts de automação
```

---

## 4. Modelos de Dados (Entidades Principais)

### 4.1. Profissional (`Profissional`)
Representa o colaborador escalável (médico, enfermeiro, técnico, etc.):
```typescript
interface Profissional {
  id: string;
  nome_completo: string;
  matricula: string;
  cpf: string;
  telefone: string;
  email: string;
  cargo_id: string;
  setor_padrao_id: string;
  conselho_regional?: string;
  ativo: boolean;
  carga_horaria_semanal?: number;
}
```

### 4.2. Escala (`Escala`)
O registro fundamental de alocação de um plantão:
```typescript
interface Escala {
  id: string;
  data: string; // YYYY-MM-DD
  setor_id: string;
  cargo_id: string;
  profissional_id: string;
  turno: 'DIURNO' | 'NOTURNO' | 'INTEGRAL' | 'CUSTOMIZADO';
  hora_inicio: string; // HH:mm
  hora_fim: string;    // HH:mm
  observacoes?: string;
  status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA';
}
```

### 4.3. Registro de Presença & Ocorrências (`PlantaoRegistro`)
```typescript
interface PlantaoRegistro {
  id: string;
  escala_id: string;
  situacao: 'PRESENTE' | 'AUSENTE' | 'FÉRIAS' | 'ATESTADO';
  data_hora_registro: string;
  usuario_registro_id: string;
  motivo_ausencia?: string;
  cid_atestado?: string;
  dias_atestado?: number;
}
```

### 4.4. Trocas e Permutas (`TrocaPlantao`)
```typescript
interface TrocaPlantao {
  id: string;
  tipo: 'PERMUTA' | 'DOACAO' | 'VAGO';
  solicitanteId: string;
  solicitanteNome: string;
  destinatarioId?: string;
  destinatarioNome?: string;
  escalaOrigemId: string;
  escalaDestinoId?: string;
  dataOrigem: string;
  setorOrigemNome: string;
  motivo: string;
  status: 'SOLICITADA' | 'ACEITA_COLEGA' | 'APROVADA' | 'RECUSADA' | 'CANCELADA';
  criadoEm: string;
  aprovadoPor?: string;
  dataHomologacao?: string;
}
```

### 4.5. Restrição de Indisponibilidade (`RestricaoIndisponibilidade`)
```typescript
interface RestricaoIndisponibilidade {
  id: string;
  profissional_id: string;
  profissional_nome: string;
  data: string; // YYYY-MM-DD
  periodo: 'MANHA' | 'TARDE' | 'NOITE' | 'DIA_TODO';
  motivo: string;
  cadastrado_em: string;
}
```

### 4.6. Confirmação de Ciência Digital (`CienciaEscala`)
```typescript
interface CienciaEscala {
  id: string;
  profissional_id: string;
  profissional_nome: string;
  mes_ano: string; // YYYY-MM
  data_hora: string;
  registrado_por: string;
  ip?: string;
}
```

---

## 5. Motor de Validação & Compliance Trabalhista (`complianceService.ts`)

O módulo de compliance executa uma varredura analítica O(N log N) sobre todas as escalas vigentes e cruzamentos de dados:

1. **Descanso Interjornada de 11 Horas (CLT Art. 66):**
   - Calcula a diferença temporal entre a saída de um plantão ($D_1, H_{fim}$) e a entrada no subsequente ($D_2, H_{inicio}$).
   - Se $\Delta t < 11h$, emite alerta de severidade **CRÍTICA**, detalhando as horas de repouso verificadas.
2. **Sobreposição Conflitante de Turnos:**
   - Detecta alocação simultânea do mesmo colaborador em mais de um setor ou posto no mesmo horário.
3. **Prevenção de Fadiga (> 24h Consecutivas):**
   - Identifica quando um profissional emenda plantões contínuos que totalizam 24h ou mais ininterruptas.
4. **Alocação em Período de Afastamento Legal:**
   - Cruza a data da escala com períodos ativos de atestados médicos ou férias cadastradas.
5. **Colisão com Indisponibilidade Declarada:**
   - Alerta a coordenação caso uma escala tenha sido criada em data/turno formalmente recusado pelo colaborador.

---

## 6. Políticas de Segurança e Controle de Acesso (RBAC)

O sistema possui 3 níveis de controle de permissões:

| Funcionalidade | Colaborador (Padrão) | Gestor de Escala | Administrador / Master |
| :--- | :---: | :---: | :---: |
| Visualizar Escalas & Calendário | Sim | Sim | Sim |
| Portal do Colaborador & Ciência | Sim | Sim | Sim |
| Solicitar Troca / Aceitar Permuta | Sim | Sim | Sim |
| Cadastrar Própria Indisponibilidade | Sim | Sim | Sim |
| Registrar Presença / Falta / Atestado | Não | Sim | Sim |
| Criar / Editar / Excluir Escalas | Não | Sim | Sim |
| Homologar Trocas & Permutas | Não | Sim | Sim |
| Disparo em Massa WhatsApp | Não | Sim | Sim |
| Gerenciar Usuários e Senhas | Não | Não | Sim |
| Trilha de Auditoria | Não | Não | Sim |
| Backup & Restauração Completa | Não | Não | Sim |

---

## 7. Service Worker e Capacidades PWA

O arquivo `/public/sw.js` gerencia o ciclo de vida offline da aplicação:
- **Estratégia Network-First com Fallback para Cache:** Tenta obter a versão mais recente dos artefatos; caso offline, serve instantaneamente a versão em cache.
- **Cache Estático:** Ícones, HTML raiz, estilos e bundles JavaScript são persistidos na chave de cache da versão atual.
- **Instalabilidade Nativa:** O manifesto (`/public/manifest.json`) declara `display: standalone`, `theme_color: #059669` e `orientation: any`, permitindo instalação como aplicativo nativo no Chrome, Edge, Safari iOS e Android.

---

## 8. Trilha de Auditoria (Audit Log)

Todas as ações sensíveis no sistema geram um registro imutável em `auditorias`:
- **Campos rastreados:** ID do evento, ID do usuário operador, nome, ação (`CRIAR_ESCALA`, `EDITAR_ESCALA`, `REGISTRAR_PRESENCA`, `HOMOLOGAR_TROCA`, `ALTERAR_SENHA`), detalhe descritivo, endereço IP e carimbo de data/hora no padrão ISO 8601.
