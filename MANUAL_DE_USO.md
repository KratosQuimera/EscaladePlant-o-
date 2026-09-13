# Manual de Uso do Sistema de Gestão de Plantões

> **Guia Oficial de Operação & Procedimentos**  
> Destinado a: Administradores, Coordenadores de Escala, Chefias de Enfermagem e Colaboradores / Plantonistas.

---

## 1. Primeiros Passos & Acesso ao Sistema

### 1.1. Como Acessar
Abra o navegador web (Google Chrome, Microsoft Edge, Safari ou Firefox) e digite o endereço do sistema ou abra o ícone instalado em seu celular/computador.

### 1.2. Perfis e Credenciais de Acesso Padrão
Para o primeiro acesso, o sistema disponibiliza contas pré-configuradas para demonstração e parametrização inicial:

| Perfil | Usuário | Senha Padrão | Nível de Acesso |
| :--- | :--- | :--- | :--- |
| **Administrador Master** | `master` | `master123` | Acesso Irrestrito (configurações, auditoria, banco) |
| **Administrador Geral** | `admin` | `admin123` | Gestão de escalas, trocas, profissionais e usuários |
| **Gestor de Setor** | `gestor` | `gestor123` | Criação e acompanhamento diário de escalas |
| **Colaborador / Plantonista** | `usuario` | `usuario123` | Consulta de escalas, trocas e registro de ciência |

> 🔒 **Recomendação de Segurança:** Altere a senha padrão logo no primeiro acesso clicando no seu nome de usuário no canto superior direito e selecionando **"Alterar Minha Senha"**.

---

## 2. Visão Geral dos Módulos do Sistema

A barra lateral de navegação (ou menu superior no celular) dá acesso aos seguintes recursos:

1. 📊 **Dashboard:** Indicadores em tempo real de ocupação, total de plantões do dia, taxa de presenças e pendências.
2. ⏰ **Escala Diária:** O coração operacional do sistema. Grade com todos os plantões do dia selecionado, ações rápidas de presença e validações trabalhistas.
3. 📅 **Calendário Mensal:** Visão ampla em grade de calendário com cores por setor e status.
4. 👤 **Portal do Colaborador (Meu Plantão):** Área personalizada para o profissional consultar apenas seus plantões, próximo turno e assinar digitalmente a ciência da escala.
5. 🔄 **Trocas & Permutas:** Central para solicitação, aceite entre colegas e homologação da coordenação para trocas de plantão.
6. 🚫 **Indisponibilidades:** Módulo de pré-escala onde os plantonistas registram com antecedência dias e turnos em que não podem ser escalados.
7. 👥 **Profissionais:** Cadastro completo da equipe (nome, matrícula, cargo, setor, contato, conselho regional).
8. 🏢 **Setores e Cargos:** Definição dos postos de trabalho (ex: UTI Adulto, Pronto Socorro, Centro Cirúrgico) e funções.
9. 📜 **Histórico & Registros:** Consulta retroativa de presenças, faltas justificadas, atestados e férias.
10. 📑 **Relatórios:** Emissão de espelhos de plantão, total de horas por colaborador e relatórios para fechamento mensal.
11. 🛡️ **Auditoria & Usuários:** Trilha de segurança e gerenciamento de permissões (disponível para Administradores).
12. 💾 **Backup & Dados:** Exportação em arquivo JSON ou sincronização com a nuvem Firebase Firestore.

---

## 3. Gestão da Escala Diária (Passo a Passo)

### 3.1. Seleção de Data e Filtros
- No topo da tela, clique no campo de data para navegar entre dias anteriores ou futuros.
- Utilize os botões **"Dia Anterior"** e **"Próximo Dia"** ou clique em **"Hoje"** para retornar instantaneamente à data corrente.
- Filtre por **Setor**, **Cargo**, **Turno** ou digite qualquer termo na barra de busca (nome do profissional ou matrícula).

### 3.2. Criação de um Novo Plantão na Escala
1. Clique no botão verde **"+ Novo Plantão"**.
2. Selecione o **Profissional**, o **Setor**, o **Cargo** e o **Turno** (Diurno 07h-19h, Noturno 19h-07h ou personalizado).
3. Adicione observações caso necessário (ex: "Posto A - Leito 1 a 6").
4. Clique em **"Salvar Plantão"**.

### 3.3. Registro de Presença e Ocorrências
Na tabela (ou nos cards do celular), ao lado de cada profissional, utilize os botões de ação:
- ✅ **Presente:** Confirma a assiduidade e o cumprimento do plantão.
- ❌ **Ausente:** Abre janela para registro do motivo da falta (ex: ausência injustificada, problema de deslocamento).
- 🌴 **Férias:** Registra o período de início e fim das férias do colaborador. O sistema bloqueia automaticamente novas escalas nesse intervalo.
- 🩺 **Atestado Médico:** Registra a quantidade de dias de afastamento e o código CID opcional.

---

## 4. Compliance & Alertas Trabalhistas em Tempo Real

O sistema possui inteligência analítica que inspeciona continuamente as escalas cadastradas para garantir segurança jurídica à instituição e preservar a saúde do profissional:

### Tipos de Alertas Detectados:
- ⚠️ **Descanso Interjornada Insuficiente (< 11h):** Violação do Artigo 66 da CLT. Ocorre quando o intervalo entre o término de um turno e o início do próximo é menor que 11 horas.
- ⚠️ **Turnos Sobrepostos:** O profissional foi alocado em dois postos simultâneos no mesmo horário.
- ⚠️ **Risco de Fadiga (Plantões Consecutivos):** O profissional realizou 24 horas contínuas de plantão.
- ⚠️ **Escalado Durante Afastamento:** O profissional está na escala em dia com férias ativas ou atestado médico vigente.
- ⚠️ **Escalado em Dia Indisponível:** Conflito com pré-escala cadastrada.

**Como tratar:** No topo da tela de Escala Diária, o painel amarelo lista os alertas. Clique em **"Ver Detalhes"** para ver o motivo e a sugestão de readequação da escala.

---

## 5. Fluxo de Trocas e Permutas de Plantão

O sistema implementa o fluxo de **Dupla Anuência** com homologação da coordenação:

```
[Plantonista A] Solicita Troca com Colega B (ou doa / deixa vaga)
      │
      ▼
[Plantonista B] Recebe a solicitação e clica em "Aceitar Permuta"
      │
      ▼
[Coordenação / ADM] Recebe o aviso e clica em "Homologar Troca"
      │
      ▼
Escala oficial é automaticamente invertida no sistema!
```

### Como Solicitar uma Troca:
1. Vá até a aba **"Trocas & Permutas"** ou clique no botão **"Trocar"** em qualquer linha da escala diária.
2. Escolha o tipo:
   - **Permuta (1 para 1):** Você cede um plantão seu e recebe um plantão específico do colega.
   - **Doação:** Você cede seu plantão para um colega assumir.
   - **Disponibilizar Vaga:** O plantão fica aberto no mural para qualquer colega voluntário assumir.
3. Descreva a justificativa e clique em **"Enviar Solicitação"**.

---

## 6. Portal do Colaborador ("Meu Plantão")

Desenvolvido para uso nos celulares dos próprios plantonistas:
1. Acesse o menu **"Portal do Colaborador"**.
2. Selecione seu nome no seletor (ou o sistema reconhecerá automaticamente pelo seu login).
3. O painel exibirá:
   - **Próximo Plantão Agendado:** Data, horário de entrada e setor.
   - **Total de Plantões e Horas do Mês.**
   - **Lista Completa dos Seus Plantões:** Com status de cada um.
4. **Termo de Ciência da Escala Mensal:**
   - No topo do portal, clique no botão **"Confirmar Ciência da Escala"**.
   - O sistema registra data, hora e assinatura digital de que você tomou ciência oficial da grade do mês, garantindo conformidade documental para a coordenação.

---

## 7. Módulo de Indisponibilidades (Pré-Escala)

Antes de a coordenação fechar a escala do mês seguinte, os colaboradores podem cadastrar suas restrições:
1. Acesse **"Indisponibilidades"**.
2. Clique em **"+ Nova Indisponibilidade"**.
3. Escolha o colaborador, a data do calendário e o período (Manhã, Tarde, Noite ou Dia Todo).
4. Informe o motivo (ex: "Pós-graduação", "Plantão em outro hospital", "Compromisso pessoal").
5. Ao montar a escala, a coordenação será avisada automaticamente caso tente escalar a pessoa nessa data.

---

## 8. Comunicação & Disparo de Escalas via WhatsApp

Para enviar a escala diária ou lembretes individuais diretamente no WhatsApp dos plantonistas:
1. Na tela de **Escala Diária**, clique no botão **"Disparo WhatsApp"** (ícone de compartilhamento verde).
2. O sistema gera mensagens padronizadas e elegantes com o nome do profissional, setor, data e horário de início.
3. Você pode:
   - Clicar em **"Enviar WhatsApp"** ao lado do profissional para abrir a conversa direta com o texto pré-preenchido.
   - Copiar a mensagem com 1 clique para colar em grupos setoriais.

---

## 9. Como Instalar o Aplicativo no Celular e Computador (PWA)

O sistema funciona como aplicativo nativo sem depender de lojas como Google Play ou App Store:

### 9.1. No Celular Android (Chrome):
1. Abra o link do sistema no Google Chrome.
2. Toque no botão verde **"Instalar App (PWA)"** no topo da tela (ou no menu de 3 pontinhos do navegador).
3. Selecione **"Instalar Aplicativo"** ou **"Adicionar à Tela Inicial"**.
4. O ícone do sistema aparecerá na tela do seu celular e abrirá em tela cheia, funcionando inclusive sem internet.

### 9.2. No iPhone / iPad (Safari):
1. Abra o link do sistema no navegador Safari.
2. Toque no ícone de compartilhamento (quadrado com seta para cima na barra inferior).
3. Role a lista e toque em **"Adicionar à Tela de Início"**.
4. Toque em **"Adicionar"** no canto superior direito.

### 9.3. No Computador (Google Chrome ou Microsoft Edge):
1. Clique no botão **"Instalar App (PWA)"** localizado no cabeçalho superior.
2. Confirme o diálogo clicando em **"Instalar"**.
3. O sistema abrirá em sua própria janela independente, podendo ser fixado na Barra de Tarefas do Windows ou Dock do Mac.

---

## 10. Backup, Sincronização em Nuvem e Segurança

### Sincronização Automática:
- O ícone de nuvem no cabeçalho mostra o status em tempo real (**Verde = Conectado ao Firebase Firestore**). Todas as alterações são salvas na nuvem e refletidas para os outros usuários instantaneamente.
- Em caso de queda de conexão, o sistema continua funcionando perfeitamente em modo local (indicador laranja/cinza) e atualiza a nuvem assim que a internet retornar.

### Como Gerar um Backup Manual:
1. Acesse o menu **"Backup & Dados"** (perfil Administrador).
2. Clique em **"Exportar Backup Completo (JSON)"**.
3. Guarde o arquivo em um local seguro. Caso precise restaurar dados em outro computador, basta arrastar o arquivo na área de restauração.

---

## 11. Perguntas Frequentes & Solução de Dúvidas (FAQ)

**P: Posso usar o sistema se a internet cair durante o plantão?**  
*R: Sim! O sistema possui arquitetura offline-first. Você pode registrar presenças e consultar escalas normalmente; os dados sincronizarão com a nuvem quando a conexão retornar.*

**P: O que significa o selo amarelo "Regra" ao lado do nome do profissional?**  
*R: Significa que aquela alocação gerou um alerta trabalhista (como intervalo menor que 11h ou plantão consecutivo de 24h). Passe o cursor sobre o selo para ler a orientação recomendada.*

**P: Quem tem permissão para homologar trocas de plantão?**  
*R: Usuários com perfil Administrador ou Gestor. O colaborador participante apenas aceita ou recusa a proposta inicial.*

**P: Como imprimir a escala do dia para afixar no mural do hospital?**  
*R: Na tela de Escala Diária ou Relatórios, clique no botão de impressão. O sistema possui estilo de folha otimizado para economizar tinta e caber perfeitamente no formato A4.*
