import React from 'react';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  WifiOff, 
  ShieldCheck, 
  Zap,
  Globe
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstalar = async () => {
    const success = await installApp();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Instalar Aplicativo (PWA)</h3>
              <p className="text-xs text-slate-500">Acesso instantâneo direto na tela inicial</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-sm">Aplicativo Já Instalado!</h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Este sistema já está configurado e funcionando no modo aplicativo dedicado em seu dispositivo.
              </p>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-2">
                <p className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Share className="w-4 h-4 text-blue-600" />
                  Como instalar no iPhone ou iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[12px] text-blue-900">
                  <li>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima <Share className="w-3.5 h-3.5 inline mx-0.5" />) na barra inferior do Safari.</li>
                  <li>Role as opções para cima e toque em <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />).</li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito para confirmar.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-2">
                <p className="font-semibold text-emerald-900">
                  Instale sem precisar baixar das lojas de apps (Google Play / App Store).
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  O aplicativo funciona como um app nativo em tela cheia, consome quase zero de memória e permite acesso rápido aos seus plantões.
                </p>
              </div>

              <button
                type="button"
                onClick={handleInstalar}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Agora no Dispositivo</span>
              </button>
            </div>
          )}

          {/* Benefícios do PWA */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Vantagens do Modo App</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <Zap className="w-4 h-4 text-amber-600 mb-1" />
                <p className="font-bold text-slate-800 text-[11px]">Carregamento Rápido</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Abertura instantânea sem barra de navegador.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <WifiOff className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="font-bold text-slate-800 text-[11px]">Resiliência Offline</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Consulte escalas mesmo com instabilidade de rede.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-blue-600 mb-1" />
                <p className="font-bold text-slate-800 text-[11px]">Sincronização Nuvem</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Atualização contínua com o Firebase Firestore.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
