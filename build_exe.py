"""
SCRIPT DE COMPILAÇÃO AUTOMÁTICA EM EXECUTÁVEL (.EXE)
Sistema de Gestão e Escala de Plantões Hospitalares
"""

import os
import sys
import subprocess
import shutil

def print_step(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def check_and_install_dependencies():
    """Verifica e instala PyInstaller e pywebview automaticamente se necessário"""
    print_step("[1/4] Verificando dependências Python (PyInstaller / pywebview)")
    
    needed = []
    try:
        import PyInstaller
        print(" [OK] PyInstaller já está instalado.")
    except ImportError:
        needed.append("pyinstaller")

    try:
        import webview
        print(" [OK] pywebview já está instalado.")
    except ImportError:
        needed.append("pywebview")

    if needed:
        print(f" [INFO] Instalando dependências necessárias: {', '.join(needed)}...")
        try:
            cmd = [sys.executable, "-m", "pip", "install", "--upgrade"] + needed
            subprocess.check_call(cmd)
            print(" [OK] Todas as dependências foram instaladas com sucesso!")
        except Exception as e:
            print(f" [AVISO] Falha ao instalar via pip: {e}")
            print(" Continuando com as ferramentas disponíveis...")

def check_and_build_frontend():
    """Garante que a pasta dist/ contendo os arquivos web esteja compilada"""
    print_step("[2/4] Verificando arquivos web da aplicação")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_path = os.path.join(base_dir, "dist")
    
    # 1. Procura em locais alternativos caso o usuário tenha executado a partir de outra pasta
    candidates = [
        dist_path,
        os.path.join(base_dir, "app"),
        os.path.join(base_dir, "dist-desktop", "app"),
        os.path.join(base_dir, "dist-desktop", "dist"),
        os.path.join(base_dir, "dist-desktop"),
    ]

    for candidate in candidates:
        candidate_index = os.path.join(candidate, "index.html")
        if os.path.exists(candidate_index):
            print(f" [OK] Arquivos web encontrados em: {os.path.relpath(candidate, base_dir)}/")
            if candidate != dist_path:
                try:
                    if os.path.exists(dist_path):
                        shutil.rmtree(dist_path)
                    shutil.copytree(candidate, dist_path)
                    print(" [OK] Sincronizado para pasta dist/ para compilação.")
                except Exception as e:
                    print(f" [AVISO] Não foi possível copiar para dist/: {e}")
            return True

    print(" [INFO] Arquivos pré-compilados não encontrados. Verificando ambiente Node.js...")
    npm_cmd = shutil.which("npm") or shutil.which("npm.cmd")
    
    if npm_cmd:
        # Se npm existe, verifica se 'vite' está instalado na pasta node_modules
        node_modules_vite = os.path.join(base_dir, "node_modules", "vite")
        vite_bin = os.path.join(base_dir, "node_modules", ".bin", "vite.cmd" if sys.platform == "win32" else "vite")
        
        if not os.path.exists(node_modules_vite) and not os.path.exists(vite_bin):
            print(" [INFO] 'vite' não detectado em node_modules. Instalando dependências (npm install)...")
            try:
                subprocess.check_call([npm_cmd, "install", "--no-audit", "--no-fund"], shell=(sys.platform == "win32"))
                print(" [OK] Dependências instaladas com sucesso!")
            except Exception as install_err:
                print(f" [AVISO] Falha ao executar npm install: {install_err}")

        print(" [INFO] Executando 'npm run build'...")
        try:
            subprocess.check_call([npm_cmd, "run", "build"], shell=(sys.platform == "win32"))
            if os.path.exists(os.path.join(dist_path, "index.html")):
                print(" [OK] Frontend compilado com sucesso em dist/!")
                return True
        except Exception as err:
            print(f" [ERRO] Erro ao executar npm run build: {err}")

    # Fallback de emergência caso não tenha dist nem Node.js
    print(" [AVISO] Criando estrutura básica em dist/ a partir dos arquivos disponíveis...")
    try:
        os.makedirs(dist_path, exist_ok=True)
        root_index = os.path.join(base_dir, "index.html")
        if os.path.exists(root_index) and not os.path.exists(os.path.join(dist_path, "index.html")):
            shutil.copy(root_index, os.path.join(dist_path, "index.html"))
            print(" [OK] Arquivo index.html copiado para dist/.")
            return True
    except Exception as copy_err:
        print(f" [ERRO] Falha no fallback: {copy_err}")
    
    print(" [ERRO] Não foi possível encontrar ou compilar os arquivos de dist/.")
    print(" DICA: Baixe o pacote pré-compilado diretamente pelo menu 'App Executável (.EXE)' no sistema web.")
    return False

def compile_executable():
    """Executa o PyInstaller para gerar o executável nativo"""
    print_step("[3/4] Compilando executável com PyInstaller")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    app_py = os.path.join(base_dir, "app.py")
    dist_dir = os.path.join(base_dir, "dist")

    # Separador de dados do PyInstaller: ';' no Windows, ':' no Linux/macOS
    separator = ";" if sys.platform == "win32" else ":"
    data_param = f"{dist_dir}{separator}dist"

    # Argumentos do PyInstaller
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",              # Limpa cache temporário antes de compilar
        "--onedir",             # Modo pasta única para carregamento ultra-rápido
        "--windowed",           # Sem tela preta de terminal no Windows
        "--name", "SistemaPlantoes",
        f"--add-data={data_param}",
        app_py
    ]

    print(f" [INFO] Executando: {' '.join(cmd)}")
    try:
        subprocess.check_call(cmd)
        print(" [OK] Compilação do PyInstaller concluída com sucesso!")
        return True
    except Exception as e:
        print(f" [ERRO] Falha na compilação do PyInstaller: {e}")
        return False

def finalize_package():
    """Organiza a pasta final com scripts de inicialização convenientes e limpa pastas temporárias"""
    print_step("[4/4] Finalizando pacote de distribuição e limpeza")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_app = os.path.join(base_dir, "dist", "SistemaPlantoes")
    build_dir = os.path.join(base_dir, "build")
    exe_path = os.path.join(dist_app, "SistemaPlantoes.exe" if sys.platform == "win32" else "SistemaPlantoes")

    # 1. Remove a pasta 'build/' temporária do PyInstaller
    # Isso é fundamental para evitar que o usuário tente abrir o arquivo não-funcional de 'build/'
    if os.path.exists(build_dir):
        print(" [INFO] Removendo pasta temporária 'build/' para evitar confusão de arquivos...")
        try:
            shutil.rmtree(build_dir, ignore_errors=True)
            print(" [OK] Pasta temporária 'build/' removida com sucesso!")
        except Exception as err:
            print(f" [AVISO] Não foi possível remover pasta build: {err}")

    # 2. Cria um inicializador direto na raiz do projeto: ABRIR_SISTEMA_PLANTOES.bat
    launcher_path = os.path.join(base_dir, "ABRIR_SISTEMA_PLANTOES.bat")
    try:
        with open(launcher_path, "w", encoding="utf-8") as f:
            f.write("@echo off\n")
            f.write("chcp 65001 > nul\n")
            f.write('echo Iniciando Sistema de Gestão de Plantões...\n')
            f.write('start "" "%~dp0dist\\SistemaPlantoes\\SistemaPlantoes.exe"\n')
            f.write("exit\n")
        print(" [OK] Criado atalho raiz: ABRIR_SISTEMA_PLANTOES.bat")
    except Exception as e:
        print(f" [AVISO] Falha ao criar atalho raiz: {e}")

    # 3. Exibir instruções e abrir o Windows Explorer na pasta correta
    if os.path.exists(exe_path) or os.path.exists(dist_app):
        print(f"\n✨ SUCESSO! O EXECUTÁVEL FOI GERADO COM SUCESSO!")
        print(f" Pasta oficial: dist/SistemaPlantoes/")
        if sys.platform == "win32":
            print(f" Executável correto: dist\\SistemaPlantoes\\SistemaPlantoes.exe")
            print(" ATENÇÃO: Nunca execute arquivos da pasta 'build' (que é temporária).")
            print("          Use sempre o executável dentro de 'dist\\SistemaPlantoes\\'.")
            
            # Abre o Windows Explorer e já seleciona o executável correto
            try:
                print(" [INFO] Abrindo o Windows Explorer no executável oficial...")
                subprocess.Popen(f'explorer.exe /select,"{exe_path}"')
            except Exception:
                pass
        print("\n Você pode copiar a pasta 'SistemaPlantoes' inteira para qualquer computador Windows.")
        print(" Não é necessário instalar Python ou Node.js nas máquinas dos usuários finais!")
    else:
        print(" [AVISO] Verifique a pasta 'dist/' para localizar os binários compilados.")

def main():
    print("\n" + "=" * 70)
    print("   GERADOR DE EXECUTÁVEL (.EXE) - SISTEMA DE ESCALA E PLANTÕES")
    print("=" * 70)

    check_and_install_dependencies()
    
    if not check_and_build_frontend():
        print("\n [ERRO CRÍTICO] Abortando compilação por falta dos arquivos web em dist/.")
        sys.exit(1)

    success = compile_executable()
    if success:
        finalize_package()
        print("\n" + "=" * 70)
        print("  PROCESSO CONCLUÍDO COM SUCESSO!")
        print("=" * 70 + "\n")
    else:
        print("\n" + "=" * 70)
        print("  OCORREU UM ERRO DURANTE A COMPILAÇÃO.")
        print("=" * 70 + "\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
