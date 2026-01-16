const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Ouve mensagens do Processo Principal (Main)
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
  onDeepLink: (callback) => ipcRenderer.on('deep-link', (event, url) => callback(url)),
  
  // Envia mensagens para o Processo Principal
  checkUpdate: () => ipcRenderer.send('check-for-update'),
  restartApp: () => ipcRenderer.send('restart-app'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  
  // Controles de Janela Customizados
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
});