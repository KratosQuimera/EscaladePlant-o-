import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  AlertTriangle, 
  Sparkles, 
  Shield, 
  X, 
  ChevronRight,
  User as UserIcon,
  Building,
  CheckCircle2
} from 'lucide-react';
import { User, Profissional } from '../types';
import { db } from '../services/db';

interface HeaderProps {
  currentUser: User | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenChangePassword: () => void;
  onReloadData: () => void;
  onSelectProfissional?: (prof: Profissional) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  selectedDate,
  onDateChange,
  onOpenChangePassword,
  onReloadData,
  onSelectProfissional,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState<string | null>(null);

  const isAdmin = currentUser?.tipo_acesso === 'ADM';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(e.target.value.trim().length > 1);
  };

  // Resultados da busca global
  const allProfissionais = db.getProfissionais(currentUser?.tipo_acesso);
  const allSetores = db.getSetores();
  const allCargos = db.getCargos();
  const allUsuarios = isAdmin ? db.getUsers() : [];

  const matchedProfissionais = searchTerm.trim().length > 1
    ? allProfissionais.filter(p => 
        p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.matricula.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const matchedSetores = searchTerm.trim().length > 1
    ? allSetores.filter(s => s.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleCarregarDemo = () => {
    const res = db.carregarDadosDemonstracao(currentUser?.login || 'admin');
    setMsgFeedback(res.message);
    onReloadData();
    setTimeout(() => setMsgFeedback(null), 3500);
  };

  return (
    <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-20">
      {/* Banner de Aviso de Alteração de Senha Inicial */}
      {currentUser?.deve_alterar_senha && (
        <div id="alert-change-default-password" className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Aviso de Segurança:</strong> Você está utilizando a senha padrão inicial (esc@l@). Por segurança, altere sua senha imediatamente.</span>
          </div>
          <button
            id="btn-alert-alterar-senha"
            onClick={onOpenChangePassword}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium shadow-xs transition-colors shrink-0"
          >
            Alterar Agora
          </button>
        </div>
      )}

      {/* Feedback Toast Inline */}
      {msgFeedback && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{msgFeedback}</span>
          </div>
          <button onClick={() => setMsgFeedback(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Global Search (Apenas ADM tem busca geral abrangente com matrícula/usuários) */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-global-search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(searchTerm.trim().length > 1)}
              placeholder={isAdmin ? "Busca global: nome, matrícula, setor, cargo..." : "Buscar profissional ou setor..."}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => { setSearchTerm(''); setShowSearchResults(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg shadow-xl border border-slate-200 p-2 max-h-80 overflow-y-auto z-50">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <span>Resultados ({matchedProfissionais.length + matchedSetores.length})</span>
                <span className="text-[10px] text-slate-400">ESC para fechar</span>
              </div>

              {matchedProfissionais.length === 0 && matchedSetores.length === 0 ? (
                <p className="p-3 text-center text-xs text-slate-500">Nenhum registro encontrado para "{searchTerm}"</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {matchedProfissionais.map(p => {
                    const cargo = allCargos.find(c => c.id === p.cargo_id)?.nome;
                    const setor = allSetores.find(s => s.id === p.setor_id)?.nome;
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          if (onSelectProfissional) onSelectProfissional(p);
                          setShowSearchResults(false);
                        }}
                        className="p-2 hover:bg-slate-50 rounded cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{p.nome_completo}</p>
                            <p className="text-[11px] text-slate-500">Mat: {p.matricula} • {cargo} • Setor {setor}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    );
                  })}
                  {matchedSetores.map(s => (
                    <div key={s.id} className="p-2 hover:bg-slate-50 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Setor {s.nome}</p>
                          <p className="text-[11px] text-slate-500">{s.descricao || 'Setor Hospitalar'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">Setor</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Date Selector & Operational Actions */}
        <div className="flex items-center gap-3">
          {/* Active Work Date */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-700">Data Base:</span>
            <input
              id="input-header-selected-date"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs font-medium text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer"
            />
          </div>

          {/* Quick Demo Loader (For Evaluator Ease) */}
          {isAdmin && (
            <button
              id="btn-header-demo-data"
              onClick={handleCarregarDemo}
              title="Carregar / Restaurar 30 profissionais fictícios e escalas para testar o sistema"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Carga Demonstração</span>
            </button>
          )}

          {/* Environmental Local indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local SQLite</span>
          </div>
        </div>
      </div>
    </header>
  );
};
