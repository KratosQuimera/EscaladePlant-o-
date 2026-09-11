import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  UserCheck, 
  UserX, 
  Palmtree, 
  FileHeart, 
  CheckCircle2, 
  Lock,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Profissional, Escala, Setor, Cargo, User } from '../types';
import { db } from '../services/db';

// Modal de Ausência (Requirements 17)
interface ModalAusenciaProps {
  isOpen: boolean;
  onClose: () => void;
  escala: Escala | null;
  profissional: Profissional | null;
  onSuccess: () => void;
}

export const ModalAusencia: React.FC<ModalAusenciaProps> = ({
  isOpen,
  onClose,
  escala,
  profissional,
  onSuccess,
}) => {
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !escala || !profissional) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Informe o motivo da ausência.');
      return;
    }

    const res = db.registrarAusencia(escala.id, motivo.trim(), observacao.trim());
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">Registrar Ausência no Plantão</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-100 text-xs text-rose-950">
            <p><strong>Profissional:</strong> {profissional.nome_completo} ({profissional.matricula})</p>
            <p><strong>Data do Plantão:</strong> {escala.data.split('-').reverse().join('/')} • Turno {escala.turno}</p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo da Ausência <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Falta não justificada, problemas de transporte..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação Administrativa (Campo Sensível)
            </label>
            <textarea
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Detalhes internos para auditoria e controle do ADM (visível apenas para administradores)..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
            >
              Confirmar Ausência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Férias com Validação de Conflito (Requirements 18 & 20)
interface ModalFeriasProps {
  isOpen: boolean;
  onClose: () => void;
  profissional: Profissional | null;
  onSuccess: () => void;
}

export const ModalFerias: React.FC<ModalFeriasProps> = ({
  isOpen,
  onClose,
  profissional,
  onSuccess,
}) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [observacao, setObservacao] = useState('');
  const [conflitos, setConflitos] = useState<string[]>([]);
  const [avisoConflitoVisivel, setAvisoConflitoVisivel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !profissional) return null;

  const handleValidarOuSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dataInicio || !dataFim) {
      setError('Informe as datas de início e fim.');
      return;
    }

    if (new Date(dataFim) < new Date(dataInicio)) {
      setError('A data final não pode ser anterior à data inicial.');
      return;
    }

    // Verificar conflitos se ainda não foi revisado
    if (!avisoConflitoVisivel) {
      const checagem = db.verificarConflitosPeriodo(profissional.id, dataInicio, dataFim);
      if (checagem.conflito) {
        setConflitos(checagem.datasConflitantes);
        setAvisoConflitoVisivel(true);
        return;
      }
    }

    // Confirmar período de férias
    const res = db.registrarFerias(profissional.id, dataInicio, dataFim, observacao);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Registrar Período de Férias</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleValidarOuSalvar} className="mt-4 space-y-4">
          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs text-blue-950">
            <p><strong>Profissional:</strong> {profissional.nome_completo} ({profissional.matricula})</p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* Aviso Obrigatório de Conflito de Períodos (Requirement 20) */}
          {avisoConflitoVisivel && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Este profissional possui escala durante o período informado!</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Datas conflitantes detectadas ({conflitos.length}):
              </p>
              <div className="max-h-24 overflow-y-auto bg-white/80 p-1.5 rounded border border-amber-200 text-[11px] font-mono">
                {conflitos.map(d => d.split('-').reverse().join('/')).join(', ')}
              </div>
              <p className="text-[11px] font-semibold text-amber-950">
                O sistema não apagará as escalas; apenas sincronizará a situação para "FÉRIAS". Deseja confirmar?
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Inicial <span className="text-blue-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setAvisoConflitoVisivel(false); }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Final <span className="text-blue-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dataFim}
                onChange={(e) => { setDataFim(e.target.value); setAvisoConflitoVisivel(false); }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação Administrativa (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Férias relativas ao período aquisitivo 2025/2026..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              {avisoConflitoVisivel ? 'Confirmar Férias Mesmo com Conflito' : 'Salvar Período de Férias'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Atestado com Estrita Proteção de Privacidade Médica (Requirements 19 & 20)
interface ModalAtestadoProps {
  isOpen: boolean;
  onClose: () => void;
  profissional: Profissional | null;
  onSuccess: () => void;
}

export const ModalAtestado: React.FC<ModalAtestadoProps> = ({
  isOpen,
  onClose,
  profissional,
  onSuccess,
}) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [observacao, setObservacao] = useState('');
  const [conflitos, setConflitos] = useState<string[]>([]);
  const [avisoConflitoVisivel, setAvisoConflitoVisivel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !profissional) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dataInicio || !dataFim) {
      setError('Informe o período do atestado.');
      return;
    }

    if (new Date(dataFim) < new Date(dataInicio)) {
      setError('A data final não pode ser anterior à data inicial.');
      return;
    }

    if (!avisoConflitoVisivel) {
      const checagem = db.verificarConflitosPeriodo(profissional.id, dataInicio, dataFim);
      if (checagem.conflito) {
        setConflitos(checagem.datasConflitantes);
        setAvisoConflitoVisivel(true);
        return;
      }
    }

    const res = db.registrarAtestado(profissional.id, dataInicio, dataFim, observacao);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileHeart className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Registrar Período de Atestado</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100 text-xs text-amber-950">
            <p><strong>Profissional:</strong> {profissional.nome_completo} ({profissional.matricula})</p>
            <p className="text-[11px] text-amber-800 mt-1">
              * Conforme diretriz de privacidade: <strong>NÃO</strong> solicite nem registre diagnóstico, CID ou detalhe clínico médico.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {avisoConflitoVisivel && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Profissional possui escalas no período informado ({conflitos.length}):</span>
              </div>
              <p className="text-[11px] font-mono">
                {conflitos.map(d => d.split('-').reverse().join('/')).join(', ')}
              </p>
              <p className="text-[10px] text-amber-800">
                O registro impedirá que ele seja considerado ausente durante o período.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Inicial <span className="text-amber-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setAvisoConflitoVisivel(false); }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Final <span className="text-amber-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dataFim}
                onChange={(e) => { setDataFim(e.target.value); setAvisoConflitoVisivel(false); }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação Administrativa (Apenas tramitação interna)
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Documento físico entregue ao Departamento Pessoal..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs"
            >
              {avisoConflitoVisivel ? 'Confirmar Atestado' : 'Salvar Período de Atestado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Alteração de Senha
interface ModalAlterarSenhaProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: () => void;
}

export const ModalAlterarSenha: React.FC<ModalAlterarSenhaProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha.length < 5) {
      setError('A senha deve possuir no mínimo 5 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('A confirmação de senha não confere.');
      return;
    }

    const res = db.changePassword(currentUser.id, novaSenha);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Alterar Senha de Acesso</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-slate-500">
            Usuário: <strong className="text-slate-800">{currentUser.nome}</strong> (@{currentUser.login})
          </p>

          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite a nova senha segura..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              Atualizar Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
