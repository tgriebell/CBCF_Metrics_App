const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
// const { autoUpdater } = require('electron-updater'); // Descomentar quando instalar

console.log('--- [ELECTRON] Iniciando script main.js ---');

let mainWindow;
let apiProcess;

// --- SIMULAÇÃO DE UPDATE (PARA DEV) ---
function simulateUpdateCycle(win) {
  if (!win) return;
  console.log('[DEV] Iniciando simulação de update...');

  // 1. Verificando...
  setTimeout(() => win.webContents.send('update-status', { status: 'checking', msg: 'Verificando atualizações...' }), 2000);

  // 2. Encontrado!
  setTimeout(() => win.webContents.send('update-status', { status: 'available', msg: 'Nova versão de inteligência encontrada (v2.0).' }), 4000);

  // 3. Baixando...
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      // 4. Concluído
      win.webContents.send('update-status', { status: 'downloaded', msg: 'Atualização pronta. Reiniciando...' });
      win.webContents.send('download-progress', 100);
    } else {
      win.webContents.send('download-progress', Math.round(progress));
    }
  }, 800);
}

// Configuração do Python
const PY_DIST_FOLDER = 'backend-dist';
const PY_FOLDER = '../backend';
const PY_MODULE = 'main';

const getScriptPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, PY_DIST_FOLDER, 'main.exe');
  }
  return path.join(__dirname, PY_FOLDER, PY_MODULE + '.py');
};

const createApiProcess = () => {
  const script = getScriptPath();
  console.log(`--- [ELECTRON] Tentando iniciar Python em: ${script}`);
  try {
    if (app.isPackaged) {
      apiProcess = spawn(script);
    } else {
      apiProcess = spawn('python', [script]);
    }
  } catch (e) {
    console.error('--- [ELECTRON] Erro fatal ao spawnar Python:', e);
  }
};

function createWindow() {
  console.log('--- [ELECTRON] Criando Janela...');
  
  const iconPath = path.join(__dirname, '../frontend/public/img/splash.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#020715',
    title: 'CBCF Metrics - Pro System',
    icon: iconPath,
    show: false, // Só mostra quando estiver pronta
    webPreferences: {
      nodeIntegration: false, // Segurança: ON
      contextIsolation: true, // Segurança: ON
      preload: path.join(__dirname, 'preload.js') // Ponte: ON
    },
  });

  // Carregamento
  if (!app.isPackaged) {
    console.log('--- [ELECTRON] Carregando URL de Desenvolvimento (Vite)...');
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:5173')
          .then(() => {
             console.log('--- [ELECTRON] URL carregada com sucesso!');
             mainWindow.show();
             // INICIA SIMULAÇÃO SE ESTIVER EM DEV
             simulateUpdateCycle(mainWindow); 
          })
          .catch(e => console.error('--- [ELECTRON] Erro ao carregar URL:', e));
    }, 2000);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
    mainWindow.show();
    // autoUpdater.checkForUpdatesAndNotify(); // Descomentar em PROD
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- IPC HANDLERS ---
ipcMain.on('restart-app', () => {
  // autoUpdater.quitAndInstall();
  console.log('[DEV] Restart solicitado pelo Frontend (Simulado)');
  app.relaunch();
  app.exit();
});

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});