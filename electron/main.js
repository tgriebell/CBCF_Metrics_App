const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

console.log('--- [ELECTRON] Iniciando script main.js ---');

let mainWindow;
let apiProcess;

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
      // Tenta 'python' primeiro, se falhar o usuário pode precisar de 'python3'
      apiProcess = spawn('python', [script]);
    }

    if (apiProcess) {
      console.log('--- [ELECTRON] Processo Python criado com PID:', apiProcess.pid);
      
      apiProcess.stdout.on('data', (data) => {
        console.log(`[PYTHON LOG]: ${data}`);
      });
      
      apiProcess.stderr.on('data', (data) => {
        console.error(`[PYTHON ERRO]: ${data}`);
      });

      apiProcess.on('error', (err) => {
        console.error('--- [ELECTRON] Falha ao iniciar Python:', err);
      });
    }
  } catch (e) {
    console.error('--- [ELECTRON] Erro fatal ao spawnar Python:', e);
  }
};

function createWindow() {
  console.log('--- [ELECTRON] Criando Janela...');
  
  // Caminho do ícone
  const iconPath = path.join(__dirname, '../frontend/public/img/splash.png');
  console.log('--- [ELECTRON] Ícone procurado em:', iconPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#020715',
    title: 'CBCF Metrics - Debug Mode',
    icon: iconPath, // Se não achar o ícone, ele usa o padrão sem travar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Carregamento
  if (!app.isPackaged) {
    console.log('--- [ELECTRON] Carregando URL de Desenvolvimento (Vite)...');
    // Pequeno delay para garantir que o Vite subiu
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:5173')
          .then(() => console.log('--- [ELECTRON] URL carregada com sucesso!'))
          .catch(e => console.error('--- [ELECTRON] Erro ao carregar URL:', e));
    }, 2000);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  console.log('--- [ELECTRON] Evento READY disparado');
  // createApiProcess(); // Desabilitado para permitir inicialização manual do backend
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (apiProcess) {
    apiProcess.kill();
  }
});