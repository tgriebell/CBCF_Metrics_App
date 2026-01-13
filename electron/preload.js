const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Ouve mensagens do Processo Principal (Main)
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
  
  // Envia mensagens para o Processo Principal
  checkUpdate: () => ipcRenderer.send('check-for-update'),
  restartApp: () => ipcRenderer.send('restart-app')
});