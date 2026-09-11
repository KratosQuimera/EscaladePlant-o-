import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Building2, 
  Briefcase, 
  Phone, 
  Mail, 
  Edit, 
  Power, 
  Check, 
  X, 
  ShieldAlert,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  Lock
} from 'lucide-react';
import { Profissional, Setor, Cargo, User } from '../types';
import { db } from '../services/db';

interface ProfissionaisViewProps {
  currentUser: User | null;
  onRefresh: () => void;
}

export const ProfissionaisView: React.FC<ProfissionaisViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('TODOS');
  const [filterCargo, setFilterCargo] = useState('TODOS');
  const [filterAcesso, setFilterAcesso] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Profissional | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [setorId, setSetorId] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [observacao, setObservacao] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'SEM_ACESSO' | 'ADM' | 'PADRÃO'>('SEM_ACESSO');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAdmin = currentUser?.tipo_acesso === 'ADM';

  const setores = db.getSetores().filter(s => s.ativo);
  const cargos = db.getCargos().filter(c => c.ativo);
  const profissionais = db.getProfissionais(currentUser?.tipo_acesso);

  const handleOpenNew = () => {
    if (!isAdmin) return;
    setEditingProf(null);
    setNome('');
    setMatricula('');
    setCargoId(cargos[0]?.id || '');
    setSetorId(setores[0]?.id || '');
    setTelefone('');
    setEmail('');
    setObservacao('');
    setTipoUsuario('SEM_ACESSO');
    setLoginUsuario('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Profissional) => {
    if (!isAdmin) return;
    setEditingProf(p);
    setNome(p.nome_completo);
    setMatricula(p.matricula);
    setCargoId(p.cargo_id);
    setSetorId(p.setor_id);
    setTelefone(p.telefone || '');
    setEmail(p.email || '');
    setObservacao(p.observacao || '');
    setTipoUsuario(p.tipo_usuario || 'SEM_ACESSO');
    setLoginUsuario(p.login_usuario || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleNomeChange = (val: string) => {
    setNome(val);
    // Se o usuário ainda não editou manualmente o login e não é edição com login pré-existente
    if (tipoUsuario !== 'SEM_ACESSO' && !editingProf) {
      const clean = val
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^(dr\.|dra\.|enf\.|enfª\.|téc\.|tec\.)\s*/i, '')
        .trim();
      const parts = clean.split(/\s+/);
      if (parts.length >= 2) {
        setLoginUsuario(`${parts[0]}.${parts[parts.length - 1]}`);
      } else if (parts.length === 1 && parts[0]) {
        setLoginUsuario(parts[0]);
      }
    }
  };

  const handleTipoUsuarioSelect = (tipo: 'SEM_ACESSO' | 'ADM' | 'PADRÃO') => {
    setTipoUsuario(tipo);
    if (tipo !== 'SEM_ACESSO' && !loginUsuario.trim()) {
      const clean = nome
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^(dr\.|dra\.|enf\.|enfª\.|téc\.|tec\.)\s*/i, '')
        .trim();
      const parts = clean.split(/\s+/);
      if (parts.length >= 2) {
        setLoginUsuario(`${parts[0]}.${parts[parts.length - 1]}`);
      } else if (parts.length === 1 && parts[0]) {
        setLoginUsuario(parts[0]);
      } else if (matricula.trim()) {
        setLoginUsuario(matricula.toLowerCase().replace(/[^a-z0-9]/g, ''));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (tipoUsuario !== 'SEM_ACESSO' && !loginUsuario.trim()) {
      setErrorMsg('Por favor, defina o login de acesso do usuário no sistema.');
      return;
    }

    const data: Partial<Profissional> & {
      tipo_usuario?: 'SEM_ACESSO' | 'ADM' | 'PADRÃO';
      login_usuario?: string;
    } = {
      id: editingProf?.id,
      nome_completo: nome,
      matricula,
      cargo_id: cargoId,
      setor_id: setorId,
      telefone,
      email,
      observacao,
      tipo_usuario: tipoUsuario,
      login_usuario: tipoUsuario !== 'SEM_ACESSO' ? loginUsuario.trim().toLowerCase().replace(/[@\s]/g, '') : undefined,
    };

    const res = db.saveProfissional(data);
    if (res.success) {
      setFeedback(res.message);
      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleToggleStatus = (p: Profissional) => {
    if (!isAdmin) return;
    const confirmMsg = p.status === 'ATIVO' 
      ? `Deseja realmente desativar o profissional ${p.nome_completo}? Seu histórico permanecerá preservado e o acesso ao sistema será suspenso.`
      : `Deseja reativar o profissional ${p.nome_completo}?`;

    if (window.confirm(confirmMsg)) {
      const res = db.toggleProfissionalStatus(p.id);
      setFeedback(res.message);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const filtered = profissionais.filter(p => {
    if (filterSetor !== 'TODOS' && p.setor_id !== filterSetor) return false;
    if (filterCargo !== 'TODOS' && p.cargo_id !== filterCargo) return false;
    if (filterAcesso !== 'TODOS') {
      const acesso = p.tipo_usuario || 'SEM_ACESSO';
      if (filterAcesso === 'ADM' && acesso !== 'ADM') return false;
      if (filterAcesso === 'PADRÃO' && acesso !== 'PADRÃO') return false;
      if (filterAcesso === 'SEM_ACESSO' && acesso !== 'SEM_ACESSO') return false;
    }
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      const login = (p.login_usuario || '').toLowerCase();
      return p.nome_completo.toLowerCase().includes(t) || 
             p.matricula.toLowerCase().includes(t) ||
             login.includes(t);
    }
    return true;
  });

  return (
    <div id="profissionais-view" className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Toast */}
      {feedback && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>CADASTRO DE PROFISSIONAIS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de colaboradores vinculados a cargos e setores hospitalares
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-novo-profissional"
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Profissional</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, matrícula ou login..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterSetor}
            onChange={(e) => setFilterSetor(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os Setores</option>
            {setores.map(s => (
              <option key={s.id} value={s.id}>Setor {s.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterCargo}
            onChange={(e) => setFilterCargo(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os Cargos</option>
            {cargos.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="filter-acesso-usuario"
            value={filterAcesso}
            onChange={(e) => setFilterAcesso(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer font-medium"
          >
            <option value="TODOS">Todos os Acessos</option>
            <option value="ADM">🟡 Administradores (ADM)</option>
            <option value="PADRÃO">🔵 Usuários Padrão</option>
            <option value="SEM_ACESSO">⚪ Sem Acesso ao Sistema</option>
          </select>
        </div>
      </div>

      {/* Tabela de Profissionais */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Profissional</th>
                <th className="py-3 px-3">Matrícula</th>
                <th className="py-3 px-3">Cargo</th>
                <th className="py-3 px-3">Setor</th>
                <th className="py-3 px-3">Acesso Sistema</th>
                <th className="py-3 px-3">Contato</th>
                <th className="py-3 px-3">Status</th>
                {isAdmin && <th className="py-3 px-4 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Nenhum profissional encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(prof => {
                  const cargoNome = cargos.find(c => c.id === prof.cargo_id)?.nome;
                  const setorNome = setores.find(s => s.id === prof.setor_id)?.nome;
                  const tipoAcesso = prof.tipo_usuario || 'SEM_ACESSO';

                  return (
                    <tr key={prof.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{prof.nome_completo}</div>
                        {isAdmin && prof.observacao && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs" title={prof.observacao}>
                            Obs: {prof.observacao}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 font-semibold">
                        {prof.matricula}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {cargoNome}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700">Setor {setorNome}</span>
                      </td>

                      <td className="py-3 px-3">
                        {tipoAcesso === 'ADM' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>ADM</span>
                            {prof.login_usuario && (
                              <span className="font-mono font-medium text-amber-700">(@{prof.login_usuario})</span>
                            )}
                          </span>
                        ) : tipoAcesso === 'PADRÃO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-300">
                            <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>PADRÃO</span>
                            {prof.login_usuario && (
                              <span className="font-mono font-medium text-blue-700">(@{prof.login_usuario})</span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <span>Sem Acesso</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {prof.telefone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {prof.telefone}</div>}
                        {prof.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {prof.email}</div>}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          prof.status === 'ATIVO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {prof.status}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(prof)}
                              title="Editar Profissional e Acesso"
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(prof)}
                              title={prof.status === 'ATIVO' ? 'Desativar Profissional (suspende login)' : 'Ativar Profissional'}
                              className={`p-1.5 rounded transition-colors ${
                                prof.status === 'ATIVO'
                                  ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                                  : 'hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Profissional */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>{editingProf ? 'Editar Profissional' : 'Novo Profissional'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="Ex: Dr. Carlos Eduardo Silveira"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matrícula (Única) <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                    placeholder="Ex: MED-105"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo <span className="text-emerald-600">*</span>
                  </label>
                  <select
                    value={cargoId}
                    onChange={(e) => setCargoId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Setor de Lotação <span className="text-emerald-600">*</span>
                  </label>
                  <select
                    value={setorId}
                    onChange={(e) => setSetorId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {setores.map(s => (
                      <option key={s.id} value={s.id}>Setor {s.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="profissional@hospital.local"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* SEÇÃO NOVO CAMPO: SELEÇÃO DE TIPO DE USUÁRIO (ADM / PADRÃO / SEM ACESSO) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Acesso ao Sistema (Usuário de Login)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Controle de Autenticação</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Usuário <span className="text-emerald-600 font-bold">*</span>
                  </label>
                  <select
                    id="select-tipo-usuario"
                    value={tipoUsuario}
                    onChange={(e) => handleTipoUsuarioSelect(e.target.value as 'SEM_ACESSO' | 'ADM' | 'PADRÃO')}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="SEM_ACESSO">⚪ Sem Acesso ao Sistema (Apenas Escala de Plantão)</option>
                    <option value="PADRÃO">🔵 USUÁRIO PADRÃO (Consulta, Leitura de Escalas e Relatórios)</option>
                    <option value="ADM">🟡 ADMINISTRADOR (Acesso Total, Marcações e Gestão)</option>
                  </select>
                </div>

                {tipoUsuario !== 'SEM_ACESSO' && (
                  <div className="pt-2 border-t border-slate-200 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Login de Acesso no Sistema <span className="text-emerald-600 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">@</span>
                        <input
                          id="input-login-usuario"
                          type="text"
                          required
                          value={loginUsuario}
                          onChange={(e) => setLoginUsuario(e.target.value.toLowerCase().replace(/[@\s]/g, ''))}
                          placeholder="ex: roberto.silveira"
                          className="w-full text-xs pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Identificador único que o profissional usará na tela de login.
                      </p>
                    </div>

                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Credenciais Iniciais Configuradas:</span>
                      </div>
                      <p className="text-emerald-800 text-[11px]">
                        Senha inicial padrão: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-950">esc@l@</strong>
                      </p>
                      <p className="text-slate-600 text-[10px]">
                        Perfil atribuído: <strong className="text-slate-800">{tipoUsuario === 'ADM' ? 'Administrador (Total)' : 'Usuário Padrão (Leitura)'}</strong>. A troca de senha será exigida automaticamente no primeiro acesso.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observação Administrativa (Campo Restrito ADM)
                </label>
                <textarea
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Informações restritas ao administrador..."
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  {editingProf ? 'Salvar Alterações' : 'Cadastrar Profissional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
