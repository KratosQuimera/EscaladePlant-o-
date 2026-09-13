import React, { useState } from 'react';
import { 
  UserCog, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  User as UserIcon, 
  Edit, 
  Power, 
  AlertTriangle, 
  Check, 
  X,
  Lock
} from 'lucide-react';
import { User, UserRole } from '../types';
import { db } from '../services/db';

interface UsuariosViewProps {
  currentUser: User | null;
  onRefresh: () => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [tipoAcesso, setTipoAcesso] = useState<UserRole>('PADRÃO');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const users = db.getUsers();

  const handleOpenNew = () => {
    setEditingUser(null);
    setNome('');
    setLogin('');
    setTipoAcesso('PADRÃO');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setNome(u.nome);
    setLogin(u.login);
    setTipoAcesso(u.tipo_acesso);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = db.saveUser({
      id: editingUser?.id,
      nome,
      login,
      tipo_acesso: tipoAcesso,
    });

    if (res.success) {
      setFeedback(res.message);
      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetPassword = (u: User) => {
    if (window.confirm(`Deseja redefinir a senha do usuário ${u.nome} para a senha padrão inicial (esc@l@)?`)) {
      const res = db.resetPassword(u.id);
      if (res.success) {
        setFeedback(res.message);
        onRefresh();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        alert(res.message);
      }
    }
  };

  const handleToggleStatus = (u: User) => {
    if (u.id === currentUser?.id) {
      alert('Você não pode desativar o seu próprio usuário logado.');
      return;
    }

    const res = db.toggleUserStatus(u.id);
    if (res.success) {
      setFeedback(res.message);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div id="usuarios-view" className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {feedback && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-amber-600" />
            <span>GESTÃO DE USUÁRIOS & CONTROLE DE ACESSO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hierarquia de permissões (Administrador vs Usuário Padrão) e credenciais
          </p>
        </div>

        <button
          id="btn-novo-usuario"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors w-full sm:w-auto min-h-[40px]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* VISUALIZAÇÃO MOBILE (md:hidden) */}
      <div className="md:hidden space-y-3">
        {users.map(u => (
          <div 
            key={`mobile-user-${u.id}`}
            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>{u.nome}</span>
                  {u.id === currentUser?.id && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      (Você)
                    </span>
                  )}
                </h3>
                <span className="text-xs font-mono text-slate-500 mt-0.5 block">@{u.login}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                u.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {u.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                u.tipo_acesso === 'ADM'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                {u.tipo_acesso}
              </span>

              {u.deve_alterar_senha ? (
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium text-[10px] border border-amber-200">
                  Pendente troca de senha
                </span>
              ) : (
                <span className="text-emerald-700 text-[10px]">Senha personalizada</span>
              )}
            </div>

            {/* Ações Mobile */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(u)}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 min-h-[36px]"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => handleResetPassword(u)}
                className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 min-h-[36px]"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Resetar</span>
              </button>
              <button
                onClick={() => handleToggleStatus(u)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 min-h-[36px] border ${
                  u.status === 'ATIVO'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{u.status === 'ATIVO' ? 'Inativar' : 'Ativar'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Usuários DESKTOP */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Nome do Operador</th>
              <th className="py-3 px-3">Login de Acesso</th>
              <th className="py-3 px-3">Hierarquia / Perfil</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Aviso Senha Padrão</th>
              <th className="py-3 px-4 text-center">Ações Administrativas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>{u.nome}</span>
                  {u.id === currentUser?.id && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-normal">
                      (Você)
                    </span>
                  )}
                </td>

                <td className="py-3 px-3 font-mono text-slate-700">
                  @{u.login}
                </td>

                <td className="py-3 px-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    u.tipo_acesso === 'ADM'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : u.tipo_acesso === 'GESTOR'
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {u.tipo_acesso === 'ADM' ? '👑 ADM' : u.tipo_acesso === 'GESTOR' ? '📋 GESTOR' : '🩺 PLANTONISTA'}
                  </span>
                </td>

                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    u.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {u.status}
                  </span>
                </td>

                <td className="py-3 px-3 text-xs">
                  {u.deve_alterar_senha ? (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium text-[11px] border border-amber-200">
                      Pendente de troca
                    </span>
                  ) : (
                    <span className="text-emerald-700 text-[11px]">Senha personalizada</span>
                  )}
                </td>

                <td className="py-3 px-4 text-center">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      title="Editar Dados do Usuário"
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleResetPassword(u)}
                      title="Redefinir senha para padrão (esc@l@)"
                      className="p-1.5 hover:bg-amber-50 text-amber-700 rounded transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      title={u.status === 'ATIVO' ? 'Desativar Usuário' : 'Ativar Usuário'}
                      className={`p-1.5 rounded transition-colors ${
                        u.status === 'ATIVO' ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600' : 'hover:bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Dra. Mariana Vasconcelos"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login de Acesso <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value.toLowerCase().trim())}
                  placeholder="Ex: mariana.vasc"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hierarquia / Tipo de Acesso <span className="text-amber-500">*</span>
                </label>
                <select
                  value={tipoAcesso}
                  onChange={(e) => setTipoAcesso(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none cursor-pointer font-bold"
                >
                  <option value="PADRÃO">🩺 PLANTONISTA / USUÁRIO PADRÃO (Portal e Consultas)</option>
                  <option value="GESTOR">📋 GESTOR / COORDENAÇÃO (Escalas, Trocas, Presenças)</option>
                  <option value="ADM">👑 ADMINISTRADOR (Acesso Total e Configurações)</option>
                </select>
              </div>

              {!editingUser && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">Senha inicial padrão configurada:</p>
                  <p className="font-mono bg-white p-1 rounded border border-amber-300 text-amber-950 font-bold">
                    esc@l@
                  </p>
                  <p className="text-[11px]">
                    O usuário será instruído a alterar a senha logo após o primeiro login.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
