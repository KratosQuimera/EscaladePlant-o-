/**
 * Serviço de registro e controle de PWA e Service Worker
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registrado com sucesso:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('Nova versão do aplicativo web disponível.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('Falha no registro do ServiceWorker:', error);
        });
    });
  }
}
