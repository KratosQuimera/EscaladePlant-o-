@echo off
chcp 65001 >nul
title Sistema de Gestao de Plantoes Hospitalares
echo ==========================================================
echo  INICIANDO SISTEMA DE GESTAO DE PLANTOES HOSPITALARES
echo ==========================================================
echo.
set "CURRENT_DIR=%~dp0"
set "APP_FILE=%CURRENT_DIR%app\index.html"

:: 1. Tenta abrir no Microsoft Edge em modo janela de aplicativo (App Mode)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    echo Iniciando no Microsoft Edge Desktop App...
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP_FILE%" --window-size=1360,880
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    echo Iniciando no Microsoft Edge Desktop App...
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APP_FILE%" --window-size=1360,880
    exit
)

:: 2. Tenta abrir no Google Chrome em modo janela de aplicativo
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    echo Iniciando no Google Chrome Desktop App...
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP_FILE%" --window-size=1360,880
    exit
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    echo Iniciando no Google Chrome Desktop App...
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%APP_FILE%" --window-size=1360,880
    exit
)

:: 3. Se nao encontrar os executaveis padrao, abre no navegador padrao do Windows
echo Abrindo no navegador padrao do sistema...
start "" "%APP_FILE%"
exit
