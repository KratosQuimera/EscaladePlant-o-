@echo off
chcp 65001 >nul
echo Criando atalho na Area de Trabalho do Windows...
set "TARGET=%~dp0INICIAR_SILENCIOSO.vbs"
set "SHORTCUT=%USERPROFILE%\Desktop\Gestao de Plantoes.lnk"
set "SCRIPT=%TEMP%\cria_atalho_%RANDOM%.vbs"

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
