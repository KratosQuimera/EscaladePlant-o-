"""
SISTEMA DE GESTÃO E ESCALA DE PLANTÕES HOSPITALARES
Aplicação Desktop Executável Local
"""

import os
import sys
import threading
import time
import socket
import webbrowser
import subprocess
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer

# Determina o diretório base (suporta execução normal e congelada via PyInstaller)
if getattr(sys, 'frozen', False):
    BASE_DIR = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# O diretório de arquivos web pode ser 'dist', 'app' ou a própria pasta
def resolve_dist_dir():
    candidates = [
        os.path.join(BASE_DIR, 'dist'),
        os.path.join(BASE_DIR, 'app'),
        os.path.join(BASE_DIR, 'dist-desktop', 'app'),
        os.path.join(BASE_DIR, 'dist-desktop', 'dist'),
        BASE_DIR
    ]
    for c in candidates:
        if os.path.exists(os.path.join(c, 'index.html')):
            return c
    return BASE_DIR

DIST_DIR = resolve_dist_dir()

def find_free_port():
    """Encontra uma porta TCP livre no localhost"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

class QuietHandler(SimpleHTTPRequestHandler):
    """Handler HTTP customizado que serve a pasta dist silenciosamente"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def log_message(self, format, *args):
        # Silencia logs de requisição no terminal
        pass

    def end_headers(self):
        # Headers para funcionamento offline e segurança
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def start_server(port):
    """Inicia o servidor local em segundo plano"""
    TCPServer.allow_reuse_address = True
    with TCPServer(('127.0.0.1', port), QuietHandler) as httpd:
        httpd.serve_forever()

def open_window(url):
    """Abre o sistema em modo janela de aplicativo nativa (sem abas de browser)"""
    # 1. Tenta usar pywebview se estiver instalado (100% nativo com Edge WebView2)
    try:
        import webview
        webview.create_window(
            title='Sistema de Gestão e Escala de Plantões Hospitalares',
            url=url,
            width=1360,
            height=880,
            min_size=(1024, 700),
            confirm_close=True
        )
        webview.start()
        return
    except Exception:
        pass

    # 2. No Windows, tenta abrir no Edge ou Chrome em modo App (janela isolada)
    if sys.platform == 'win32':
        edge_paths = [
            os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
        ]
        for p in edge_paths:
            if os.path.exists(p):
                subprocess.Popen([p, f"--app={url}", "--window-size=1360,880"])
                return

        chrome_paths = [
            os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe")
        ]
        for p in chrome_paths:
            if os.path.exists(p):
                subprocess.Popen([p, f"--app={url}", "--window-size=1360,880"])
                return

    # 3. Fallback: abre no navegador padrão
    webbrowser.open(url)

def main():
    port = find_free_port()
    url = f"http://127.0.0.1:{port}"

    # Inicia servidor HTTP local em thread separada
    server_thread = threading.Thread(target=start_server, args=(port,), daemon=True)
    server_thread.start()

    # Dá um breve instante para o socket bind
    time.sleep(0.4)

    # Abre a interface gráfica nativa
    open_window(url)

if __name__ == '__main__':
    main()
