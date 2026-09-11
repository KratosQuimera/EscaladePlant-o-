@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title Gerador de Executavel - Sistema de Escala

echo ======================================================================
echo    GERADOR DE EXECUTAVEL (.EXE) - SISTEMA DE ESCALAS
echo ======================================================================
echo.

REM 1. Localizar executável do Python (tenta "python" depois "py")
set PYTHON_CMD=
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PYTHON_CMD=python
) else (
    py --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set PYTHON_CMD=py
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERRO CRITICO] O Python nao foi detectado no seu computador!
    echo.
    echo Por favor, siga estes passos:
    echo 1. Baixe o instalador do Python em: https://www.python.org/downloads/
    echo 2. Execute o instalador baixado.
    echo 3. IMPORTANTE: Marque a caixinha "Add Python to PATH" na primeira tela!
    echo 4. Conclua a instalacao e tente executar este arquivo novamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Python detectado:
%PYTHON_CMD% --version
echo.

REM 2. Executar diretamente o compilador em Python para garantir compatibilidade total
echo [INFO] Iniciando processo de compilacao...
%PYTHON_CMD% build_exe.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] A compilacao nao pode ser concluida. Verifique as mensagens acima.
    pause
    exit /b 1
)

echo.
echo [SUCESSO] Operacao finalizada com exito!
echo.
echo ======================================================================
echo  EXECUTAVEL OFICIAL GERADO COM SUCESSO:
echo  Pasta: dist\SistemaPlantoes\
echo  Arquivo: dist\SistemaPlantoes\SistemaPlantoes.exe
echo.
echo  Atalho na pasta raiz: ABRIR_SISTEMA_PLANTOES.bat
echo.
echo  IMPORTANTE: Nunca execute arquivos da pasta "build" (que e temporaria).
echo  Utilize sempre o arquivo dentro da pasta "dist\SistemaPlantoes\"!
echo ======================================================================
echo.
pause
exit /b 0
