' Script para inicializar o Sistema de Gestao de Plantoes sem tela preta de console
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & WshShell.CurrentDirectory & "\INICIAR_SISTEMA.bat" & chr(34), 0
Set WshShell = Nothing
