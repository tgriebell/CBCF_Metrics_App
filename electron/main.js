const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
// const { autoUpdater } = require('electron-updater'); // Descomentar quando instalar

// Permite certificados auto-assinados (necessário para o Backend Python em HTTPS)
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
app.commandLine.appendSwitch('ignore-certificate-errors');

const PROTOCOL = 'cbcfmetrics';
let mainWindow;
let apiProcess;

// Configuração de Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Captura a URL do Deep Link (Windows)
      const url = commandLine.find(arg => arg.startsWith(PROTOCOL + '://'));
      if (url) {
        mainWindow.webContents.send('deep-link', url);
      }
    }
  });

  // Registra o esquema de protocolo
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  app.on('ready', () => {
    createApiProcess(); // Inicia o Backend Python
    createWindow();
  });
}

console.log('--- [ELECTRON] Iniciando script main.js ---');

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

    // --- DIAGNÓSTICO DE ERRO ---
    if (apiProcess) {
      apiProcess.stdout.on('data', (data) => {
        console.log(`[PYTHON OUT]: ${data}`);
      });

      apiProcess.stderr.on('data', (data) => {
        console.error(`[PYTHON ERR]: ${data}`);
        const msg = data.toString();
        // Se for um erro crítico, avisa o usuário
        if (msg.includes('Traceback') || msg.includes('Error') || msg.includes('ModuleTitNotFoundError')) {
             if (mainWindow) {
                 dialog.showErrorBox('Erro no Backend Python', msg);
             }
        }
      });
      
      apiProcess.on('close', (code) => {
          console.log(`[PYTHON] Processo encerrado com código: ${code}`);
      });
    }
  } catch (e) {
    console.error('--- [ELECTRON] Erro fatal ao spawnar Python:', e);
    dialog.showErrorBox('Falha Crítica', `Não foi possível iniciar o sistema: ${e.message}`);
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
    frame: false, // REMOVE A MOLDURA DO WINDOWS
    titleBarStyle: 'hidden', // Oculta a barra nativa, mas mantem area de drag
    show: false, // Só mostra quando estiver pronta
    webPreferences: {
      nodeIntegration: false, // Segurança: ON
      contextIsolation: true, // Segurança: ON
      preload: path.join(__dirname, 'preload.js') // Ponte: ON
    },
  });
  
  mainWindow.maximize(); // FORÇA INICIAR MAXIMIZADO

  // --- CONTROLES DE JANELA CUSTOMIZADOS ---
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window-close', () => mainWindow.close());

  // --- SISTEMA ---
  ipcMain.handle('get-app-version', () => app.getVersion());

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
ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.on('restart-app', () => {
  // autoUpdater.quitAndInstall();
  console.log('[DEV] Restart solicitado pelo Frontend (Simulado)');
  app.relaunch();
  app.exit();
});

// macOS Deep Link Handler
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('deep-link', url);
  }
});




app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});