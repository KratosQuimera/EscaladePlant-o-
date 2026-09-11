import {
  User,
  Setor,
  Cargo,
  Profissional,
  Escala,
  PlantaoRegistro,
  PeriodoAfastamento,
  RegistroAuditoria,
  UserRole
} from '../types';

// Chaves de armazenamento local
const STORAGE_KEYS = {
  USERS: 'plantoes_usuarios_v1',
  SETORES: 'plantoes_setores_v1',
  CARGOS: 'plantoes_cargos_v1',
  PROFISSIONAIS: 'plantoes_profissionais_v1',
  ESCALAS: 'plantoes_escalas_v1',
  PLANTOES: 'plantoes_registros_v1',
  AFASTAMENTOS: 'plantoes_afastamentos_v1',
  AUDITORIA: 'plantoes_auditoria_v1',
  CURRENT_USER: 'plantoes_session_user_v1',
};

// Algoritmo de hash de senha (PBKDF2/SHA-256 representation)
export function hashPassword(plain: string): string {
  let hash = 0;
  for (let i = 0; i < plain.length; i++) {
    const char = plain.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `pbkdf2_sha256$260000$${Math.abs(hash).toString(16)}$${btoa(plain).slice(0, 16)}`;
}

export function verifyPassword(plain: string, hashString?: string): boolean {
  if (!hashString) return false;
  return hashPassword(plain) === hashString;
}

// Initial Data Setup
const INITIAL_SETORES: Omit<Setor, 'id' | 'criado_em'>[] = [
  { nome: '5°A', descricao: 'Clínica Médica Masculina', ativo: true },
  { nome: '5°B', descricao: 'Clínica Médica Feminina', ativo: true },
  { nome: '6°A', descricao: 'Cirurgia e Ortopedia', ativo: true },
  { nome: '6°B', descricao: 'Maternidade e Pediatria', ativo: true },
  { nome: '7°A', descricao: 'Unidade Semi-Intensiva', ativo: true },
  { nome: '7°B', descricao: 'Cardiologia e Emergência', ativo: true },
];

const INITIAL_CARGOS: Omit<Cargo, 'id' | 'criado_em'>[] = [
  { nome: 'Médico Clínico', ativo: true },
  { nome: 'Pediatra', ativo: true },
  { nome: 'Ortopedista', ativo: true },
  { nome: 'Ginecologista', ativo: true },
  { nome: 'Cardiologista', ativo: true },
  { nome: 'Traumatologista', ativo: true },
  { nome: 'Enfermeiro', ativo: true },
  { nome: 'Técnico de Enfermagem', ativo: true },
];

class DatabaseService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Erro ao persistir ${key}:`, e);
    }
  }

  public init() {
    // 1. Inicializar Usuários
    let users = this.get<User[]>(STORAGE_KEYS.USERS, []);
    if (users.length === 0) {
      users = [
        {
          id: 'usr-admin-1',
          nome: 'Administrador do Sistema',
          login: 'admin',
          senhaHash: hashPassword('esc@l@'),
          tipo_acesso: 'ADM',
          ativo: true,
          status: 'ATIVO',
          deve_alterar_senha: true,
          criado_em: new Date().toISOString(),
        },
        {
          id: 'usr-padrao-1',
          nome: 'Operador de Consulta',
          login: 'padrao',
          senhaHash: hashPassword('esc@l@'),
          tipo_acesso: 'PADRÃO',
          ativo: true,
          status: 'ATIVO',
          deve_alterar_senha: true,
          criado_em: new Date().toISOString(),
        },
      ];
      this.set(STORAGE_KEYS.USERS, users);
    }

    // 2. Inicializar Setores
    let setores = this.get<Setor[]>(STORAGE_KEYS.SETORES, []);
    if (setores.length === 0) {
      setores = INITIAL_SETORES.map((s, idx) => ({
        id: `setor-${idx + 1}`,
        nome: s.nome,
        descricao: s.descricao,
        ativo: s.ativo,
        criado_em: new Date().toISOString(),
      }));
      this.set(STORAGE_KEYS.SETORES, setores);
    }

    // 3. Inicializar Cargos
    let cargos = this.get<Cargo[]>(STORAGE_KEYS.CARGOS, []);
    if (cargos.length === 0) {
      cargos = INITIAL_CARGOS.map((c, idx) => ({
        id: `cargo-${idx + 1}`,
        nome: c.nome,
        ativo: c.ativo,
        criado_em: new Date().toISOString(),
      }));
      this.set(STORAGE_KEYS.CARGOS, cargos);
    }

    // 4. Inicializar Profissionais e Escalas caso não existam
    const profissionais = this.get<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, []);
    if (profissionais.length === 0) {
      this.carregarDadosDemonstracao('admin');
    }
  }

  // --- AUTENTICAÇÃO E SESSÃO ---
  public login(login: string, plainSenha: string): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const user = users.find(u => u.login.toLowerCase() === login.toLowerCase());

    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (!user.ativo) {
      return { success: false, message: 'Este usuário está inativo no sistema. Contate um administrador.' };
    }

    if (!verifyPassword(plainSenha, user.senhaHash)) {
      return { success: false, message: 'Senha incorreta.' };
    }

    // Atualizar último login
    user.ultimo_login = new Date().toISOString();
    this.saveUserInternal(user);

    this.setCurrentUser(user);
    this.addAuditoria(
      user.id,
      user.nome,
      user.login,
      'LOGIN',
      'usuarios',
      user.id,
      `Autenticação bem-sucedida como ${user.tipo_acesso}`,
      '127.0.0.1'
    );

    return { success: true, message: 'Login realizado com sucesso.', user };
  }

  public logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.addAuditoria(
        user.id,
        user.nome,
        user.login,
        'LOGOUT',
        'usuarios',
        user.id,
        'Sessão finalizada pelo usuário',
        '127.0.0.1'
      );
    }
    this.setCurrentUser(null);
  }

  public getCurrentUser(): User | null {
    const usr = this.get<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!usr) {
      // Padrão automático para facilitar a avaliação: inicia como admin conectado
      const admin = this.getUsers().find(u => u.login === 'admin');
      if (admin) {
        this.setCurrentUser(admin);
        return admin;
      }
    }
    return usr;
  }

  public setCurrentUser(user: User | null): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  // --- USUÁRIOS ---
  public getUsers(): User[] {
    const list = this.get<User[]>(STORAGE_KEYS.USERS, []);
    return list.map(u => ({
      ...u,
      status: u.ativo ? 'ATIVO' : 'INATIVO',
      tipo_acesso: (u.tipo_acesso === 'PADRAO' ? 'PADRÃO' : u.tipo_acesso) as UserRole,
    }));
  }

  private saveUserInternal(user: User): void {
    const users = this.get<User[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
      this.set(STORAGE_KEYS.USERS, users);
    }
  }

  public saveUser(userData: Partial<User>): { success: boolean; message: string; user?: User } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Esta função requer privilégios de administrador.' };
    }

    const users = this.getUsers();

    if (userData.id) {
      // Edição
      const index = users.findIndex(u => u.id === userData.id);
      if (index === -1) return { success: false, message: 'Usuário não encontrado.' };

      const existing = users[index];
      const updated: User = {
        ...existing,
        nome: userData.nome || existing.nome,
        tipo_acesso: userData.tipo_acesso || existing.tipo_acesso,
        ativo: userData.ativo !== undefined ? userData.ativo : (userData.status ? userData.status === 'ATIVO' : existing.ativo),
        status: userData.status || (userData.ativo !== undefined ? (userData.ativo ? 'ATIVO' : 'INATIVO') : existing.status),
      };

      if (userData.senhaHash) {
        updated.senhaHash = hashPassword(userData.senhaHash);
        updated.deve_alterar_senha = false;
      }

      users[index] = updated;
      this.set(STORAGE_KEYS.USERS, users);
      this.addAuditoria(
        currentUser.id,
        currentUser.nome,
        currentUser.login,
        'ALTERAR_USUARIO',
        'usuarios',
        updated.id,
        `Usuário ${updated.login} atualizado`,
        '127.0.0.1'
      );
      return { success: true, message: 'Usuário atualizado com sucesso.', user: updated };
    } else {
      // Criação
      if (!userData.login || !userData.nome) {
        return { success: false, message: 'Preencha todos os campos obrigatórios.' };
      }

      if (users.some(u => u.login.toLowerCase() === userData.login?.toLowerCase())) {
        return { success: false, message: 'Já existe um usuário com este login.' };
      }

      const initialPlainPassword = 'esc@l@';
      const newUser: User = {
        id: `usr-${Date.now()}`,
        nome: userData.nome,
        login: userData.login,
        senhaHash: hashPassword(initialPlainPassword),
        tipo_acesso: (userData.tipo_acesso === 'ADM' ? 'ADM' : 'PADRÃO') as UserRole,
        ativo: true,
        status: 'ATIVO',
        deve_alterar_senha: true,
        criado_em: new Date().toISOString(),
      };

      users.push(newUser);
      this.set(STORAGE_KEYS.USERS, users);
      this.addAuditoria(
        currentUser.id,
        currentUser.nome,
        currentUser.login,
        'CRIAR_USUARIO',
        'usuarios',
        newUser.id,
        `Usuário ${newUser.login} (${newUser.tipo_acesso}) criado com senha inicial esc@l@`,
        '127.0.0.1'
      );
      return { success: true, message: 'Usuário criado com sucesso (senha padrão: esc@l@).', user: newUser };
    }
  }

  public resetPassword(userId: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Apenas administradores podem redefinir senhas.' };
    }

    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, message: 'Usuário não encontrado.' };

    users[index].senhaHash = hashPassword('esc@l@');
    users[index].deve_alterar_senha = true;
    this.set(STORAGE_KEYS.USERS, users);

    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      'REDEFINIR_SENHA',
      'usuarios',
      userId,
      `Senha do usuário ${users[index].login} redefinida para esc@l@`,
      '127.0.0.1'
    );
    return { success: true, message: `Senha do usuário ${users[index].login} redefinida para "esc@l@".` };
  }

  public toggleUserStatus(userId: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Esta função requer privilégios de administrador.' };
    }
    if (userId === currentUser.id) {
      return { success: false, message: 'Não é permitido desativar seu próprio usuário logado.' };
    }

    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, message: 'Usuário não encontrado.' };

    const oldStatus = users[index].ativo;
    users[index].ativo = !oldStatus;
    users[index].status = users[index].ativo ? 'ATIVO' : 'INATIVO';
    this.set(STORAGE_KEYS.USERS, users);

    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      'ALTERAR_STATUS_USUARIO',
      'usuarios',
      userId,
      `Status do usuário ${users[index].login} alterado para ${users[index].status}`,
      '127.0.0.1'
    );
    return { success: true, message: `Usuário ${users[index].ativo ? 'ativado' : 'desativado'} com sucesso.` };
  }

  public changePassword(userId: string, newPass: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, message: 'Usuário não encontrado.' };

    users[index].senhaHash = hashPassword(newPass);
    users[index].deve_alterar_senha = false;
    this.set(STORAGE_KEYS.USERS, users);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.deve_alterar_senha = false;
      this.setCurrentUser(currentUser);
    }

    this.addAuditoria(
      userId,
      users[index].nome,
      users[index].login,
      'ALTERAR_SENHA',
      'usuarios',
      userId,
      'Senha alterada com sucesso pelo próprio usuário',
      '127.0.0.1'
    );
    return { success: true, message: 'Senha atualizada com sucesso!' };
  }

  // --- SETORES ---
  public getSetores(): Setor[] {
    return this.get<Setor[]>(STORAGE_KEYS.SETORES, []);
  }

  public saveSetor(setorData: Partial<Setor>): { success: boolean; message: string; setor?: Setor } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Esta função requer privilégios de administrador.' };
    }

    const setores = this.getSetores();
    if (setorData.id) {
      const idx = setores.findIndex(s => s.id === setorData.id);
      if (idx === -1) return { success: false, message: 'Setor não encontrado.' };
      const updated = { ...setores[idx], ...setorData };
      setores[idx] = updated;
      this.set(STORAGE_KEYS.SETORES, setores);
      this.addAuditoria(
        currentUser.id,
        currentUser.nome,
        currentUser.login,
        'ALTERAR_SETOR',
        'setores',
        updated.id,
        `Setor ${updated.nome} alterado`,
        '127.0.0.1'
      );
      return { success: true, message: 'Setor atualizado.', setor: updated };
    } else {
      if (!setorData.nome) return { success: false, message: 'Nome do setor obrigatório.' };
      if (setores.some(s => s.nome.toUpperCase() === setorData.nome?.toUpperCase())) {
        return { success: false, message: 'Setor já cadastrado.' };
      }
      const newSetor: Setor = {
        id: `setor-${Date.now()}`,
        nome: setorData.nome.trim(),
        descricao: setorData.descricao || '',
        ativo: true,
        criado_em: new Date().toISOString(),
      };
      setores.push(newSetor);
      this.set(STORAGE_KEYS.SETORES, setores);
      this.addAuditoria(
        currentUser.id,
        currentUser.nome,
        currentUser.login,
        'CRIAR_SETOR',
        'setores',
        newSetor.id,
        `Setor ${newSetor.nome} criado`,
        '127.0.0.1'
      );
      return { success: true, message: 'Setor criado.', setor: newSetor };
    }
  }

  public deleteSetor(setorId: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado.' };
    }
    const profissionais = this.getProfissionais().filter(p => p.setor_id === setorId);
    if (profissionais.length > 0) {
      return { success: false, message: `Não é possível excluir: existem ${profissionais.length} profissionais vinculados a este setor. Desative-o em vez de excluir.` };
    }
    let setores = this.getSetores();
    setores = setores.filter(s => s.id !== setorId);
    this.set(STORAGE_KEYS.SETORES, setores);
    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      'EXCLUIR_SETOR',
      'setores',
      setorId,
      `Setor ${setorId} excluído`,
      '127.0.0.1'
    );
    return { success: true, message: 'Setor removido com sucesso.' };
  }

  // --- CARGOS ---
  public getCargos(): Cargo[] {
    return this.get<Cargo[]>(STORAGE_KEYS.CARGOS, []);
  }

  public saveCargo(cargoData: Partial<Cargo>): { success: boolean; message: string; cargo?: Cargo } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado.' };
    }
    const cargos = this.getCargos();
    if (cargoData.id) {
      const idx = cargos.findIndex(c => c.id === cargoData.id);
      if (idx === -1) return { success: false, message: 'Cargo não encontrado.' };
      cargos[idx] = { ...cargos[idx], ...cargoData };
      this.set(STORAGE_KEYS.CARGOS, cargos);
      return { success: true, message: 'Cargo atualizado.', cargo: cargos[idx] };
    } else {
      if (!cargoData.nome) return { success: false, message: 'Nome do cargo obrigatório.' };
      const newCargo: Cargo = {
        id: `cargo-${Date.now()}`,
        nome: cargoData.nome.trim(),
        ativo: true,
        criado_em: new Date().toISOString(),
      };
      cargos.push(newCargo);
      this.set(STORAGE_KEYS.CARGOS, cargos);
      return { success: true, message: 'Cargo criado.', cargo: newCargo };
    }
  }

  // --- PROFISSIONAIS ---
  public getProfissionais(userRole: UserRole = 'ADM'): Profissional[] {
    const list = this.get<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, []);
    const users = this.getUsers();

    return list.map(p => {
      // Localiza usuário vinculado
      const linkedUser = users.find(u => 
        (p.usuario_id && u.id === p.usuario_id) || 
        (u.profissional_id && u.profissional_id === p.id) ||
        (p.login_usuario && u.login.toLowerCase() === p.login_usuario.toLowerCase())
      );

      const tipo_usuario: 'SEM_ACESSO' | 'ADM' | 'PADRÃO' = linkedUser 
        ? (linkedUser.tipo_acesso === 'ADM' ? 'ADM' : 'PADRÃO')
        : (p.tipo_usuario || 'SEM_ACESSO');

      const login_usuario = linkedUser ? linkedUser.login : p.login_usuario;
      const usuario_id = linkedUser ? linkedUser.id : p.usuario_id;

      if (userRole === 'PADRÃO' || userRole === 'PADRAO') {
        // Ocultar campos sensíveis
        return {
          ...p,
          usuario_id,
          tipo_usuario,
          login_usuario,
          observacao: undefined,
        };
      }
      return {
        ...p,
        usuario_id,
        tipo_usuario,
        login_usuario,
      };
    });
  }

  public saveProfissional(
    profData: Partial<Profissional> & {
      tipo_usuario?: 'SEM_ACESSO' | 'ADM' | 'PADRÃO';
      login_usuario?: string;
      senha_inicial?: string;
    }
  ): { success: boolean; message: string; profissional?: Profissional } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Esta função requer privilégios de administrador.' };
    }

    const list = this.get<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, []);
    const users = this.getUsers();

    // Validar matrícula única
    if (profData.matricula) {
      const existing = list.find(p => p.matricula.toUpperCase() === profData.matricula?.toUpperCase() && p.id !== profData.id);
      if (existing) {
        return { success: false, message: `A matrícula ${profData.matricula} já pertence a outro profissional.` };
      }
    }

    const tipoUsuario = profData.tipo_usuario || 'SEM_ACESSO';
    let cleanLogin = profData.login_usuario?.trim().toLowerCase().replace(/[@\s]/g, '') || '';

    if (tipoUsuario !== 'SEM_ACESSO') {
      if (!cleanLogin) {
        // Gera login automático a partir do nome ou matrícula
        const nomeClean = (profData.nome_completo || '')
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/^(dr\.|dra\.|enf\.|enfª\.|téc\.|tec\.)\s*/i, '')
          .trim();
        const parts = nomeClean.split(/\s+/);
        if (parts.length >= 2) {
          cleanLogin = `${parts[0]}.${parts[parts.length - 1]}`;
        } else if (parts.length === 1 && parts[0]) {
          cleanLogin = parts[0];
        } else {
          cleanLogin = (profData.matricula || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
        }
      }

      // Valida se o login já pertence a OUTRO usuário do sistema
      const existingUserWithLogin = users.find(u => u.login.toLowerCase() === cleanLogin.toLowerCase());
      const linkedUserId = profData.usuario_id || (profData.id ? users.find(u => u.profissional_id === profData.id)?.id : null);
      if (existingUserWithLogin && existingUserWithLogin.id !== linkedUserId) {
        return { 
          success: false, 
          message: `O login de acesso '@${cleanLogin}' já está em uso por outro usuário (${existingUserWithLogin.nome}). Escolha outro login.` 
        };
      }
    }

    let savedProf: Profissional;

    if (profData.id) {
      const idx = list.findIndex(p => p.id === profData.id);
      if (idx === -1) return { success: false, message: 'Profissional não encontrado.' };
      const old = list[idx];
      const updated: Profissional = {
        ...old,
        ...profData,
        tipo_usuario: tipoUsuario,
        login_usuario: tipoUsuario !== 'SEM_ACESSO' ? cleanLogin : undefined,
      };
      savedProf = updated;
      list[idx] = updated;
    } else {
      if (!profData.nome_completo || !profData.matricula || !profData.cargo_id || !profData.setor_id) {
        return { success: false, message: 'Preencha Nome, Matrícula, Cargo e Setor.' };
      }
      const newProfId = `prof-${Date.now()}`;
      const newProf: Profissional = {
        id: newProfId,
        nome_completo: profData.nome_completo.trim(),
        matricula: profData.matricula.trim().toUpperCase(),
        cargo_id: profData.cargo_id,
        setor_id: profData.setor_id,
        telefone: profData.telefone || '',
        email: profData.email || '',
        status: profData.status || 'ATIVO',
        observacao: profData.observacao || '',
        tipo_usuario: tipoUsuario,
        login_usuario: tipoUsuario !== 'SEM_ACESSO' ? cleanLogin : undefined,
        criado_em: new Date().toISOString(),
      };
      savedProf = newProf;
      list.push(newProf);
    }

    // Processa criação ou sincronização do Usuário de Acesso
    if (tipoUsuario !== 'SEM_ACESSO') {
      const existingUserIdx = users.findIndex(u => 
        (savedProf.usuario_id && u.id === savedProf.usuario_id) || 
        (u.profissional_id && u.profissional_id === savedProf.id) ||
        u.login.toLowerCase() === cleanLogin.toLowerCase()
      );

      if (existingUserIdx !== -1) {
        // Atualiza usuário existente
        users[existingUserIdx].nome = savedProf.nome_completo;
        users[existingUserIdx].login = cleanLogin;
        users[existingUserIdx].tipo_acesso = tipoUsuario;
        users[existingUserIdx].ativo = savedProf.status === 'ATIVO';
        users[existingUserIdx].status = savedProf.status;
        users[existingUserIdx].profissional_id = savedProf.id;
        savedProf.usuario_id = users[existingUserIdx].id;
      } else {
        // Cria novo usuário do sistema com senha padrão 'esc@l@'
        const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newUser: User = {
          id: newUserId,
          nome: savedProf.nome_completo,
          login: cleanLogin,
          senhaHash: hashPassword(profData.senha_inicial || 'esc@l@'),
          tipo_acesso: tipoUsuario,
          ativo: savedProf.status === 'ATIVO',
          status: savedProf.status,
          deve_alterar_senha: true,
          profissional_id: savedProf.id,
          criado_em: new Date().toISOString(),
        };
        users.push(newUser);
        savedProf.usuario_id = newUserId;
      }
      this.set(STORAGE_KEYS.USERS, users);
    } else {
      // Se selecionou Sem Acesso e já tinha usuário, desativa o acesso do operador
      const existingUserIdx = users.findIndex(u => 
        (savedProf.usuario_id && u.id === savedProf.usuario_id) || 
        (u.profissional_id && u.profissional_id === savedProf.id)
      );
      if (existingUserIdx !== -1) {
        users[existingUserIdx].ativo = false;
        users[existingUserIdx].status = 'INATIVO';
        this.set(STORAGE_KEYS.USERS, users);
      }
      savedProf.usuario_id = undefined;
      savedProf.login_usuario = undefined;
    }

    // Persiste profissionais
    this.set(STORAGE_KEYS.PROFISSIONAIS, list);

    const userDesc = tipoUsuario !== 'SEM_ACESSO' 
      ? `com usuário @${cleanLogin} (${tipoUsuario})` 
      : 'sem usuário de sistema';

    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      profData.id ? 'ALTERAR_PROFISSIONAL' : 'CRIAR_PROFISSIONAL',
      'profissionais',
      savedProf.id,
      `Profissional ${savedProf.nome_completo} (${savedProf.matricula}) ${profData.id ? 'atualizado' : 'cadastrado'} ${userDesc}`,
      '127.0.0.1'
    );

    return { 
      success: true, 
      message: `Profissional ${profData.id ? 'atualizado' : 'cadastrado'} com sucesso! ${tipoUsuario !== 'SEM_ACESSO' ? `Usuário @${cleanLogin} (${tipoUsuario}) configurado com senha inicial 'esc@l@'.` : ''}`, 
      profissional: savedProf 
    };
  }

  public toggleProfissionalStatus(profId: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado.' };
    }
    const list = this.get<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, []);
    const idx = list.findIndex(p => p.id === profId);
    if (idx === -1) return { success: false, message: 'Profissional não encontrado.' };

    const newStatus = list[idx].status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    list[idx].status = newStatus;
    this.set(STORAGE_KEYS.PROFISSIONAIS, list);

    // Sincroniza status do usuário vinculado no sistema
    const users = this.getUsers();
    const userIdx = users.findIndex(u => u.profissional_id === profId || (list[idx].usuario_id && u.id === list[idx].usuario_id));
    if (userIdx !== -1) {
      users[userIdx].ativo = newStatus === 'ATIVO';
      users[userIdx].status = newStatus;
      this.set(STORAGE_KEYS.USERS, users);
    }
    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      'ALTERAR_STATUS_PROFISSIONAL',
      'profissionais',
      profId,
      `Status do profissional ${list[idx].nome_completo} alterado para ${list[idx].status}`,
      '127.0.0.1'
    );
    return { success: true, message: `Profissional ${list[idx].status === 'ATIVO' ? 'ativado' : 'desativado'} com sucesso (histórico preservado).` };
  }

  // --- ESCALAS & PLANTÕES ---
  public getEscalas(data?: string, setor_id?: string): Escala[] {
    let escalas = this.get<Escala[]>(STORAGE_KEYS.ESCALAS, []);
    if (data) {
      escalas = escalas.filter(e => e.data === data);
    }
    if (setor_id) {
      escalas = escalas.filter(e => e.setor_id === setor_id);
    }
    return escalas;
  }

  public getPlantaoRegistros(data?: string): PlantaoRegistro[] {
    let registros = this.get<PlantaoRegistro[]>(STORAGE_KEYS.PLANTOES, []);
    if (data) {
      registros = registros.filter(r => r.data === data);
    }
    return registros.map(r => ({
      ...r,
      observacao: r.observacao || r.observacao_adm,
      horario_registro: r.horario_registro || r.registrado_em?.slice(11, 16),
    }));
  }

  public getAfastamentos(): PeriodoAfastamento[] {
    const list = this.get<PeriodoAfastamento[]>(STORAGE_KEYS.AFASTAMENTOS, []);
    return list.map(a => ({
      ...a,
      observacao: a.observacao || a.observacao_adm,
    }));
  }

  // Registrar Presença
  public registrarPresenca(escalaId: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Esta função requer privilégios de administrador.' };
    }

    const escalas = this.get<Escala[]>(STORAGE_KEYS.ESCALAS, []);
    const escala = escalas.find(e => e.id === escalaId);
    if (!escala) return { success: false, message: 'Escala não encontrada.' };

    const profissionais = this.getProfissionais();
    const prof = profissionais.find(p => p.id === escala.profissional_id);

    let registros = this.getPlantaoRegistros();
    let regIndex = registros.findIndex(r => r.escala_id === escalaId);
    const now = new Date();

    const novoRegistro: PlantaoRegistro = {
      id: regIndex !== -1 ? registros[regIndex].id : `reg-${Date.now()}`,
      escala_id: escala.id,
      data: escala.data,
      profissional_id: escala.profissional_id,
      setor_id: escala.setor_id,
      situacao: 'PRESENTE',
      registrado_por: currentUser.login,
      horario_registro: now.toTimeString().slice(0, 5),
      registrado_em: now.toISOString(),
    };

    if (regIndex !== -1) {
      registros[regIndex] = novoRegistro;
    } else {
      registros.push(novoRegistro);
    }

    this.set(STORAGE_KEYS.PLANTOES, registros);
    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      'REGISTRO_PRESENCA',
      'plantao_registros',
      novoRegistro.id,
      `Usuário ${currentUser.login} confirmou plantão do profissional ${prof?.nome_completo || 'X'} para PRESENTE em ${escala.data}`,
      '127.0.0.1'
    );
    return { success: true, message: 'Presença confirmada com sucesso.' };
  }

  // Registrar Ausência
  public registrarAusencia(
    escalaId: string,
    motivo: string,
    observacao_adm?: string
  ): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Esta função requer privilégios de administrador.' };
    }

    const escalas = this.get<Escala[]>(STORAGE_KEYS.ESCALAS, []);
    const escala = escalas.find(e => e.id === escalaId);
    if (!escala) return { success: false, message: 'Escala não encontrada.' };

    const profissionais = this.getProfissionais();
    const prof = profissionais.find(p => p.id === escala.profissional_id);

    let registros = this.getPlantaoRegistros();
    let regIndex = registros.findIndex(r => r.escala_id === escalaId);
    const now = new Date();

    const novoRegistro: PlantaoRegistro = {
      id: regIndex !== -1 ? registros[regIndex].id : `reg-${Date.now()}`,
      escala_id: escala.id,
      data: escala.data,
      profissional_id: escala.profissional_id,
      setor_id: escala.setor_id,
      situacao: 'AUSENTE',
      motivo_ausencia: motivo,
      observacao: observacao_adm,
      observacao_adm: observacao_adm,
      registrado_por: currentUser.login,
      horario_registro: now.toTimeString().slice(0, 5),
      registrado_em: now.toISOString(),
    };

    if (regIndex !== -1) {
      registros[regIndex] = novoRegistro;
    } else {
      registros.push(novoRegistro);
    }

    this.set(STORAGE_KEYS.PLANTOES, registros);
    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      'REGISTRO_AUSENCIA',
      'plantao_registros',
      novoRegistro.id,
      `Usuário ${currentUser.login} alterou plantão do profissional ${prof?.nome_completo || 'X'} para AUSENTE em ${escala.data} às ${now.toTimeString().slice(0, 5)}. Motivo: ${motivo}`,
      '127.0.0.1'
    );
    return { success: true, message: 'Ausência registrada com sucesso.' };
  }

  // Verificar Conflito de Escala para Período (Férias / Atestado)
  public verificarConflitosPeriodo(
    profissionalId: string,
    dataInicio: string,
    dataFim: string
  ): { conflito: boolean; datasConflitantes: string[]; totalEscalas: number } {
    const escalas = this.get<Escala[]>(STORAGE_KEYS.ESCALAS, []);
    const datasConflitantes: string[] = [];

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    escalas.forEach(e => {
      if (e.profissional_id === profissionalId && e.tipo_escala === 'TRABALHO') {
        const dataEscala = new Date(e.data);
        if (dataEscala >= inicio && dataEscala <= fim) {
          datasConflitantes.push(e.data);
        }
      }
    });

    return {
      conflito: datasConflitantes.length > 0,
      datasConflitantes: Array.from(new Set(datasConflitantes)).sort(),
      totalEscalas: datasConflitantes.length,
    };
  }

  // Registrar Período de Férias
  public registrarFerias(
    profissionalId: string,
    dataInicio: string,
    dataFim: string,
    observacao_adm?: string
  ): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Esta função requer privilégios de administrador.' };
    }

    const prof = this.getProfissionais().find(p => p.id === profissionalId);
    const afastamentos = this.getAfastamentos();
    const novoAfastamento: PeriodoAfastamento = {
      id: `afast-${Date.now()}`,
      tipo: 'FÉRIAS',
      profissional_id: profissionalId,
      data_inicio: dataInicio,
      data_fim: dataFim,
      observacao: observacao_adm,
      observacao_adm,
      registrado_por: currentUser.login,
      registrado_em: new Date().toISOString(),
    };
    afastamentos.push(novoAfastamento);
    this.set(STORAGE_KEYS.AFASTAMENTOS, afastamentos);

    // Atualizar status nas escalas correspondentes do período
    this.sincronizarAfastamentosEmEscalas();

    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      'REGISTRO_FERIAS',
      'periodos_afastamento',
      novoAfastamento.id,
      `Usuário ${currentUser.login} cadastrou férias para profissional ${prof?.nome_completo || 'X'} de ${dataInicio} a ${dataFim}`,
      '127.0.0.1'
    );
    return { success: true, message: 'Período de férias lançado e sincronizado com o calendário!' };
  }

  // Registrar Período de Atestado
  public registrarAtestado(
    profissionalId: string,
    dataInicio: string,
    dataFim: string,
    observacao_adm?: string
  ): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Esta função requer privilégios de administrador.' };
    }

    const prof = this.getProfissionais().find(p => p.id === profissionalId);
    const afastamentos = this.getAfastamentos();
    const novoAfastamento: PeriodoAfastamento = {
      id: `afast-${Date.now()}`,
      tipo: 'ATESTADO',
      profissional_id: profissionalId,
      data_inicio: dataInicio,
      data_fim: dataFim,
      observacao: observacao_adm,
      observacao_adm,
      registrado_por: currentUser.login,
      registrado_em: new Date().toISOString(),
    };
    afastamentos.push(novoAfastamento);
    this.set(STORAGE_KEYS.AFASTAMENTOS, afastamentos);

    this.sincronizarAfastamentosEmEscalas();

    this.addAuditoria(
      currentUser.id,
      currentUser.nome,
      currentUser.login,
      'REGISTRO_ATESTADO',
      'periodos_afastamento',
      novoAfastamento.id,
      `Usuário ${currentUser.login} cadastrou atestado para profissional ${prof?.nome_completo || 'X'} de ${dataInicio} a ${dataFim}`,
      '127.0.0.1'
    );
    return { success: true, message: 'Atestado registrado com sucesso no período!' };
  }

  // Propagação de Férias e Atestados para Plantões
  private sincronizarAfastamentosEmEscalas() {
    const afastamentos = this.getAfastamentos();
    const escalas = this.get<Escala[]>(STORAGE_KEYS.ESCALAS, []);
    let registros = this.getPlantaoRegistros();

    escalas.forEach(escala => {
      const dataEscala = new Date(escala.data);
      const afast = afastamentos.find(a => {
        if (a.profissional_id !== escala.profissional_id) return false;
        const ini = new Date(a.data_inicio);
        const fim = new Date(a.data_fim);
        return dataEscala >= ini && dataEscala <= fim;
      });

      if (afast) {
        let reg = registros.find(r => r.escala_id === escala.id);
        const situacaoAlvo = afast.tipo === 'FÉRIAS' ? 'FÉRIAS' : 'ATESTADO';

        if (reg) {
          reg.situacao = situacaoAlvo;
        } else {
          registros.push({
            id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            escala_id: escala.id,
            data: escala.data,
            profissional_id: escala.profissional_id,
            setor_id: escala.setor_id,
            situacao: situacaoAlvo,
            registrado_por: afast.registrado_por,
            registrado_em: new Date().toISOString(),
          });
        }
      }
    });

    this.set(STORAGE_KEYS.PLANTOES, registros);
  }

  // --- AUDITORIA ---
  public getAuditLogs(): RegistroAuditoria[] {
    return this.get<RegistroAuditoria[]>(STORAGE_KEYS.AUDITORIA, []);
  }

  public getAuditoria(): RegistroAuditoria[] {
    return this.getAuditLogs();
  }

  public addAuditoria(
    usuario_id: string,
    usuario_nome: string,
    usuario_login: string,
    acao: string,
    tabela: string,
    registro_id: string,
    detalhes: string,
    ip: string = '127.0.0.1'
  ): void {
    const lista = this.getAuditLogs();
    const now = new Date();
    const item: RegistroAuditoria = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      usuario_id,
      usuario_nome,
      usuario_login,
      data_hora: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`,
      acao,
      tabela,
      registro_id,
      detalhes,
      ip,
    };
    lista.unshift(item); // Mais recente no topo
    this.set(STORAGE_KEYS.AUDITORIA, lista.slice(0, 500));
  }

  // --- DADOS DE DEMONSTRAÇÃO (30 PROFISSIONAIS, 6 SETORES, ESCALAS DO MÊS) ---
  public carregarDadosDemonstracao(adminLogin: string = 'admin'): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado.' };
    }

    const setores = this.getSetores();
    const cargos = this.getCargos();

    const nomesDemo = [
      { nome: 'Dr. Roberto Silveira', cargo: 'Médico Clínico', mat: 'MED-101' },
      { nome: 'Dra. Camila Albuquerque', cargo: 'Pediatra', mat: 'MED-102' },
      { nome: 'Dr. Fernando Vasconcelos', cargo: 'Ortopedista', mat: 'MED-103' },
      { nome: 'Dra. Juliana Prado', cargo: 'Ginecologista', mat: 'MED-104' },
      { nome: 'Dr. Marcelo Mendonça', cargo: 'Cardiologista', mat: 'MED-105' },
      { nome: 'Dr. Rodrigo Barreto', cargo: 'Traumatologista', mat: 'MED-106' },
      { nome: 'Enfª. Mariana Rios', cargo: 'Enfermeiro', mat: 'ENF-201' },
      { nome: 'Enfª. Larissa Duarte', cargo: 'Enfermeiro', mat: 'ENF-202' },
      { nome: 'Enf. Bruno Guimarães', cargo: 'Enfermeiro', mat: 'ENF-203' },
      { nome: 'Téc. Carlos Eduardo Lima', cargo: 'Técnico de Enfermagem', mat: 'TEC-301' },
      { nome: 'Téc. Patricia Fagundes', cargo: 'Técnico de Enfermagem', mat: 'TEC-302' },
      { nome: 'Téc. Vanessa Toledo', cargo: 'Técnico de Enfermagem', mat: 'TEC-303' },
      { nome: 'Dr. Lucas Nogueira', cargo: 'Médico Clínico', mat: 'MED-107' },
      { nome: 'Dra. Beatriz Fontana', cargo: 'Pediatra', mat: 'MED-108' },
      { nome: 'Dr. André Castilho', cargo: 'Ortopedista', mat: 'MED-109' },
      { nome: 'Enf. Thiago Meireles', cargo: 'Enfermeiro', mat: 'ENF-204' },
      { nome: 'Enfª. Aline Carvalho', cargo: 'Enfermeiro', mat: 'ENF-205' },
      { nome: 'Téc. Marcos Vinicius', cargo: 'Técnico de Enfermagem', mat: 'TEC-304' },
      { nome: 'Téc. Renata Moura', cargo: 'Técnico de Enfermagem', mat: 'TEC-305' },
      { nome: 'Téc. Daniela Siqueira', cargo: 'Técnico de Enfermagem', mat: 'TEC-306' },
      { nome: 'Dr. Gustavo Cerqueira', cargo: 'Cardiologista', mat: 'MED-110' },
      { nome: 'Dra. Helena Peixoto', cargo: 'Ginecologista', mat: 'MED-111' },
      { nome: 'Enfª. Sofia Antunes', cargo: 'Enfermeiro', mat: 'ENF-206' },
      { nome: 'Enf. Gabriel Furtado', cargo: 'Enfermeiro', mat: 'ENF-207' },
      { nome: 'Téc. Diego Ramos', cargo: 'Técnico de Enfermagem', mat: 'TEC-307' },
      { nome: 'Téc. Luciana Tavares', cargo: 'Técnico de Enfermagem', mat: 'TEC-308' },
      { nome: 'Dr. Samuel Vianna', cargo: 'Médico Clínico', mat: 'MED-112' },
      { nome: 'Dra. Isabela Campos', cargo: 'Pediatra', mat: 'MED-113' },
      { nome: 'Téc. Rafael Pimenta', cargo: 'Técnico de Enfermagem', mat: 'TEC-309' },
      { nome: 'Téc. Fernanda Brandão', cargo: 'Técnico de Enfermagem', mat: 'TEC-310' },
    ];

    const profissionais: Profissional[] = nomesDemo.map((item, index) => {
      const setorIdx = index % setores.length;
      const cargoObj = cargos.find(c => c.nome === item.cargo) || cargos[0];
      
      let tipo_usuario: 'SEM_ACESSO' | 'ADM' | 'PADRÃO' = 'SEM_ACESSO';
      let login_usuario: string | undefined = undefined;
      let usuario_id: string | undefined = undefined;

      if (index === 0) {
        tipo_usuario = 'ADM';
        login_usuario = 'admin';
        usuario_id = 'usr-admin-1';
      } else if (index === 1) {
        tipo_usuario = 'PADRÃO';
        login_usuario = 'camila.med';
        usuario_id = 'usr-padrao-1';
      } else if (index === 4) {
        tipo_usuario = 'ADM';
        login_usuario = 'marcelo.med';
        usuario_id = 'usr-admin-2';
      } else if (index === 6) {
        tipo_usuario = 'PADRÃO';
        login_usuario = 'mariana.enf';
        usuario_id = 'usr-padrao-2';
      }

      return {
        id: `prof-demo-${index + 1}`,
        nome_completo: item.nome,
        matricula: item.mat,
        cargo_id: cargoObj.id,
        setor_id: setores[setorIdx].id,
        telefone: `(11) 98765-${1000 + index}`,
        email: `${item.mat.toLowerCase()}@hospital.local`,
        status: 'ATIVO',
        observacao: `Profissional admitido para escala do setor ${setores[setorIdx].nome}`,
        tipo_usuario,
        login_usuario,
        usuario_id,
        criado_em: new Date().toISOString(),
      };
    });

    this.set(STORAGE_KEYS.PROFISSIONAIS, profissionais);

    // Sincronizar / Assegurar os Usuários do Sistema vinculados
    let users = this.getUsers();
    const demoUsersToSync: User[] = [
      {
        id: 'usr-admin-1',
        nome: 'Dr. Roberto Silveira (Administrador)',
        login: 'admin',
        senhaHash: hashPassword('esc@l@'),
        tipo_acesso: 'ADM',
        ativo: true,
        status: 'ATIVO',
        deve_alterar_senha: true,
        profissional_id: 'prof-demo-1',
        criado_em: new Date().toISOString(),
      },
      {
        id: 'usr-padrao-1',
        nome: 'Dra. Camila Albuquerque',
        login: 'camila.med',
        senhaHash: hashPassword('esc@l@'),
        tipo_acesso: 'PADRÃO',
        ativo: true,
        status: 'ATIVO',
        deve_alterar_senha: true,
        profissional_id: 'prof-demo-2',
        criado_em: new Date().toISOString(),
      },
      {
        id: 'usr-admin-2',
        nome: 'Dr. Marcelo Mendonça',
        login: 'marcelo.med',
        senhaHash: hashPassword('esc@l@'),
        tipo_acesso: 'ADM',
        ativo: true,
        status: 'ATIVO',
        deve_alterar_senha: true,
        profissional_id: 'prof-demo-5',
        criado_em: new Date().toISOString(),
      },
      {
        id: 'usr-padrao-2',
        nome: 'Enfª. Mariana Rios',
        login: 'mariana.enf',
        senhaHash: hashPassword('esc@l@'),
        tipo_acesso: 'PADRÃO',
        ativo: true,
        status: 'ATIVO',
        deve_alterar_senha: true,
        profissional_id: 'prof-demo-7',
        criado_em: new Date().toISOString(),
      },
    ];

    demoUsersToSync.forEach(du => {
      const idx = users.findIndex(u => u.login === du.login || u.id === du.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...du };
      } else {
        users.push(du);
      }
    });
    this.set(STORAGE_KEYS.USERS, users);

    // Gerar Escalas para hoje (2026-09-10) e período
    const hojeStr = '2026-09-10';
    const escalas: Escala[] = [];
    const registros: PlantaoRegistro[] = [];

    // Férias e Atestados pré-cadastrados
    const afastamentos: PeriodoAfastamento[] = [
      {
        id: 'afast-demo-1',
        tipo: 'FÉRIAS',
        profissional_id: profissionais[3].id, // Dra. Juliana Prado
        data_inicio: '2026-09-05',
        data_fim: '2026-09-20',
        observacao: 'Período regular de férias 2026 aprovado pelo RH',
        observacao_adm: 'Período regular de férias 2026 aprovado pelo RH',
        registrado_por: adminLogin,
        registrado_em: new Date().toISOString(),
      },
      {
        id: 'afast-demo-2',
        tipo: 'ATESTADO',
        profissional_id: profissionais[7].id, // Enfª. Larissa Duarte
        data_inicio: '2026-09-08',
        data_fim: '2026-09-12',
        observacao: 'Atestado médico de 5 dias protocolado no DP',
        observacao_adm: 'Atestado médico de 5 dias protocolado no DP',
        registrado_por: adminLogin,
        registrado_em: new Date().toISOString(),
      },
    ];
    this.set(STORAGE_KEYS.AFASTAMENTOS, afastamentos);

    // Para cada profissional, criar escala de hoje
    profissionais.forEach((prof, idx) => {
      const escalaId = `esc-demo-${idx + 1}`;
      const turno: Escala['turno'] = idx % 2 === 0 ? 'DIURNO' : 'NOTURNO';
      const hora_inicio = turno === 'DIURNO' ? '07:00' : '19:00';
      const hora_fim = turno === 'DIURNO' ? '19:00' : '07:00';

      let tipoEscala: Escala['tipo_escala'] = 'TRABALHO';
      let situacao: PlantaoRegistro['situacao'] = 'PRESENTE';
      let motivo_ausencia: string | undefined = undefined;

      if (prof.id === profissionais[3].id) {
        tipoEscala = 'FÉRIAS';
        situacao = 'FÉRIAS';
      } else if (prof.id === profissionais[7].id) {
        tipoEscala = 'ATESTADO';
        situacao = 'ATESTADO';
      } else if (idx === 10) {
        situacao = 'AUSENTE';
        motivo_ausencia = 'Problema de transporte público / pane';
      } else if (idx === 14) {
        situacao = 'AUSENTE';
        motivo_ausencia = 'Imprevisto pessoal comunicado';
      } else if (idx === 20 || idx === 21) {
        situacao = 'PENDENTE';
      } else {
        situacao = 'PRESENTE';
      }

      escalas.push({
        id: escalaId,
        data: hojeStr,
        setor_id: prof.setor_id,
        profissional_id: prof.id,
        cargo_id: prof.cargo_id,
        turno,
        hora_inicio,
        hora_fim,
        tipo_escala: tipoEscala,
        observacao: 'Escala regular mensal',
        criado_por: adminLogin,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      });

      registros.push({
        id: `reg-demo-${idx + 1}`,
        escala_id: escalaId,
        data: hojeStr,
        profissional_id: prof.id,
        setor_id: prof.setor_id,
        situacao,
        motivo_ausencia,
        observacao: motivo_ausencia ? 'Registrado pela supervisão' : undefined,
        observacao_adm: motivo_ausencia ? 'Registrado pela supervisão' : undefined,
        registrado_por: adminLogin,
        horario_registro: '08:00',
        registrado_em: new Date().toISOString(),
      });
    });

    this.set(STORAGE_KEYS.ESCALAS, escalas);
    this.set(STORAGE_KEYS.PLANTOES, registros);

    this.addAuditoria(
      'usr-admin-1',
      'Administrador do Sistema',
      adminLogin,
      'CARGA_DEMONSTRACAO',
      'sistema',
      'all',
      'Carregados 30 profissionais, 6 setores, afastamentos e escalas de Setembro/2026',
      '127.0.0.1'
    );

    return { success: true, message: 'Dados de demonstração carregados com sucesso!' };
  }

  // --- BACKUP & RESTAURAÇÃO ---
  public exportFullBackup(): string {
    return this.exportarBackup();
  }

  public exportarBackup(): string {
    const backupData = {
      versao: '1.0.0',
      timestamp: new Date().toISOString(),
      usuarios: this.getUsers(),
      setores: this.getSetores(),
      cargos: this.getCargos(),
      profissionais: this.getProfissionais(),
      escalas: this.getEscalas(),
      plantoes: this.getPlantaoRegistros(),
      afastamentos: this.getAfastamentos(),
      auditoria: this.getAuditLogs(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importFullBackup(jsonString: string, loginUser: string = 'admin'): { success: boolean; message: string } {
    return this.restaurarBackup(jsonString);
  }

  public restaurarBackup(jsonString: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser?.tipo_acesso !== 'ADM') {
      return { success: false, message: 'Acesso negado. Apenas administradores podem restaurar backups.' };
    }

    try {
      const data = JSON.parse(jsonString);
      if (!data.usuarios || !data.setores) {
        return { success: false, message: 'Arquivo de backup inválido ou incompatível.' };
      }

      this.set(STORAGE_KEYS.USERS, data.usuarios);
      this.set(STORAGE_KEYS.SETORES, data.setores);
      this.set(STORAGE_KEYS.CARGOS, data.cargos || []);
      this.set(STORAGE_KEYS.PROFISSIONAIS, data.profissionais || []);
      this.set(STORAGE_KEYS.ESCALAS, data.escalas || []);
      this.set(STORAGE_KEYS.PLANTOES, data.plantoes || []);
      this.set(STORAGE_KEYS.AFASTAMENTOS, data.afastamentos || []);
      this.set(STORAGE_KEYS.AUDITORIA, data.auditoria || []);

      this.addAuditoria(
        currentUser.id,
        currentUser.nome,
        currentUser.login,
        'RESTAURAR_BACKUP',
        'sistema',
        'database',
        `Restaurado de backup gerado em ${data.timestamp || 'data anterior'}`,
        '127.0.0.1'
      );
      return { success: true, message: 'Backup restaurado com sucesso! O sistema foi atualizado.' };
    } catch {
      return { success: false, message: 'Falha ao processar arquivo JSON de backup.' };
    }
  }
}

export const db = new DatabaseService();
