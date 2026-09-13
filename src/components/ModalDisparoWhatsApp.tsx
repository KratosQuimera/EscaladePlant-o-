import React, { useState } from 'react';
import { 
  X, 
  MessageCircle, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  Calendar, 
  Building2, 
  User as UserIcon,
  Phone,
  Sparkles,
  Clock
} from 'lucide-react';
import { db } from '../services/db';
import { Escala, Setor, Cargo, Profissional, Turno } from '../types';

interface ModalDisparoWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  initialSetorId?: string;
  initialProfissionalId?: string;
}

export const ModalDisparoWhatsApp: React.FC<ModalDisparoWhatsAppProps> = ({
  isOpen,
  onClose,
  selectedDate,
  initialSetorId,
  initialProfissionalId,
}) => {
  const [modo, setModo] = useState<'DIA' | 'SETOR' | 'INDIVIDUAL'>('DIA');
  const [dataEnvio, setDataEnvio] = useState<string>(selectedDate);
  const [setorId, setSetorId] = useState<string>(initialSetorId || 'TODOS');
  const [profId, setProfId] = useState<string>(initialProfissionalId || '');
  const [incluirTelefone, setIncluirTelefone] = useState<boolean>(true);
  const [telefoneDestino, setTelefoneDestino] = useState<string>('');
  const [copiado, setCopiado] = useState<boolean>(false);

  if (!isOpen) return null;

  const setores = db.getSetores();
  const cargos = db.getCargos();
  const profissionais = db.getProfissionais();
  const todasEscalas = db.getEscalas();

  const getSetorNome = (id: string) => setores.find(s => s.id === id)?.nome || 'Geral';
  const getCargoNome = (id: string) => cargos.find(c => c.id === id)?.nome || 'Profissional';
  const getProfissional = (id: string) => profissionais.find(p => p.id === id);

  // Formatação do texto do WhatsApp com layout hospitalar claro
  const gerarMensagemWhatsApp = (): string => {
    const dataFormatada = dataEnvio.split('-').reverse().join('/');

    if (modo === 'DIA') {
      const escalasDoDia = todasEscalas.filter(e => e.data === dataEnvio);
      if (escalasDoDia.length === 0) {
        return `🏥 *HOSPITAL GERAL - ESCALA DE PLANTÃO*\n📅 *Data:* ${dataFormatada}\n\n⚠️ Nenhuma escala programada para esta data.`;
      }

      // Agrupar por setor
      const setoresNoDia = Array.from(new Set(escalasDoDia.map(e => e.setor_id)));
      let msg = `🏥 *ESCALA OFICIAL DE PLANTÃO HOSPITALAR*\n`;
      msg += `📅 *Data:* ${dataFormatada}\n`;
      msg += `⏰ *Gerado via:* Sistema de Gestão de Plantões\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      setoresNoDia.forEach(sId => {
        const sNome = getSetorNome(sId);
        const escalasSetor = escalasDoDia.filter(e => e.setor_id === sId);
        const diurnos = escalasSetor.filter(e => e.turno === 'DIURNO');
        const noturnos = escalasSetor.filter(e => e.turno === 'NOTURNO');

        msg += `📍 *SETOR: ${sNome.toUpperCase()}*\n`;

        if (diurnos.length > 0) {
          msg += `☀️ *Turno Diurno (07h às 19h):*\n`;
          diurnos.forEach(e => {
            const p = getProfissional(e.profissional_id);
            const cNome = getCargoNome(e.cargo_id);
            const tel = incluirTelefone && p?.telefone ? ` 📱 ${p.telefone}` : '';
            msg += `  • ${p?.nome_completo || 'Vago'} (${cNome})${tel}\n`;
          });
        }

        if (noturnos.length > 0) {
          msg += `🌙 *Turno Noturno (19h às 07h):*\n`;
          noturnos.forEach(e => {
            const p = getProfissional(e.profissional_id);
            const cNome = getCargoNome(e.cargo_id);
            const tel = incluirTelefone && p?.telefone ? ` 📱 ${p.telefone}` : '';
            msg += `  • ${p?.nome_completo || 'Vago'} (${cNome})${tel}\n`;
          });
        }

        msg += `\n`;
      });

      msg += `⚠️ *Avisos de Serviço:*\n`;
      msg += `• Chegar com 15 minutos de antecedência para passagem de plantão.\n`;
      msg += `• Trocas e permutas devem ser formalizadas previamente no sistema.\n`;
      return msg;
    }

    if (modo === 'SETOR') {
      const sNome = setorId === 'TODOS' ? 'Todos os Setores' : getSetorNome(setorId);
      const escalasSetor = todasEscalas.filter(e => {
        if (setorId !== 'TODOS' && e.setor_id !== setorId) return false;
        return e.data === dataEnvio;
      });

      let msg = `🏥 *ESCALA DE PLANTÃO - ${sNome.toUpperCase()}*\n`;
      msg += `📅 *Data:* ${dataFormatada}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (escalasSetor.length === 0) {
        msg += `Nenhum plantão registrado para este setor na data informada.\n`;
      } else {
        const diurnos = escalasSetor.filter(e => e.turno === 'DIURNO');
        const noturnos = escalasSetor.filter(e => e.turno === 'NOTURNO');

        if (diurnos.length > 0) {
          msg += `☀️ *DIURNO (07:00 - 19:00):*\n`;
          diurnos.forEach(e => {
            const p = getProfissional(e.profissional_id);
            const cNome = getCargoNome(e.cargo_id);
            const tel = incluirTelefone && p?.telefone ? ` 📱 ${p.telefone}` : '';
            msg += `  • ${p?.nome_completo || 'Vago'} (${cNome})${tel}\n`;
          });
          msg += `\n`;
        }

        if (noturnos.length > 0) {
          msg += `🌙 *NOTURNO (19:00 - 07:00):*\n`;
          noturnos.forEach(e => {
            const p = getProfissional(e.profissional_id);
            const cNome = getCargoNome(e.cargo_id);
            const tel = incluirTelefone && p?.telefone ? ` 📱 ${p.telefone}` : '';
            msg += `  • ${p?.nome_completo || 'Vago'} (${cNome})${tel}\n`;
          });
          msg += `\n`;
        }
      }

      msg += `Bom plantão a toda a equipe! 🩺`;
      return msg;
    }

    // Modo INDIVIDUAL
    const pAlvo = profissionais.find(p => p.id === profId) || profissionais[0];
    if (!pAlvo) return 'Nenhum profissional selecionado.';

    const mesAno = dataEnvio.substring(0, 7);
    const escalasDoProf = todasEscalas
      .filter(e => e.profissional_id === pAlvo.id && e.data.startsWith(mesAno))
      .sort((a, b) => a.data.localeCompare(b.data));

    let msg = `📋 *AGENDA INDIVIDUAL DE PLANTÕES*\n`;
    msg += `👨‍⚕️ *Profissional:* ${pAlvo.nome_completo} (Mat: ${pAlvo.matricula})\n`;
    msg += `🗓️ *Mês Referência:* ${mesAno.split('-').reverse().join('/')}\n`;
    msg += `🔢 *Total de Plantões Agendados:* ${escalasDoProf.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (escalasDoProf.length === 0) {
      msg += `Nenhum plantão agendado para este mês.\n`;
    } else {
      escalasDoProf.forEach((e, idx) => {
        const diaFormat = e.data.split('-').reverse().join('/');
        const icone = e.turno === 'DIURNO' ? '☀️' : '🌙';
        const sNome = getSetorNome(e.setor_id);
        msg += `${idx + 1}. ${diaFormat} (${e.turno}) ${icone}\n`;
        msg += `   📍 Posto: ${sNome} (${e.hora_inicio} às ${e.hora_fim})\n\n`;
      });
    }

    msg += `*Confirme sua ciência e presença no Portal do Colaborador.*`;
    return msg;
  };

  const textoWhatsApp = gerarMensagemWhatsApp();

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(textoWhatsApp).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const handleAbrirWhatsApp = () => {
    const encoded = encodeURIComponent(textoWhatsApp);
    let url = '';
    const limpo = telefoneDestino.replace(/\D/g, '');
    if (limpo.length >= 10) {
      const numCompleto = limpo.startsWith('55') ? limpo : `55${limpo}`;
      url = `https://api.whatsapp.com/send?phone=${numCompleto}&text=${encoded}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encoded}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Compartilhar e Disparar Escala via WhatsApp</h3>
              <p className="text-xs text-slate-500">Envio formatado e pronto para grupos hospitalares e colaboradores</p>
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
          {/* Seletor de Modo */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModo('DIA')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                modo === 'DIA' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Plantão do Dia</span>
            </button>
            <button
              type="button"
              onClick={() => setModo('SETOR')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                modo === 'SETOR' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Por Setor</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModo('INDIVIDUAL');
                if (!profId && profissionais.length > 0) setProfId(profissionais[0].id);
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                modo === 'INDIVIDUAL' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Agenda Individual</span>
            </button>
          </div>

          {/* Parâmetros do Envio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Data de Referência</label>
              <input
                type="date"
                value={dataEnvio}
                onChange={(e) => setDataEnvio(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {modo === 'SETOR' && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Setor Hospitalar</label>
                <select
                  value={setorId}
                  onChange={(e) => setSetorId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="TODOS">Todos os Setores</option>
                  {setores.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {modo === 'INDIVIDUAL' && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Profissional</label>
                <select
                  value={profId}
                  onChange={(e) => setProfId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {profissionais.map(p => (
                    <option key={p.id} value={p.id}>{p.nome_completo} ({p.matricula})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={incluirTelefone}
                  onChange={(e) => setIncluirTelefone(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Incluir telefones de contato dos profissionais</span>
              </label>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={telefoneDestino}
                  onChange={(e) => setTelefoneDestino(e.target.value)}
                  placeholder="DDD + Tel (ex: 11987654321) opcional"
                  className="p-1.5 text-xs bg-white border border-slate-300 rounded-lg w-full sm:w-56 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pré-visualização do Texto Formatado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Pré-visualização da Mensagem (WhatsApp)
              </span>
              <span className="text-[11px] text-slate-400">
                {textoWhatsApp.length} caracteres
              </span>
            </div>
            <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 overflow-x-auto max-h-56 whitespace-pre-wrap leading-relaxed shadow-inner">
              {textoWhatsApp}
            </pre>
          </div>

          {/* Ações de Disparo */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors order-3 sm:order-1"
            >
              Fechar
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={handleCopiarTexto}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copiar Mensagem</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAbrirWhatsApp}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                <span>Abrir no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
