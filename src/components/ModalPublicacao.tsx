import React, { useState } from 'react';
import { 
  Globe, 
  Download, 
  Server, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Laptop, 
  Smartphone, 
  FolderArchive, 
  Terminal,
  ShieldCheck,
  Cloud
} from 'lucide-react';
import JSZip from 'jszip';

interface ModalPublicacaoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalPublicacao: React.FC<ModalPublicacaoProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiadoDev, setCopiadoDev] = useState(false);
  const [gerandoZip, setGerandoZip] = useState(false);
  const [sucessoZip, setSucessoZip] = useState(false);

  if (!isOpen) return null;

  const urlDev = 'https://ais-dev-fvprrgehunhgzloti3oxda-17816849989.us-west1.run.app';

  const handleCopiarUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiadoDev(true);
    setTimeout(() => setCopiadoDev(false), 3000);
  };

  const handleBaixarPacoteWeb = async () => {
    try {
      setGerandoZip(true);
      const zip = new JSZip();

      // Instruções de Hospedagem
      const readmeText = `# SISTEMA DE GESTÃO DE PLANTÕES HOSPITALARES - PACOTE DE PUBLICAÇÃO WEB
Versão: V12.0
Data: ${new Date().toLocaleDateString('pt-BR')}

Este pacote contém os arquivos prontos para você publicar o sistema no seu próprio endereço web ou servidor.

---

### OPÇÃO 1: PUBLICAR NO VERCEL / NETLIFY / FIREBASE HOSTING / CLOUDFLARE PAGES (Gratuito)
1. Crie uma conta no Vercel (vercel.com) ou Netlify (netlify.com).
2. Arraste esta pasta descompactada para a tela de "Deploy" ou selecione os arquivos da pasta 'dist/'.
3. O sistema gerará automaticamente um endereço próprio (ex: https://meuhospital-plantoes.vercel.app).
4. É só enviar o link para a equipe!

---

### OPÇÃO 2: HOSPEDAGEM TRADICIONAL (Apache, Nginx, cPanel, IIS, Hostinger, Locaweb)
1. Acesse o gerenciador de arquivos (cPanel/FTP) do seu domínio.
2. Extraia os arquivos para dentro da pasta pública (normalmente 'public_html' ou 'www').
3. Pronto! O sistema já rodará no seu domínio (ex: https://plantoes.meuhospital.com.br).

---

### OPÇÃO 3: SERVIDOR LOCAL DA REDE DO HOSPITAL (Intranet)
1. Instale o Node.js no servidor local.
2. Na pasta, execute:
   npx serve -s . -l 3000
3. Todos os computadores do hospital poderão acessar pelo IP local:
   http://192.168.1.X:3000

---
* Sincronização em Nuvem: O banco de dados Firebase Firestore já está integrado e continuará sincronizando em tempo real mesmo hospedado no seu próprio domínio!
`;

      zip.file('LEIA_COMO_PUBLICAR.txt', readmeText);

      // Buscar arquivos do build atual da aplicação
      const responseHtml = await fetch('/index.html');
      const htmlText = await responseHtml.text();
      zip.file('index.html', htmlText);

      // Adicionar arquivo .htaccess para servidores Apache / cPanel
      const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;
      zip.file('.htaccess', htaccessContent);

      // Adicionar arquivo vercel.json para deploy direto no Vercel
      const vercelJson = JSON.stringify({
        "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
      }, null, 2);
      zip.file('vercel.json', vercelJson);

      // Adicionar _redirects para Netlify e Cloudflare Pages
      zip.file('_redirects', '/* /index.html 200\n');

      const blob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `sistema_plantoes_pacote_web_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setSucessoZip(true);
      setTimeout(() => setSucessoZip(false), 4000);
    } catch (err) {
      console.error('Erro ao gerar pacote web:', err);
      alert('Erro ao gerar pacote para download. Tente novamente.');
    } finally {
      setGerandoZip(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Topo do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-base">Publicar em Outro Endereço Web</h3>
              <p className="text-xs text-slate-600 font-medium">Opções para rodar no seu próprio domínio, nuvem ou servidor local</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Rolagem */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          
          {/* Card 1: Link Ativo Imediato na Nuvem */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>Endereço Online Ativo Agora (Sem Instalação)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-bold">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Você já pode compartilhar e acessar diretamente pelo endereço abaixo de qualquer computador, tablet ou celular:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={urlDev}
                className="flex-1 text-xs font-mono bg-white border border-emerald-300 rounded-lg px-3 py-2 text-slate-800 select-all focus:outline-none"
              />
              <button
                onClick={() => handleCopiarUrl(urlDev)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
              >
                {copiadoDev ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiadoDev ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <a
                href={urlDev}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg shrink-0 transition-colors"
                title="Abrir em nova aba"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Baixar Pacote Completo para Outro Servidor */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FolderArchive className="w-4 h-4 text-blue-600" />
              <span>Baixar Pacote de Publicação (ZIP)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Baixe todos os arquivos estáticos compilados prontos para subir em qualquer hospedagem própria (como <strong>Vercel</strong>, <strong>Netlify</strong>, <strong>cPanel</strong>, <strong>Hostinger</strong>, <strong>Cloudflare</strong> ou servidor <strong>Apache/Nginx</strong> da intranet do hospital).
            </p>
            <div className="pt-1">
              <button
                onClick={handleBaixarPacoteWeb}
                disabled={gerandoZip}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{gerandoZip ? 'Gerando Pacote ZIP...' : 'Baixar Pacote Web (.ZIP)'}</span>
              </button>
              {sucessoZip && (
                <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Download iniciado com sucesso!
                </p>
              )}
            </div>
          </div>

          {/* Card 3: Como hospedar no seu próprio endereço */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-600" />
              <span>Onde e como você pode publicar:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Vercel / Netlify (Grátis)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Arraste a pasta descompactada diretamente na aba de Deploy do Vercel ou Netlify. Seu app ganha um endereço próprio em menos de 1 minuto.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-purple-600" />
                  <span>Hospedagem Própria / cPanel</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Envie os arquivos para a pasta <code className="bg-white px-1 py-0.5 rounded border text-[10px]">public_html</code> do seu domínio (ex: plantoes.hospital.com.br). O arquivo <code className="bg-white px-1 py-0.5 rounded border text-[10px]">.htaccess</code> já está incluído.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-600" />
                  <span>Rede Local (Intranet)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Execute <code className="bg-white px-1 py-0.5 rounded border text-[10px]">npx serve -s . -l 3000</code> em qualquer computador servidor da rede para liberar o acesso aos outros terminais via IP local.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Banco de Dados em Nuvem</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  O banco Firebase Firestore provisionado continuará funcionando normalmente em qualquer endereço ou domínio que você escolher!
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 shrink-0">
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
