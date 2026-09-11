const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, 'dist-desktop');

console.log('========================================================');
console.log('📦 GERADOR DO PACOTE EXECUTÁVEL - SISTEMA DE PLANTÕES');
console.log('========================================================');

if (!fs.existsSync(distDir)) {
  console.error('❌ Diretório dist/ não encontrado. Execute primeiro: npm run build');
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Copiar arquivos de dist para dist-desktop/app e dist-desktop/dist
const appDestDir = path.join(outDir, 'app');
if (fs.existsSync(appDestDir)) {
  fs.rmSync(appDestDir, { recursive: true, force: true });
}
fs.cpSync(distDir, appDestDir, { recursive: true });

const distDestDir = path.join(outDir, 'dist');
if (fs.existsSync(distDestDir)) {
  fs.rmSync(distDestDir, { recursive: true, force: true });
}
fs.cpSync(distDir, distDestDir, { recursive: true });
console.log('✓ Arquivos da aplicação copiados para dist-desktop/app e dist-desktop/dist');

// Copiar scripts Python auxiliares para o pacote
const pythonFiles = ['app.py', 'build_exe.py', 'gerar_executavel.bat'];
for (const file of pythonFiles) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, file));
  }
}
console.log('✓ Scripts Python e .BAT copiados para dist-desktop');

// 2. Criar INICIAR_SISTEMA.bat (Launcher para Windows com Edge/Chrome em modo App sem barra de navegação)
const batContent = `@echo off
chcp 65001 >nul
title Sistema de Gestao de Plantoes Hospitalares
echo ==========================================================
echo  INICIANDO SISTEMA DE GESTAO DE PLANTOES HOSPITALARES
echo ==========================================================
echo.
set "CURRENT_DIR=%~dp0"
set "APP_FILE=%CURRENT_DIR%app\\index.html"

:: 1. Tenta abrir no Microsoft Edge em modo janela de aplicativo (App Mode)
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo Iniciando no Microsoft Edge Desktop App...
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_FILE%" --window-size=1360,880
    exit
)
if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo Iniciando no Microsoft Edge Desktop App...
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_FILE%" --window-size=1360,880
    exit
)

:: 2. Tenta abrir no Google Chrome em modo janela de aplicativo
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    echo Iniciando no Google Chrome Desktop App...
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_FILE%" --window-size=1360,880
    exit
)
if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    echo Iniciando no Google Chrome Desktop App...
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_FILE%" --window-size=1360,880
    exit
)

:: 3. Se nao encontrar os executaveis padrao, abre no navegador padrao do Windows
echo Abrindo no navegador padrao do sistema...
start "" "%APP_FILE%"
exit
`;
fs.writeFileSync(path.join(outDir, 'INICIAR_SISTEMA.bat'), batContent, 'utf-8');
console.log('✓ Gerado INICIAR_SISTEMA.bat (Launcher Windows executável)');

// 3. Criar INICIAR_SILENCIOSO.vbs (inicia o sistema sem mostrar tela preta de terminal)
const vbsContent = `' Script para inicializar o Sistema de Gestao de Plantoes sem tela preta de console
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & WshShell.CurrentDirectory & "\\INICIAR_SISTEMA.bat" & chr(34), 0
Set WshShell = Nothing
`;
fs.writeFileSync(path.join(outDir, 'INICIAR_SILENCIOSO.vbs'), vbsContent, 'utf-8');
console.log('✓ Gerado INICIAR_SILENCIOSO.vbs (Inicializador sem tela preta)');

// 4. Criar CRIAR_ATALHO_AREA_DE_TRABALHO.bat
const shortcutContent = `@echo off
chcp 65001 >nul
echo Criando atalho na Area de Trabalho do Windows...
set "TARGET=%~dp0INICIAR_SILENCIOSO.vbs"
set "SHORTCUT=%USERPROFILE%\\Desktop\\Gestao de Plantoes.lnk"
set "SCRIPT=%TEMP%\\cria_atalho_%RANDOM%.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") >> "%SCRIPT%"
echo sLinkFile = "%SHORTCUT%" >> "%SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT%"
echo oLink.TargetPath = "%TARGET%" >> "%SCRIPT%"
echo oLink.WorkingDirectory = "%~dp0" >> "%SCRIPT%"
echo oLink.Description = "Sistema de Gestao e Escala de Plantoes Hospitalares" >> "%SCRIPT%"
echo oLink.Save >> "%SCRIPT%"

cscript /nologo "%SCRIPT%"
del "%SCRIPT%"
echo.
echo [SUCESSO] Atalho criado na sua Area de Trabalho!
echo Voce pode dar um duplo clique nele para abrir o sistema a qualquer momento.
pause
`;
fs.writeFileSync(path.join(outDir, 'CRIAR_ATALHO_AREA_DE_TRABALHO.bat'), shortcutContent, 'utf-8');
console.log('✓ Gerado CRIAR_ATALHO_AREA_DE_TRABALHO.bat');

// 5. Criar LEIA-ME_COMO_USAR.txt
const readmeContent = `========================================================================
SISTEMA DE GESTÃO E ESCALA DE PLANTÕES HOSPITALARES - VERSÃO EXECUTÁVEL
========================================================================

Este pacote contém a versão pronta para uso local e offline do sistema.

COMO EXECUTAR NO WINDOWS:
1. Dê um duplo clique em "INICIAR_SISTEMA.bat" (ou "INICIAR_SILENCIOSO.vbs").
2. O sistema abrirá automaticamente em modo de aplicativo desktop (janela própria
   sem abas ou barras de pesquisa, idêntico a um programa .EXE nativo).
3. Para colocar um atalho na sua Área de Trabalho, execute:
   "CRIAR_ATALHO_AREA_DE_TRABALHO.bat".

OPÇÃO NATIVA ELECTRON (.EXE):
Se você tiver o Node.js instalado na máquina de desenvolvimento e quiser abrir
diretamente via Electron Desktop, execute na pasta do projeto:
   npm run electron:start

SEGURANÇA & DADOS:
- Todos os dados ficam salvos localmente e com segurança no computador.
- Para realizar backup ou restauração de dados, acesse o menu lateral "Backup & Dados".

CREDENCIAIS INICIAIS:
- Administrador: login 'admin' | senha 'esc@l@'
- Usuário Padrão: login 'padrao' | senha 'esc@l@'
========================================================================
`;
fs.writeFileSync(path.join(outDir, 'LEIA-ME_COMO_USAR.txt'), readmeContent, 'utf-8');
console.log('✓ Gerado LEIA-ME_COMO_USAR.txt');

console.log('========================================================');
console.log('✨ Pacote executável gerado com sucesso em: dist-desktop/');
console.log('========================================================');
