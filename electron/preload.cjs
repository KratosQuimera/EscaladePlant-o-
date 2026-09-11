const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktopEnv', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0',
});
