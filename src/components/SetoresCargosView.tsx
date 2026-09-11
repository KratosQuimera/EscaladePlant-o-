import React, { useState } from 'react';
import { 
  Building2, 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  Check, 
  X, 
  AlertTriangle,
  Users
} from 'lucide-react';
import { Setor, Cargo, User } from '../types';
import { db } from '../services/db';

interface SetoresCargosViewProps {
  currentUser: User | null;
  onRefresh: () => void;
}

export const SetoresCargosView: React.FC<SetoresCargosViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'SETORES' | 'CARGOS'>('SETORES');
  
  // Setor Modal
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [nomeSetor, setNomeSetor] = useState('');
  const [descSetor, setDescSetor] = useState('');

  // Cargo Modal
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [nomeCargo, setNomeCargo] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = currentUser?.tipo_acesso === 'ADM';

  const setores = db.getSetores();
  const cargos = db.getCargos();
  const profissionais = db.getProfissionais();

  const handleOpenNewSetor = () => {
    if (!isAdmin) return;
    setEditingSetor(null);
    setNomeSetor('');
    setDescSetor('');
    setErrorMsg(null);
    setIsSetorModalOpen(true);
  };

  const handleOpenEditSetor = (s: Setor) => {
    if (!isAdmin) return;
    setEditingSetor(s);
    setNomeSetor(s.nome);
    setDescSetor(s.descricao || '');
    setErrorMsg(null);
    setIsSetorModalOpen(true);
  };

  const handleSaveSetor = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = db.saveSetor({
      id: editingSetor?.id,
      nome: nomeSetor,
      descricao: descSetor,
    });
    if (res.success) {
      setFeedback(res.message);
      setIsSetorModalOpen(false);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleDeleteSetor = (s: Setor) => {
    if (!isAdmin) return;
    if (window.confirm(`Deseja excluir o setor ${s.nome}?`)) {
      const res = db.deleteSetor(s.id);
      if (res.success) {
        setFeedback(res.message);
        onRefresh();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert(res.message);
      }
    }
  };

  const handleToggleSetor = (s: Setor) => {
    if (!isAdmin) return;
    const res = db.saveSetor({ id: s.id, ativo: !s.ativo });
    if (res.success) {
      setFeedback(`Setor ${s.nome} ${!s.ativo ? 'ativado' : 'desativado'}.`);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Cargos Handlers
  const handleOpenNewCargo = () => {
    if (!isAdmin) return;
    setEditingCargo(null);
    setNomeCargo('');
    setErrorMsg(null);
    setIsCargoModalOpen(true);
  };

  const handleOpenEditCargo = (c: Cargo) => {
    if (!isAdmin) return;
    setEditingCargo(c);
    setNomeCargo(c.nome);
    setErrorMsg(null);
    setIsCargoModalOpen(true);
  };

  const handleSaveCargo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = db.saveCargo({
      id: editingCargo?.id,
      nome: nomeCargo,
    });
    if (res.success) {
      setFeedback(res.message);
      setIsCargoModalOpen(false);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleToggleCargo = (c: Cargo) => {
    if (!isAdmin) return;
    const res = db.saveCargo({ id: c.id, ativo: !c.ativo });
    if (res.success) {
      setFeedback(`Cargo ${c.nome} ${!c.ativo ? 'ativado' : 'desativado'}.`);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div id="setores-cargos-view" className="p-6 space-y-5 max-w-7xl mx-auto">
      {feedback && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold z-50 animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>ESTRUTURA: SETORES E CARGOS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuração dinâmica dos postos de atendimento e funções operacionais
          </p>
        </div>

        {/* Alternância Setores vs Cargos */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
            <button
              onClick={() => setActiveTab('SETORES')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'SETORES'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Setores Hospitalares ({setores.length})
            </button>
            <button
              onClick={() => setActiveTab('CARGOS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'CARGOS'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cargos e Funções ({cargos.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB SETORES */}
      {activeTab === 'SETORES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              * Setores criados aqui são refletidos automaticamente no Dashboard e nos relatórios.
            </p>
            {isAdmin && (
              <button
                id="btn-adicionar-setor"
                onClick={handleOpenNewSetor}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Setor</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {setores.map(setor => {
              const profsNoSetor = profissionais.filter(p => p.setor_id === setor.id);

              return (
                <div 
                  key={setor.id}
                  className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                    setor.ativo ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                        <span>Setor {setor.nome}</span>
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        setor.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {setor.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">{setor.descricao || 'Sem descrição cadastrada.'}</p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profsNoSetor.length} profissional(is) vinculados</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditSetor(setor)}
                        title="Editar Setor"
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleSetor(setor)}
                        title={setor.ativo ? 'Desativar Setor' : 'Ativar Setor'}
                        className={`p-1.5 rounded transition-colors ${
                          setor.ativo ? 'hover:bg-amber-50 text-slate-400 hover:text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSetor(setor)}
                        title="Excluir Setor (Apenas se sem vínculos)"
                        className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CARGOS */}
      {activeTab === 'CARGOS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              * Cargos e especialidades para classificação da equipe hospitalar.
            </p>
            {isAdmin && (
              <button
                id="btn-adicionar-cargo"
                onClick={handleOpenNewCargo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Cargo</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Nome do Cargo / Especialidade</th>
                  <th className="py-3 px-3">Profissionais Vinculados</th>
                  <th className="py-3 px-3">Status</th>
                  {isAdmin && <th className="py-3 px-4 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargos.map(cargo => {
                  const profs = profissionais.filter(p => p.cargo_id === cargo.id);

                  return (
                    <tr key={cargo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {cargo.nome}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {profs.length} profissionais
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cargo.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {cargo.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditCargo(cargo)}
                              title="Editar Cargo"
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleCargo(cargo)}
                              title={cargo.ativo ? 'Desativar Cargo' : 'Ativar Cargo'}
                              className={`p-1.5 rounded transition-colors ${
                                cargo.ativo ? 'hover:bg-amber-50 text-slate-400 hover:text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Setor */}
      {isSetorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingSetor ? 'Editar Setor' : 'Adicionar Novo Setor'}
              </h3>
              <button onClick={() => setIsSetorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSetor} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome / Código do Setor <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeSetor}
                  onChange={(e) => setNomeSetor(e.target.value)}
                  placeholder="Ex: 8°A, 8°B, UTI Adulto..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Operacional
                </label>
                <input
                  type="text"
                  value={descSetor}
                  onChange={(e) => setDescSetor(e.target.value)}
                  placeholder="Ex: Ala de Recuperação Pós-Anestésica..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSetorModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  Salvar Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cargo */}
      {isCargoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCargo ? 'Editar Cargo' : 'Adicionar Novo Cargo'}
              </h3>
              <button onClick={() => setIsCargoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCargo} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Cargo / Especialidade <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeCargo}
                  onChange={(e) => setNomeCargo(e.target.value)}
                  placeholder="Ex: Neurologista, Fisioterapeuta..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCargoModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  Salvar Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
