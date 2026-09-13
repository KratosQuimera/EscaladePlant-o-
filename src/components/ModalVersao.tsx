import React, { useState } from 'react';
import { Tag, Plus, RotateCcw, X, CheckCircle, Sparkles, Calendar, Layers } from 'lucide-react';
import { VersionInfo, incrementVersion, resetVersionToInitial } from '../services/versionService';

interface ModalVersaoProps {
  isOpen: boolean;
  onClose: () => void;
  versionInfo: VersionInfo;
  onVersionUpdated: (newInfo: VersionInfo) => void;
  isAdmin: boolean;
}

export const ModalVersao: React.FC<ModalVersaoProps> = ({
  isOpen,
  onClose,
  versionInfo,
  onVersionUpdated,
  isAdmin
}) => {
  const [nota, setNota] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleIncrement = (tipo: 'PATCH' | 'MINOR' | 'MAJOR') => {
    const updated = incrementVersion(tipo, nota.trim() || undefined);
    onVersionUpdated(updated);
    setNota('');
    setSuccessMsg(`Versão incrementada com sucesso para ${updated.version}!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleReset = () => {
    if (confirm('Deseja reiniciar o contador de versão para a versão base V12.0?')) {
      const reset = resetVersionToInitial();
      onVersionUpdated(reset);
      setSuccessMsg('Versão reiniciada para V12.0.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Controle de Versão do Sistema</h3>
              <p className="text-xs text-slate-500">Histórico e contador oficial de releases</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Current Version Card */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Versão Oficial Atual
              </span>
              <div className="text-3xl font-extrabold tracking-tight text-white font-mono flex items-center gap-2">
                <span>{versionInfo.version}</span>
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="text-slate-400 font-mono">Build #{versionInfo.buildNumber}</div>
              <div className="text-slate-400 flex items-center gap-1 justify-end">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{versionInfo.releaseDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Version Counter Increment Section */}
        {isAdmin && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Contador de Versão (Ações de ADM)
              </span>
              <button
                onClick={handleReset}
                title="Reiniciar para V12.0"
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reiniciar para V12.0</span>
              </button>
            </div>

            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota da versão (opcional, ex: Ajuste de layout de escala)"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleIncrement('PATCH')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Patch (0.0.1)</span>
              </button>
              <button
                onClick={() => handleIncrement('MINOR')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Minor (V12.x)</span>
              </button>
              <button
                onClick={() => handleIncrement('MAJOR')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Major (V13.0)</span>
              </button>
            </div>
          </div>
        )}

        {/* Changelog History */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-600 mb-2">Histórico de Versões:</h4>
          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {versionInfo.changelog.map((entry, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 font-mono">{entry.version}</span>
                    <span className="text-[10px] text-slate-400">{entry.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{entry.description}</p>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                  {entry.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
