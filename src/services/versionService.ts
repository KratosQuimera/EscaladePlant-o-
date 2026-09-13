// Serviço de Controle e Contador de Versão da Aplicação
// Versão Inicial Mandatória: V12.0

export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
  buildNumber: number;
  releaseDate: string;
  changelog: {
    version: string;
    date: string;
    description: string;
    tipo: 'MAJOR' | 'MINOR' | 'PATCH';
  }[];
}

const STORAGE_KEY = 'sistema_plantoes_version_info';

const INITIAL_VERSION_STATE: VersionInfo = {
  version: 'V12.0',
  major: 12,
  minor: 0,
  patch: 0,
  buildNumber: 120,
  releaseDate: '2026-09-10',
  changelog: [
    {
      version: 'V12.0',
      date: '2026-09-10',
      description: 'Lançamento da versão V12.0 com interface otimizada, remoção de menus legados e estabilização operacional.',
      tipo: 'MAJOR'
    }
  ]
};

export const getVersionInfo = (): VersionInfo => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_VERSION_STATE));
      return INITIAL_VERSION_STATE;
    }
    const parsed = JSON.parse(raw);
    // Garante que a versão comece ao menos em V12.0
    if (parsed.major < 12) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_VERSION_STATE));
      return INITIAL_VERSION_STATE;
    }
    return parsed;
  } catch {
    return INITIAL_VERSION_STATE;
  }
};

export const incrementVersion = (tipo: 'MINOR' | 'PATCH' | 'MAJOR', nota?: string): VersionInfo => {
  const current = getVersionInfo();
  let newMajor = current.major;
  let newMinor = current.minor;
  let newPatch = current.patch;

  if (tipo === 'MAJOR') {
    newMajor += 1;
    newMinor = 0;
    newPatch = 0;
  } else if (tipo === 'MINOR') {
    newMinor += 1;
    newPatch = 0;
  } else {
    newPatch += 1;
  }

  const newVersionStr = `V${newMajor}.${newMinor}${newPatch > 0 ? `.${newPatch}` : ''}`;
  const now = new Date().toISOString().split('T')[0];

  const updated: VersionInfo = {
    version: newVersionStr,
    major: newMajor,
    minor: newMinor,
    patch: newPatch,
    buildNumber: current.buildNumber + 1,
    releaseDate: now,
    changelog: [
      {
        version: newVersionStr,
        date: now,
        description: nota || `Atualização de versão para ${newVersionStr}`,
        tipo
      },
      ...current.changelog
    ]
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Atualiza o título da janela se disponível
    if (typeof document !== 'undefined') {
      document.title = `Sistema de Gestão e Escala de Plantões Hospitalares - ${newVersionStr}`;
    }
  } catch (e) {
    console.error('Falha ao persistir nova versão', e);
  }

  return updated;
};

export const resetVersionToInitial = (): VersionInfo => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_VERSION_STATE));
  if (typeof document !== 'undefined') {
    document.title = `Sistema de Gestão e Escala de Plantões Hospitalares - ${INITIAL_VERSION_STATE.version}`;
  }
  return INITIAL_VERSION_STATE;
};
