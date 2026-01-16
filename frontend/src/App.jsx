import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { verses } from './verses.js';
import BibliotecaView from './components/BibliotecaView.jsx';
import PadroesView from './components/PadroesView.jsx';
import AIChatView from './components/AIChatView.jsx';
import DataAnalyticsModal from './components/DataAnalyticsModal.jsx'; // NOVO COMPONENTE DE INTELIGÊNCIA
import YouTubeDeepDive from './components/YouTubeDeepDive.jsx';
import TikTokDeepDive from './components/TikTokDeepDive.jsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Link,
  BrainCircuit,
  Bot,
  Sparkles,
  BookOpen,
  Diamond,
  Zap,
  Activity,
  ArrowRight,
  Target,
  RefreshCw,
  Clipboard,
  X,
  Save, // Novo ícone
  User, // Adicionado
  Lock, // Adicionado
  Youtube, // Adicionado
  Instagram, // Adicionado
  ThumbsDown, // Adicionado
  UserPlus, // Adicionado
  Eye, // Adicionado
  MessageSquare, // Adicionado
  MessageCircle, // Adicionado
  ThumbsUp, // Adicionado
  FileText, // Adicionado
  Heart, // Adicionado
  Share2, // Adicionado
  Edit, // Adicionado
  MoreHorizontal, // Adicionado
  Video, // Adicionado
  Minus, // TitleBar
  Square // TitleBar
} from 'lucide-react';

// --- BARRA DE TÍTULO CUSTOMIZADA (FRAMELESS) ---
const TitleBar = () => (
  <div className="h-8 flex items-center justify-between px-3 bg-[#020715] border-b border-white/5 select-none fixed top-0 left-0 right-0 z-[9999]" style={{ WebkitAppRegion: 'drag' }}>
    <div className="flex items-center gap-2 pl-1">
      <div className="w-2 h-2 rounded-full bg-[#3bf5a5] shadow-[0_0_8px_#3bf5a5]"></div>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">CBCF System v1.1.3</span>
    </div>
    <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
      <button onClick={() => window.electron?.minimize()} className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"><Minus size={10} /></button>
      <button onClick={() => window.electron?.maximize()} className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"><Square size={8} /></button>
      <button onClick={() => window.electron?.close()} className="p-1.5 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors"><X size={10} /></button>
    </div>
  </div>
);

// --- CONFIGURAÇÃO DE CORES (REGRAS FINAIS) ---
const colors = {
  bg: '#0D1117',
  bgDark: '#050814',
  primary: '#3bf5a5', 
  secondary: '#19e6ff',
  
  // Cores das Plataformas
  tiktok: '#ffffff',    // Branco
  youtube: '#ff0000',   // Vermelho (Longo)
  shorts: '#19e6ff',    // Azul (Shorts)
  instagram: '#E1306C', // Rosa
};

// --- ESTILOS CSS ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    @keyframes pulse-sparkle { 0%, 100% { filter: drop-shadow(0 0 5px var(--neon-blue)); } 50% { filter: drop-shadow(0 0 15px var(--neon-blue)); } }
    @keyframes pulse-ai-glow { 0%, 100% { box-shadow: 0 0 40px rgba(25, 230, 255, 0.15), 0 0 10px rgba(25, 230, 255, 0.1) inset; } 50% { box-shadow: 0 0 65px rgba(25, 230, 255, 0.25), 0 0 15px rgba(25, 230, 255, 0.15) inset; } }

    .ai-modal-card {
      background: radial-gradient(circle at 50% 50%, rgba(5, 15, 28, 0.9) 0%, rgba(3, 8, 16, 0.95) 100%);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(25, 230, 255, 0.2);
      box-shadow: 0 0 40px rgba(25, 230, 255, 0.15), 0 0 10px rgba(25, 230, 255, 0.1) inset;
      animation: pulse-ai-glow 7s ease-in-out infinite;
      position: relative;
      overflow: hidden;
    }

    .neon-divider {
      height: 1px;
      width: 50%;
      background: var(--neon-blue);
      margin: 10px auto;
      filter: blur(1.5px);
    }

    .ai-textarea {
      background-color: #050A0D;
      border: 1px solid rgba(25, 230, 255, 0.3);
      box-shadow: inset 0 0 10px rgba(25, 230, 255, 0.1);
      transition: all 0.3s;
    }
    .ai-textarea:focus {
      outline: none;
      border-color: rgba(25, 230, 255, 0.7);
      box-shadow: inset 0 0 15px rgba(25, 230, 255, 0.2), 0 0 10px rgba(25, 230, 255, 0.1);
    }

    .ai-modal-grid {
      position: absolute; inset: 0;
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(25, 230, 255, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(25, 230, 255, 0.05) 1px, transparent 1px);
      mask-image: radial-gradient(circle at top center, black 10%, transparent 80%);
      pointer-events: none;
      opacity: 0.5;
    }

    @keyframes pulsing-dots {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 1; }
    }

    .loader-dots div {
      animation-name: pulsing-dots;
      animation-duration: 1.4s;
      animation-iteration-count: infinite;
      animation-fill-mode: both;
    }

    .loader-dots div:nth-child(2) {
      animation-delay: 0.2s;
    }

    .loader-dots div:nth-child(3) {
      animation-delay: 0.4s;
    }

    .ai-result-card {
      background: rgba(5, 12, 25, 0.5);
      border: 1px solid rgba(25, 230, 255, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.5rem;
    }

    .ai-result-card h3 {
      font-size: 0.8rem;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--neon-blue);
      margin-bottom: 1rem;
    }

    @font-face {
      font-family: 'Helvetica Bold';
      src: url('./fonts/helvetica-bold.otf') format('opentype');
      font-weight: normal; /* TRUQUE: Define como normal para evitar "falso negrito" duplo do Windows */
      font-style: normal;
    }

    @font-face {
      font-family: 'Nexa Bold';
      src: url('./fonts/nexa-bold.otf') format('opentype');
      font-weight: normal; /* TRUQUE: O arquivo já é bold, então tratamos como normal */
      font-style: normal;
    }

    :root {
      --neon-green: #3bf5a5;
      --neon-blue: #19e6ff;
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-bg: rgba(5, 8, 20, 0.85);
      
      /* Fontes Locais */
      --font-primary: "Helvetica Bold", "Helvetica", sans-serif;
      --font-tech: 'Inter', sans-serif; /* Substituição Global para corrigir alinhamento */
    }

    body {
      font-family: var(--font-tech);
      background-color: ${colors.bg};
      margin: 0;
      color: #e5f0ff; 
      overflow: hidden;
      
      /* Correção de Renderização de Fonte (Anti-Blur) */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      font-feature-settings: "kern" 1; /* Melhora o espaçamento entre letras */
    }

    h1, h2, h3, .font-title {
      font-family: var(--font-primary) !important;
      font-weight: normal; /* Usa o peso natural do arquivo (que já é bold) */
      letter-spacing: -0.02em; 
    }
    
    /* Garante que spans dentro de títulos usem a fonte do título (Helvetica) e não a Nexa */
    h1 span, h2 span, h3 span {
        font-family: inherit !important;
    }

    /* Aplica Nexa como padrão para o corpo, botões e textos gerais */
    body, h4, h5, h6, button, label, span, p, div {
      font-family: var(--font-tech);
    }

    /* CORREÇÃO DE ALINHAMENTO: Força Helvetica (mais estável) para inputs, tabelas e dados numéricos */
    input, textarea, select, table, tr, td, th {
      font-family: var(--font-primary) !important; 
      font-weight: normal; /* Evita duplo negrito */
    }
    
    /* Grid Cibernético */
    .cyber-grid {
      position: absolute; inset: 0;
      background-size: 50px 50px;
      background-image: 
        linear-gradient(to right, rgba(25, 230, 255, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(25, 230, 255, 0.05) 1px, transparent 1px);
      mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
      pointer-events: none; z-index: 0;
      opacity: 0.2; /* Adjusted from 0.40 to 0.45 */
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #263151; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--neon-green); }

    /* Animações */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulseSlow { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.25; transform: scale(1.1); } }
    @keyframes floatCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }

    .animate-enter { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-float-card { animation: floatCard 6s ease-in-out infinite; }
    .animate-breathe-subtle { animation: pulseSlow 8s ease-in-out infinite; }

    .glass-panel {
      background-color: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(59, 245, 165, 0.2);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 30px rgba(59, 245, 165, 0.15);
    }

    /* Inputs & Botões */
    .btn-neon {
      background: linear-gradient(90deg, rgba(59, 245, 165, 0.1), rgba(59, 245, 165, 0.05));
      border: 1px solid rgba(59, 245, 165, 0.3);
      color: #fff; transition: all 0.3s; position: relative; overflow: hidden;
    }
    .btn-neon:hover {
      border-color: var(--neon-green);
      box-shadow: 0 0 20px rgba(59, 245, 165, 0.25);
      background: rgba(59, 245, 165, 0.15);
    }
    .btn-neon:disabled {
        pointer-events: none;
        background: rgba(59, 245, 165, 0.05);
        border-color: rgba(59, 245, 165, 0.1);
        color: rgba(255,255,255,0.3);
    }

    .btn-neon-glow {
      position: relative;
      border: 1.5px solid rgba(0, 255, 180, 0.35);
      background: rgba(0,0,0,0.25);
      color: rgba(0, 255, 200, 0.85);
      transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
      text-shadow: 0 0 8px rgba(0, 255, 200, 0.3);
      box-shadow: 0 0 12px rgba(0, 255, 180, 0.15), 0 0 32px rgba(0, 255, 180, 0.08);
    }
    .btn-neon-glow:hover {
      background: linear-gradient(180deg, #13FFB0 0%, #0CEBA0 100%);
      color: #0A0F14;
      text-shadow: none;
      box-shadow: 0 0 18px rgba(0, 255, 180, 0.25), 0 0 50px rgba(0, 255, 180, 0.12); /* Further reduced glow */
    }
    .btn-neon-glow:active {
      transform: translateY(1px);
      transition: all 100ms;
      background: #0CEBA0;
      box-shadow: 0 0 8px rgba(0, 255, 180, 0.15); /* Slightly reduced active shadow */
    }
    .btn-neon-glow:disabled {
      pointer-events: none;
      border-color: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.05);
      box-shadow: none;
      text-shadow: none;
    }

    .input-future {
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white; transition: all 0.3s;
    }
    .input-future:focus {
      outline: none; border-color: var(--neon-blue);
      box-shadow: 0 0 15px rgba(25, 230, 255, 0.1);
    }

    /* --- SPLASH STYLES --- */
    .splash-bg { background: radial-gradient(circle at 50% -10%, #163754 0, #020715 45%, #000 100%); }
    
    .splash-logo-card {
      background: linear-gradient(145deg, #0a1025 0%, #020612 100%);
      border: 1px solid rgba(59, 245, 165, 0.1);
      border-radius: 40px;
      padding: 24px; 
      box-shadow: 0 0 60px rgba(0,0,0,0.8), 0 0 40px rgba(59, 245, 165, 0.25);
      position: relative; overflow: hidden;
    }
    
    .splash-logo-frame {
      background-color: transparent;
      border-radius: 24px;
      padding: 50px 40px 60px; 
      display: flex; flex-direction: column; align-items: center;
      min-width: 360px; position: relative; z-index: 2;
    }

    .splash-loader-bar {
      width: 100%; height: 4px; 
      background: #111; 
      border-radius: 99px; overflow: hidden; position: relative;
      margin-top: 30px;
    }
    
.bar-inner {
      position: absolute; left: 0; top: 0; bottom: 0;
      background: #3bf5a5; 
      box-shadow: 0 0 15px #3bf5a5; 
      transition: width 0.2s ease-out;
    }

    /* TOOLTIP */
    .custom-tooltip {
      background: rgba(10, 16, 37, 0.95);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      backdrop-filter: blur(10px);
    }
    .tooltip-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
    .tooltip-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #fff; margin-bottom: 4px; }

    /* Hide native date picker icon */
    input[type="date"]::-webkit-calendar-picker-indicator {
        background: transparent;
        bottom: 0;
        color: transparent;
        cursor: pointer;
        height: auto;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        width: auto;
        z-index: 10; /* Make the invisible picker cover the custom icon so clicks trigger it */
    }
  `}</style>
);

// --- COMPONENTES AUXILIARES ---

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="tooltip-item">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.fill || entry.stroke, boxShadow: `0 0 8px ${entry.stroke || entry.fill}` }}></div>
            <span style={{opacity: 0.8}}>{entry.name}:</span>
            <span style={{fontWeight: 'bold'}}>{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Splash Screen (Inteligente com Atualização OTA)
const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Inicializando Sistema");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Verifica se estamos no Electron (via Preload)
    if (window.electron) {
      console.log("--- [SPLASH] Modo Electron Detectado ---");
      
      // ANIMAÇÃO ORGÂNICA (FAKE LOADING)
      // Roda independente dos eventos para dar sensação de vida
      let currentFake = 0;
      const fakeLoader = () => {
          if (currentFake >= 90) return; // Trava em 90% esperando o sinal real
          
          let jump = Math.random() * 2;
          if (currentFake > 30 && currentFake < 40) jump = 0.3; // Lento no meio
          if (currentFake > 70) jump = 0.1; // Quase parando no final
          
          currentFake += jump;
          // Só atualiza se o progresso real (de update) for menor
          setProgress(prev => Math.max(prev, currentFake));
          requestAnimationFrame(fakeLoader);
      };
      requestAnimationFrame(fakeLoader);

      // 1. Escuta Status REAL do Electron
      window.electron.onUpdateStatus(({ status, msg }) => {
        console.log(`[UPDATE] Status: ${status} - ${msg}`);
        setStatusText(msg);
        
        if (status === 'checking') {
             // Deixa o fake loader rodar
        }
        if (status === 'available') {
             setIsUpdating(true); // Bloqueia a entrada, vai atualizar
             // A partir daqui, o progresso vem do download real
        }
        if (status === 'downloaded') {
             setProgress(100);
             setStatusText("Reiniciando para aplicar...");
             setTimeout(() => window.electron.restartApp(), 2000);
        }
      });

      // 2. Escuta Progresso do Download REAL
      window.electron.onDownloadProgress((prog) => {
        setIsUpdating(true);
        setProgress(prog);
        if (prog < 100) {
            setStatusText(`Baixando Atualização: ${Math.round(prog)}%`);
        }
      });

      // 3. Fallback de Segurança (Caso não haja update, entra no app)
      const safetyTimer = setTimeout(() => {
        if (!isUpdating) {
            setStatusText("Carregando Interface...");
            setProgress(100);
            setTimeout(onComplete, 800);
        }
      }, 5000); // 5 segundos é um tempo bom de splash

      return () => clearTimeout(safetyTimer);

    } else {
      // --- MODO NAVEGADOR (Simulação Orgânica) ---
      let current = 0;
      const simulateLoading = () => {
          if (current >= 100) {
             setProgress(100);
             return;
          }
          
          const remaining = 100 - current;
          let jump = Math.random() * (remaining > 50 ? 5 : 2); 
          if ((current > 30 && current < 35) || (current > 70 && current < 75)) jump = 0.2; 

          current += jump;
          setProgress(Math.min(current, 100));
          requestAnimationFrame(simulateLoading);
      };
      
      setTimeout(simulateLoading, 500);
      const timer = setTimeout(onComplete, 4500); 
      return () => clearTimeout(timer);
    }
  }, [onComplete, isUpdating]);

  // Monitora conclusão do carregamento (Correção de Lógica)
  useEffect(() => {
    if (progress >= 100 && !isUpdating) {
        const timer = setTimeout(onComplete, 500); // Pequeno delay para ver o 100%
        return () => clearTimeout(timer);
    }
  }, [progress, isUpdating, onComplete]);

  return (
    <main className="fixed inset-0 z-[9999] flex flex-col items-center justify-center splash-bg">
      <section className="splash-logo-card animate-enter">
        <div className="splash-logo-frame">
          <img src="img/splash.png" alt="CBCF" className="w-[320px] h-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(59,245,165,0.15)]" />
          <div className="splash-loader-bar">
            <div className="bar-inner" style={{ width: `${progress}%`, transition: isUpdating ? 'width 0.2s linear' : 'width 0.2s ease-out' }}></div>
          </div>
          <div className="mt-4 w-full flex justify-between text-[10px] font-bold tracking-[0.2em] text-[#3bf5a5] opacity-80 uppercase">
             <span>{statusText}</span>
             <span>{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      </section>
    </main>
  );
};

// Login Screen
const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('cbcfsafe');
  const [error, setError] = useState('');
  const [appVersion, setAppVersion] = useState('...');

  useEffect(() => {
    if (window.electron) {
      window.electron.getAppVersion().then(v => setAppVersion(`v${v}`));
    } else {
      setAppVersion('v1.0.9 (Web)');
    }
  }, []);

  // Usa a data injetada pelo Vite no momento do build
  // eslint-disable-next-line no-undef
  const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toLocaleDateString('pt-BR');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'cbcfsafe') onLogin();
    else setError('Acesso negado.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020715]">
      <div className="cyber-grid opacity-40 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#3bf5a5] rounded-full mix-blend-screen filter blur-[150px] animate-breathe-subtle opacity-10 pointer-events-none"></div>
      
      {/* 1. Card com padding vertical maior (py-12) e um pouco mais largo (max-w-sm -> max-w-md) */}
      <section className="w-full max-w-[420px] px-10 py-12 glass-panel rounded-3xl relative z-10 animate-enter border-t border-white/10 shadow-2xl">
        <div className="text-center mb-10 relative">
          {/* 5A. Glow circular atrás do título */}
          <div className="absolute -inset-4 top-[-2rem] left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-cyan-400/20 rounded-full pointer-events-none opacity-50" style={{ filter: 'blur(60px)' }}></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-[#3bf5a5]/30 bg-[#3bf5a5]/5 rounded-full text-[#3bf5a5] text-[10px] font-bold tracking-[0.2em]" style={{ textShadow: '0 0 5px rgba(59, 245, 165, 0.4)' }}>ACESSO RESTRITO</div>
          
          {/* 1. Glow MUITO leve atrás do título (via text-shadow) */}
          <h1 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '0 0 25px rgba(25, 230, 255, 0.2)' }}>
            CBCF <span className="text-[#19e6ff]">Painel</span>
          </h1>

          {/* 1. Linha neon sutil separando o topo */}
          <div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent mx-auto mt-4" style={{ filter: 'blur(1px)'}}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-2">
            {/* 3. Rótulos mais claros, menos tracking e com tom azulado */}
            <label className="text-[11px] font-bold text-blue-300/70 ml-1 uppercase tracking-normal">Identificação</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-gray-500"/>
              <input type="text" value={user} onChange={e=>setUser(e.target.value)} className="w-full pl-12 py-3 rounded-xl input-future text-sm" placeholder="Usuário" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-blue-300/70 ml-1 uppercase tracking-normal">Chave</label>
             <div className="relative">
              <Lock size={16} className="absolute left-4 top-3.5 text-gray-500"/>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full pl-12 py-3 rounded-xl input-future text-sm" placeholder="••••••" />
            </div>
          </div>

          {error && <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>}
          
          {/* 2. Botão com mais protagonismo (usando a classe .btn-neon-glow) */}
          <button type="submit" className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest btn-neon-glow mt-4">Entrar</button>
        </form>

        {/* 5B. Linha de status */}
        <div className="text-center mt-8">
          <p className="text-[10px] text-gray-600 font-semibold tracking-wider">
            <span className="text-green-400/70">●</span> Sistema seguro • Última atualização: {buildDate} ({appVersion})
          </p>
        </div>
      </section>
    </div>
  );
};

// Connect APIs Screen
const ConnectApisScreen = ({ onEnter, apiStatus, onConnect, dailyVerse, onLogout }) => {
  const hasAnyConnection = Object.values(apiStatus).some(status => status);
  const [showVerse, setShowVerse] = useState(false);

  useEffect(() => {
    // Show verse after a short delay for animation
    const timer = setTimeout(() => setShowVerse(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const ConnectionButton = ({ platform, icon, label, isConnected }) => {
    const handleConnectClick = () => {
        if (!isConnected) {
            onConnect(platform);
        }
    };

    const iconStyle = { filter: `drop-shadow(0 0 8px ${colors[platform] || '#fff'}60)` };

    if (isConnected) {
      return (
        <div className="flex items-center justify-between w-full text-left p-4 rounded-xl bg-green-500/10 border border-green-500/20 transition-all">
          <div className="flex items-center gap-4">
            {React.cloneElement(icon, { style: iconStyle })}
            <span className="font-bold text-white">{label}</span>
          </div>
          <div className="flex items-center gap-2 text-green-400" style={{ filter: 'drop-shadow(0 0 10px #3bf5a580)'}}>
            <CheckCircle size={18} />
            <span className="text-sm font-semibold">Conectado</span>
          </div>
        </div>
      );
    }

    return (
      <button 
        onClick={handleConnectClick}
        className="flex items-center gap-4 w-full text-left p-4 rounded-xl glass-panel transition-all duration-200 ease-out border border-transparent transform hover:scale-[1.01] active:scale-[0.99] hover:border-[var(--neon-green)]/30 hover:bg-[rgba(59,245,165,0.2)] hover:shadow-[0_0_15px_rgba(59,245,165,0.2)] active:bg-[rgba(59,245,165,0.3)]"
        style={{ boxShadow: '0 0 5px rgba(255,255,255,0.05)' }}
      >
        {React.cloneElement(icon, { style: { ...icon.props.style, opacity: 0.8 } })}
        <span className="font-bold text-white">{label}</span>
      </button>
    );
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020715]">
      {/* (A) Glow controlado no fundo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full mix-blend-lighten filter blur-[300px] animate-breathe-subtle opacity-50 pointer-events-none"></div>      <div className="cyber-grid opacity-40 pointer-events-none"></div>

      <section className="w-full max-w-[500px] p-10 glass-panel rounded-2xl relative z-10 animate-enter border-t border-white/10 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo!</h1>
          
          {dailyVerse && (
            <div className={`my-4 transition-all duration-1000 ease-out ${showVerse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <blockquote className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm italic text-gray-300 leading-relaxed">
                  &ldquo;{dailyVerse.text}&rdquo;
                </p>
                <p className="text-xs font-bold text-gray-500 mt-2 text-right">
                  — {dailyVerse.reference}
                </p>
              </blockquote>
              {/* (B) Linha fina luminosa */}
              <div className="h-[1px] w-1/3 mx-auto mt-4 bg-gradient-to-r from-transparent via-[#00FFB2]/50 to-transparent" style={{ filter: 'blur(1px)' }}></div>
            </div>
          )}

          <p className="text-gray-400 max-w-sm mx-auto">Conecte suas contas para iniciar a análise de métricas.</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <ConnectionButton 
            platform="youtube"
            label="YouTube"
            icon={<Youtube size={24} className="text-red-500"/>}
            isConnected={apiStatus.youtube}
          />
          <ConnectionButton 
            platform="tiktok"
            label="TikTok"
            icon={<img src="img/tiktok.png" className="w-[24px] h-[24px]" alt="TikTok Icon" />}
            isConnected={apiStatus.tiktok}
          />
          <ConnectionButton 
            platform="instagram"
            label="Instagram"
            icon={<Instagram size={24} style={{color: colors.instagram}} />}
            isConnected={apiStatus.instagram}
          />
        </div>
        
        <button 
          onClick={onEnter} 
          className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-widest btn-neon-glow mt-2"
        >
            Entrar no App
        </button>
      </section>
    </div>
  );
};



// --- COMPONENTES AUXILIARES ---
const formatLargeNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num;
};

// --- CARD DE AUDIÊNCIA ---
const AudienceCard = ({ title, count, growth, imgSrc, color, postsPlatformFilter }) => {
  const displayGrowth = growth && growth !== "N/A";
  
  let growthValue = 0;
  let growthColor = '#94a3b8'; // Default gray
  let GrowthIcon = null;
  let growthPrefix = '';

  if (displayGrowth && typeof growth === 'string') {
    // Backend já manda formatado (ex: "+1500 este mês"), então não adicionamos prefixo
    if (growth.includes('este mês')) {
        growthValue = parseFloat(growth.replace(/[^0-9.-]/g, '')); // Extrai só número para cor
        growthPrefix = ''; 
    } else {
        growthValue = parseFloat(growth.replace('%', '').replace(',', '.'));
        growthPrefix = '+';
    }

    if (growthValue > 0) {
      growthColor = colors.primary; 
      GrowthIcon = TrendingUp;
    } else if (growthValue < 0) {
      growthColor = '#ef4444'; 
      GrowthIcon = ThumbsDown; // TrendingDown não existe no import, usando ThumbsDown ou similar
    } else {
      growthColor = '#94a3b8'; 
      GrowthIcon = TrendingUp; 
    }
  }
  
  return (
    <div key={`audience-${title}-${postsPlatformFilter}`} className={`p-5 rounded-xl glass-panel relative overflow-hidden group chart-appear`} style={{borderColor: postsPlatformFilter === 'all' ? 'rgba(255,255,255,0.08)' : `${color}30`}}>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-8 h-8 rounded-lg bg-white/5 p-1.5 flex items-center justify-center border border-white/10">
                <img src={imgSrc} alt={title} className="w-full h-full object-contain" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</span>
          </div>
          <div className="text-2xl font-bold text-white">{count ? count.toLocaleString() : 0}</div>
          {displayGrowth && (
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold" style={{ color: growthColor }}>
              {GrowthIcon && <GrowthIcon size={12} />}
              {growthPrefix}{growth.replace(' este mês', '')} este mês
            </div>
          )}
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 scale-150 blur-sm pointer-events-none">
           <img src={imgSrc} className="w-24 h-24" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ backgroundColor: color, opacity: 0.5 }}></div>
    </div>
  );
};

// --- KPI CARD (METAS) PROFISSIONAL ---
const ProfessionalPostGoalCard = ({ title, current, goal, color, imgSrc }) => {
  const isOff = goal === 'Off';
  // Garante que a meta seja um número válido > 0 para evitar divisão por zero
  const numericGoal = (typeof goal === 'number' && goal > 0) ? goal : 1;
  // Calcula porcentagem, limitando a 100% e protegendo contra NaN
  const rawProgress = (current / numericGoal) * 100;
  const progress = isOff ? 0 : Math.min(isNaN(rawProgress) ? 0 : rawProgress, 100);
  
  const isMet = !isOff && current >= numericGoal;
  
  // Cor Fixa: Sempre usa a cor da plataforma passada via props
  const finalColor = color;

  return (
    <div className="p-5 rounded-xl glass-panel relative overflow-hidden group transition-all duration-500">
      <div className="flex justify-between items-start relative z-10">
        <div className="w-full pr-12"> {/* Adicionado padding-right para não sobrepor o badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 p-1.5 flex items-center justify-center border border-white/10">
              <img src={imgSrc} alt={title} className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {title}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className={`text-3xl font-bold transition-colors`} style={{ color: isMet ? '#3bf5a5' : 'white' }}>{current}</span>
            <span className="text-sm text-gray-500 mb-1">/ {goal}</span>
          </div>
          <div className="relative w-full h-2.5 bg-[#050814] rounded-full border border-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end"
              style={{
                width: `${progress}%`,
                backgroundColor: finalColor,
                boxShadow: `0 0 15px ${finalColor}${isMet ? 'AA' : '80'}`, // Glow mais forte se meta batida
              }}
            >
                {/* Brilho na ponta da barra para dar sensação de preenchimento */}
                {progress > 0 && <div className="w-1 h-full bg-white/30 rounded-full"></div>}
            </div>
          </div>
        </div>
        <span
          className={`absolute top-4 right-4 text-[9px] px-2 py-1 rounded-full font-bold ${
            isMet
              ? 'bg-[#3bf5a5]/20 text-[#3bf5a5]'
              : isOff
              ? 'bg-red-500/10 text-red-500'
              : 'bg-white/5 text-gray-500'
          }`}
        >
          {isOff ? 'DIA OFF' : isMet ? 'META OK' : 'PENDENTE'}
        </span>
      </div>
    </div>
  );
};

const PostRow = ({ post, onEdit, onDelete }) => {
  let badgeColor = '#888';
  let PlatformIcon = Video;
  let platformLabel = 'Video';

  const p = (post.platform || '').toLowerCase();

  if (p.includes('youtube_shorts')) {
    badgeColor = colors.shorts;
    PlatformIcon = () => <img src="img/youtubeshorts.png" className="w-4 h-4" />;
    platformLabel = 'Shorts';
  } else if (p.includes('youtube_long')) {
    badgeColor = colors.youtube;
    PlatformIcon = () => <img src="img/youtube.png" className="w-4 h-4" />;
    platformLabel = 'Longo';
  } else if (p.includes('tiktok')) {
    badgeColor = colors.tiktok;
    PlatformIcon = () => <img src="img/tiktok.png" className="w-4 h-4" />;
    platformLabel = 'TikTok';
  } else if (p.includes('instagram')) {
    badgeColor = colors.instagram;
    PlatformIcon = () => <img src="img/instagram.png" className="w-4 h-4" />;
    platformLabel = 'Reels';
  }

  return (
    <div className="group flex items-center justify-between p-4 mb-3 rounded-xl glass-panel hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
      <div className="flex items-center gap-4 min-w-[250px]">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 bg-[#0a0f1f]">
           {post.thumbnail_url ? <img src={post.thumbnail_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Video size={20} className="text-gray-700" /></div>}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PlatformIcon />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase tracking-wide border border-white/5" style={{ color: badgeColor }}>
              {platformLabel}
            </span>
          </div>
          <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-[#3bf5a5] transition-colors">{post.title}</h4>
          <span className="text-[10px] text-gray-600">{new Date(post.published_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Métricas podem ser adicionadas aqui se necessário */}

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(post)} className="p-2 rounded hover:bg-[#19e6ff]/10 text-[#19e6ff] transition-colors"><Edit size={16} /></button>
        <button onClick={() => onDelete(post.id)} className="p-2 rounded hover:bg-red-500/10 text-red-400 transition-colors"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};


// --- COMPONENTES DE GRÁFICO REUTILIZÁVEIS ---

const MonthlyAreaChart = ({ data, dataKeySuffix, title, icon: Icon, postsPlatformFilter }) => {
    // console.log("MonthlyAreaChart Data:", data); // DEBUG: Ver o que está chegando
    if (!data || data.length === 0) return <div className="p-6 h-80 flex items-center justify-center text-gray-500">Sem dados para exibir</div>;
    return (
        <div className="p-6 rounded-2xl glass-panel relative chart-appear h-80 min-h-[320px] border border-white/5 shadow-lg flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2 flex-shrink-0">
                {Icon && <Icon size={16} className="text-[#3bf5a5]" />}
                {title}
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradYt${dataKeySuffix}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.youtube} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.youtube} stopOpacity={0}/></linearGradient>
                            <linearGradient id={`gradTk${dataKeySuffix}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.tiktok} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.tiktok} stopOpacity={0}/></linearGradient>
                            <linearGradient id={`gradIg${dataKeySuffix}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.instagram} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.instagram} stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                        <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={50} />
                        <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatLargeNumber} scale={postsPlatformFilter === 'all' ? "log" : "auto"} domain={postsPlatformFilter === 'all' ? [1, 'auto'] : ['auto', 'auto']} allowDataOverflow />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}/>
                        
                        {(postsPlatformFilter === 'all' || postsPlatformFilter === 'youtube') && (
                            <Area type="monotone" dataKey={`youtube.${dataKeySuffix}`} name="YouTube" stroke={colors.youtube} fill={`url(#gradYt${dataKeySuffix})`} strokeWidth={2} />
                        )}
                        {(postsPlatformFilter === 'all' || postsPlatformFilter === 'tiktok') && (
                            <Area type="monotone" dataKey={`tiktok.${dataKeySuffix}`} name="TikTok" stroke={colors.tiktok} fill={`url(#gradTk${dataKeySuffix})`} strokeWidth={2} />
                        )}
                        {(postsPlatformFilter === 'all' || postsPlatformFilter === 'instagram') && (
                            <Area type="monotone" dataKey={`instagram.${dataKeySuffix}`} name="Instagram" stroke={colors.instagram} fill={`url(#gradIg${dataKeySuffix})`} strokeWidth={2} />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const DailyBarChart = ({ data, dataKeySuffix, title, icon: Icon, postsPlatformFilter }) => {
    return (
        <div className="p-6 rounded-2xl glass-panel relative chart-appear h-80 min-h-[320px] border border-white/5 shadow-lg flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2 flex-shrink-0">
                {Icon && <Icon size={16} className="text-[#19e6ff]" />}
                {title}
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                        <XAxis dataKey="day" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
                        <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatLargeNumber} scale={postsPlatformFilter === 'all' ? "log" : "auto"} domain={postsPlatformFilter === 'all' ? [1, 'auto'] : ['auto', 'auto']} allowDataOverflow />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }}/>
                        
                        {(postsPlatformFilter === 'all' || postsPlatformFilter === 'youtube') && (
                            <Bar dataKey={`youtube.${dataKeySuffix}`} name="YouTube" fill={colors.youtube} radius={[2, 2, 0, 0]} />
                        )}
                        {(postsPlatformFilter === 'all' || postsPlatformFilter === 'tiktok') && (
                            <Bar dataKey={`tiktok.${dataKeySuffix}`} name="TikTok" fill={colors.tiktok} radius={[2, 2, 0, 0]} />
                        )}
                        {(postsPlatformFilter === 'all' || postsPlatformFilter === 'instagram') && (
                            <Bar dataKey={`instagram.${dataKeySuffix}`} name="Instagram" fill={colors.instagram} radius={[2, 2, 0, 0]} />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- DASHBOARD VIEW ---
const DashboardView = ({
  posts,
  summary,
  audience,
  dailyData,
  monthlyData,
  onDelete,
  monthlyStartDate,
  setMonthlyStartDate,
  monthlyEndDate,
  setMonthlyEndDate,
  postsPlatformFilter,
  setPostsPlatformFilter,
  onGenerateReport, // NOVO PROP
}) => {
  const day = new Date().getDay();
  const ytLongGoal = day === 2 || day === 4 ? 1 : 'Off';

  const getButtonColor = (p) => {
    const colorMap = {
      all: colors.primary,
      tiktok: colors.tiktok,
      instagram: colors.instagram,
      youtube: colors.youtube,
    };
    return colorMap[p] || colors.secondary;
  };

  const handlePlatformChange = (p) => {
    setPostsPlatformFilter(p);
  };

  // --- LOGICA DE VISUALIZAÇÃO ESPECIALIZADA ---
  const isYouTubeDeepDive = postsPlatformFilter === 'youtube';
  const isTikTokDeepDive = postsPlatformFilter === 'tiktok';

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scroll animate-enter">
      
      {/* 1. Header de Metas (KPIs Rápidos) */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity size={16} /> Metas do Dia
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProfessionalPostGoalCard title="Shorts" current={summary.shorts?.current || 0} goal={summary.shorts?.goal} color={colors.shorts} imgSrc="img/youtubeshorts.png" />
          <ProfessionalPostGoalCard title="TikTok" current={summary.tiktok?.current || 0} goal={summary.tiktok?.goal} color={colors.tiktok} imgSrc="img/tiktok.png" />
          <ProfessionalPostGoalCard title="YouTube Longo" current={summary.youtube_long?.current || 0} goal={ytLongGoal} color={colors.youtube} imgSrc="img/youtube.png" />
        </div>
      </section>

      {/* Filtros de Plataforma */}
      <div className="flex items-center justify-center gap-4 border-y border-white/5 py-6">
        {['all', 'youtube', 'tiktok', 'instagram'].map((p) => {
          const buttonColor = getButtonColor(p);
          const isActive = postsPlatformFilter === p;
          return (
            <button
              key={p}
              onClick={() => handlePlatformChange(p)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                isActive ? 'bg-white/10 text-white' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              style={{
                borderColor: isActive ? buttonColor : 'transparent',
                color: isActive ? buttonColor : undefined,
                boxShadow: isActive ? `0 0 15px ${buttonColor}80` : 'none',
              }}
            >
              {p === 'all' ? 'Visão Geral' : p}
            </button>
          );
        })}
      </div>

      {/* SE FOR YOUTUBE OU TIKTOK, RENDERIZA O DEEP DIVE. CASO CONTRÁRIO, DASHBOARD NORMAL. */}
      {isYouTubeDeepDive ? (
        <YouTubeDeepDive posts={posts} dailyData={dailyData} audience={audience} />
      ) : isTikTokDeepDive ? (
        <TikTokDeepDive posts={posts} dailyData={dailyData} audience={audience} />
      ) : (
        <>
          {/* Audiência & Crescimento (Cards) */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
              <Users size={16} /> Audiência & Crescimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(postsPlatformFilter === 'all' || postsPlatformFilter === 'youtube') && (
                <AudienceCard title="YouTube Principal" count={audience?.youtube_long?.count} growth={audience?.youtube_long?.growth} imgSrc="img/youtube.png" color={colors.youtube} postsPlatformFilter={postsPlatformFilter} />
              )}
              {(postsPlatformFilter === 'all' || postsPlatformFilter === 'tiktok') && (
                <AudienceCard title="TikTok" count={audience?.tiktok?.count} growth={audience?.tiktok?.growth} imgSrc="img/tiktok.png" color={colors.tiktok} postsPlatformFilter={postsPlatformFilter} />
              )}
              {(postsPlatformFilter === 'all' || postsPlatformFilter === 'instagram') && (
                <AudienceCard title="Instagram" count={audience?.instagram?.count} growth={audience?.instagram?.growth} imgSrc="img/instagram.png" color={colors.instagram} postsPlatformFilter={postsPlatformFilter} />
              )}
            </div>
          </section>

          {/* 2. VISÃO MACRO (MENSAL) - ÁREA CHART */}
          <section>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CalendarIcon className="text-[#3bf5a5]" /> 
                    Performance Mensal (Dez/24 - Dez/25)
                </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
                <MonthlyAreaChart data={monthlyData} dataKeySuffix="net_growth" title="Novos Fãs (Líquido)" icon={UserPlus} postsPlatformFilter={postsPlatformFilter} />
                <MonthlyAreaChart data={monthlyData} dataKeySuffix="views" title="Visualizações Totais" icon={Eye} postsPlatformFilter={postsPlatformFilter} />
                
                {/* Profile Views - Exclusivo TikTok */}
                {postsPlatformFilter === 'tiktok' && (
                  <MonthlyAreaChart data={monthlyData} dataKeySuffix="profile_views" title="Visualizações de Perfil" icon={User} postsPlatformFilter={postsPlatformFilter} />
                )}

                <MonthlyAreaChart data={monthlyData} dataKeySuffix="likes" title="Curtidas (Likes)" icon={Heart} postsPlatformFilter={postsPlatformFilter} />
                <MonthlyAreaChart data={monthlyData} dataKeySuffix="comments" title="Comentários" icon={MessageCircle} postsPlatformFilter={postsPlatformFilter} />
                <MonthlyAreaChart data={monthlyData} dataKeySuffix="shares" title="Compartilhamentos" icon={Share2} postsPlatformFilter={postsPlatformFilter} />
            </div>
          </section>

          {/* 3. VISÃO MICRO (DIÁRIO) - BAR CHART AGRUPADO */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 border-t border-white/5 pt-8 mt-8">
                <TrendingUp className="text-[#19e6ff]" /> 
                Pulso Diário (Tático)
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
                <DailyBarChart data={dailyData} dataKeySuffix="net_growth" title="Novos Fãs (Diário)" icon={UserPlus} postsPlatformFilter={postsPlatformFilter} />
                <DailyBarChart data={dailyData} dataKeySuffix="views" title="Visualizações (Diário)" icon={Eye} postsPlatformFilter={postsPlatformFilter} />

                {/* Profile Views - Exclusivo TikTok */}
                {postsPlatformFilter === 'tiktok' && (
                  <DailyBarChart data={dailyData} dataKeySuffix="profile_views" title="Visualizações de Perfil (Diário)" icon={User} postsPlatformFilter={postsPlatformFilter} />
                )}

                <DailyBarChart data={dailyData} dataKeySuffix="likes" title="Curtidas (Diário)" icon={Heart} postsPlatformFilter={postsPlatformFilter} />
                <DailyBarChart data={dailyData} dataKeySuffix="comments" title="Comentários (Diário)" icon={MessageCircle} postsPlatformFilter={postsPlatformFilter} />
                <DailyBarChart data={dailyData} dataKeySuffix="shares" title="Compartilhamentos (Diário)" icon={Share2} postsPlatformFilter={postsPlatformFilter} />
            </div>
          </section>
        </>
      )}

      {/* 4. Inteligência de Dados */}

      {/* 4. Inteligência de Dados & Publicações Recentes (Apenas Visão Geral) */}
      {!isYouTubeDeepDive && !isTikTokDeepDive && (
        <>
          {/* Seção de IA (Desativada temporariamente na Visão Geral se desejar, mas mantendo a lógica de ocultar no Deep Dive) */}
          <section className="border-t border-white/5 pt-8 mt-8 mb-8">
              <div className="bg-gradient-to-r from-[#19e6ff]/10 to-transparent p-6 rounded-2xl border border-[#19e6ff]/20 flex items-center justify-between">
                  <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Sparkles size={20} className="text-[#19e6ff]" />
                          Inteligência Artificial
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">Gere relatórios profundos cruzando todos os dados acima.</p>
                  </div>
                  <button 
                      onClick={onGenerateReport}
                      className="bg-[#19e6ff] text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(25,230,255,0.3)]"
                  >
                      <FileText size={18} />
                      Gerar Análise Completa
                  </button>
              </div>
          </section>

          {/* 5. Publicações do Dia */}
          <section className="border-t border-white/5 pt-8 mt-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
              <Zap size={16} className="text-[#19e6ff]" /> Publicações do Dia ({new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
            </h3>
            <div className="space-y-2">
              {(() => {
                const today = new Date();
                const startOfDay = new Date(today);
                startOfDay.setHours(0, 0, 0, 0);
                
                // Estende a janela até as 04:00 do dia seguinte para pegar posts da "madrugada UTC"
                const endOfWindow = new Date(today);
                endOfWindow.setDate(endOfWindow.getDate() + 1);
                endOfWindow.setHours(4, 0, 0, 0);

                const todaysPosts = posts.filter(post => {
                  const postDate = new Date(post.published_at);
                  return postDate >= startOfDay && postDate <= endOfWindow;
                });

                if (todaysPosts.length === 0) {
                  return (
                    <div className="p-4 text-center text-gray-500 bg-white/5 rounded-xl border border-white/10">
                      Nenhuma postagem realizada ainda no dia.
                    </div>
                  );
                }

                return todaysPosts.map((post) => (
                  <PostRow
                    key={post.id}
                    post={post}
                    onEdit={() => {}}
                    onDelete={onDelete}
                  />
                ));
              })()}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

// --- MODAL DE NOVA POSTAGEM (Dinâmico) ---
const AddPostModal = ({ isOpen, onClose, onSave }) => {
  const [f, setF] = useState({ platform: 'youtube_shorts', title: '', url: '' });
  const [preview, setPreview] = useState(null);

  const handleImg = (e) => {
    if(e.target.files[0]) setPreview(URL.createObjectURL(e.target.files[0]));
  };

  // Cor dinâmica do modal
  let modalColor = colors.secondary;
  if(f.platform === 'tiktok') modalColor = colors.tiktok;
  if(f.platform === 'youtube_long') modalColor = colors.youtube;
  if(f.platform === 'instagram') modalColor = colors.instagram;

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-enter">
      <div className="w-full max-w-3xl p-8 glass-panel rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]" style={{ borderColor: `${modalColor}30` }}>
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <div className="p-2 rounded-lg" style={{ backgroundColor: `${modalColor}20`, color: modalColor }}><Plus size={24}/></div>
             Criar Nova Postagem
           </h2>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X/></button>
        </div>

        <div className="grid grid-cols-3 gap-8">
           <div className="col-span-1">
              <label className="block w-full aspect-[9/16] bg-black/40 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden" style={{ borderColor: `${modalColor}30` }}>
                 {preview ? (
                   <img src={preview} className="absolute inset-0 w-full h-full object-cover" />
                 ) : (
                   <>
                     <div className="p-4 rounded-full bg-white/5 mb-3 transition-colors" style={{ color: modalColor }}><ImageIcon size={24} /></div>
                     <span className="text-xs text-gray-500 font-medium">Enviar Capa</span>
                   </>
                 )}
                 <input type="file" className="hidden" onChange={handleImg} accept="image/*" />
              </label>
           </div>

           <div className="col-span-2 space-y-5">
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: modalColor }}>Plataforma</label>
                 <div className="grid grid-cols-3 gap-3">
                    {['youtube_shorts', 'tiktok', 'youtube_long', 'instagram'].map(p => (
                       <button 
                         key={p}
                         onClick={()=>setF({...f, platform: p})}
                         className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase transition-all ${f.platform === p ? 'bg-white/10 text-white' : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'}`}
                         style={{ borderColor: f.platform === p ? modalColor : 'rgba(255,255,255,0.1)', color: f.platform === p ? modalColor : undefined }}
                       >
                         {p.replace('_', ' ')}
                       </button>
                    ))}
                 </div>
              </div>
              
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: modalColor }}>Título do Vídeo</label>
                 <input className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-xl focus:outline-none transition-all" placeholder="Ex: 5 Dicas Incríveis..." value={f.title} onChange={e=>setF({...f, title: e.target.value})} style={{ borderColor: `${modalColor}50` }} />
              </div>
              
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: modalColor }}>Link URL</label>
                 <input className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-xl focus:outline-none transition-all" placeholder="https://..." value={f.url} onChange={e=>setF({...f, url: e.target.value})} style={{ borderColor: `${modalColor}50` }} />
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
           <button onClick={onClose} className="px-6 py-3 rounded-xl text-gray-400 hover:text-white font-bold hover:bg-white/5 transition-colors">Cancelar</button>
           <button onClick={()=>onSave({...f, cover_image: preview})} className="px-8 py-3 text-black rounded-xl font-bold hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all transform hover:-translate-y-1" style={{ backgroundColor: modalColor }}>
             Publicar Agora
           </button>
        </div>
      </div>
    </div>
  )
}

// --- MODAL DE AJUSTE MANUAL ---
const ManualUpdateModal = ({ isOpen, onClose, onSave, apiBaseUrl }) => {
  const [missingDays, setMissingDays] = useState([]);
  const [values, setValues] = useState({}); // { 'date': { views: 0, ... } }
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, success, error

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSaveStatus('idle');
      fetch(`${apiBaseUrl}/api/metrics/missing_days`)
        .then(res => res.json())
        .then(data => {
          setMissingDays(data);
          const initialValues = {};
          data.forEach(d => {
            initialValues[d.date] = { views: 0, likes: 0, comments: 0, shares: 0, profile_views: 0 };
          });
          setValues(initialValues);
          setLoading(false);
        })
        .catch(e => { console.error(e); setLoading(false); });
    }
  }, [isOpen, apiBaseUrl]);

  const handleChange = (date, field, val) => {
    setValues(prev => ({
      ...prev,
      [date]: { ...prev[date], [field]: parseInt(val) || 0 }
    }));
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  const handleSave = () => {
    const payload = Object.keys(values)
      .filter(date => (parseInt(values[date].count) || 0) > 0) // Filtra dias sem dados (count 0)
      .map(date => ({
      date,
      platform: 'tiktok',
      count: parseInt(values[date].count) || 0,
      views: parseInt(values[date].views) || 0,
      likes: parseInt(values[date].likes) || 0,
      comments: parseInt(values[date].comments) || 0,
      shares: parseInt(values[date].shares) || 0,
      profile_views: parseInt(values[date].profile_views) || 0,
      is_final: true // FINALIZAR TUDO
    }));

    if (payload.length === 0) {
        setSaveStatus('error');
        return;
    }
    onSave(payload);
    setSaveStatus('success');
    setTimeout(() => { onClose(); }, 1500);
  };

  const handleRowSave = (date) => {
      const val = values[date];
      if ((parseInt(val.count) || 0) <= 0) {
          setSaveStatus('error');
          return;
      }
      const payload = [{
          date,
          platform: 'tiktok',
          count: parseInt(val.count) || 0,
          views: parseInt(val.views) || 0,
          likes: parseInt(val.likes) || 0,
          comments: parseInt(val.comments) || 0,
          shares: parseInt(val.shares) || 0,
          profile_views: parseInt(val.profile_views) || 0,
          is_final: false // RASCUNHO (Não fecha o dia)
      }];
      onSave(payload, true);
      setSaveStatus('success');
  };

  if (!isOpen) return null;

  // Estilo unificado para todos os inputs
  const inputClass = "w-24 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#19e6ff]/50 transition-colors placeholder-gray-600";
  const mainInputClass = "w-32 bg-[#19e6ff]/10 border border-[#19e6ff]/30 rounded-lg p-2 text-xs text-white font-bold focus:outline-none focus:border-[#19e6ff] placeholder-gray-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-enter p-4">
      <div className="w-full max-w-5xl glass-panel rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
           <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Clipboard className="text-[#19e6ff]" size={28} />
                Ajuste Manual de Métricas
              </h2>
              <p className="text-gray-500 text-sm mt-1">Preencha o <strong>Total Acumulado</strong>. O sistema calculará o crescimento automaticamente.</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X size={24}/></button>
        </div>

        {/* FEEDBACK VISUAL */}
        {saveStatus === 'success' && (
            <div className="mx-8 mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm font-bold animate-pulse">
                <CheckCircle size={16} /> Alterações salvas com sucesso!
            </div>
        )}
        {saveStatus === 'error' && (
            <div className="mx-8 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm font-bold">
                <AlertCircle size={16} /> Preencha o "Total Acumulado" (deve ser maior que 0).
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 custom-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-20">
               <RefreshCw className="animate-spin text-[#3bf5a5]" size={32} />
            </div>
          ) : missingDays.length === 0 ? (
            <div className="text-center py-20">
               <CheckCircle size={48} className="text-green-500 mx-auto mb-4 opacity-20" />
               <p className="text-gray-400 font-medium">Tudo atualizado! Nenhuma lacuna encontrada nos últimos 15 dias.</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">
                  <th className="pb-2 pl-4">Data</th>
                  <th className="pb-2 text-[#19e6ff]">Total Acumulado</th>
                  <th className="pb-2">Video Views</th>
                  <th className="pb-2">Profile Views</th>
                  <th className="pb-2">Likes</th>
                  <th className="pb-2">Comments</th>
                  <th className="pb-2">Shares</th>
                  <th className="pb-2 pr-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {missingDays.map(day => (
                  <tr key={day.date} className="bg-white/2 rounded-xl group transition-all hover:bg-white/5">
                    <td className="py-4 pl-4 rounded-l-xl">
                       <span className="text-white font-bold text-sm flex items-center gap-2">
                         <img src="img/tiktok.png" className="w-4 h-4 opacity-80" alt="TikTok" />
                         {day.formatted_date}
                       </span>
                    </td>
                    <td className="py-4">
                       <input 
                         type="number" 
                         defaultValue={day.current_count || 0}
                         className={mainInputClass}
                         placeholder="Total Acumulado"
                         onChange={(e) => handleChange(day.date, 'count', e.target.value)}
                       />
                    </td>
                    <td className="py-4">
                       <input type="number" className={inputClass} placeholder="0" onChange={(e) => handleChange(day.date, 'views', e.target.value)} />
                    </td>
                    <td className="py-4">
                       <input type="number" className={inputClass} placeholder="0" onChange={(e) => handleChange(day.date, 'profile_views', e.target.value)} />
                    </td>
                    <td className="py-4">
                       <input type="number" className={inputClass} placeholder="0" onChange={(e) => handleChange(day.date, 'likes', e.target.value)} />
                    </td>
                    <td className="py-4">
                       <input type="number" className={inputClass} placeholder="0" onChange={(e) => handleChange(day.date, 'comments', e.target.value)} />
                    </td>
                    <td className="py-4">
                       <input type="number" className={inputClass} placeholder="0" onChange={(e) => handleChange(day.date, 'shares', e.target.value)} />
                    </td>
                    <td className="py-4 pr-4 rounded-r-xl text-right">
                       <button 
                         onClick={() => handleRowSave(day.date)}
                         title="Salvar Rascunho"
                         className="p-2 bg-white/5 text-gray-400 hover:text-[#19e6ff] hover:bg-[#19e6ff]/10 rounded-lg transition-colors"
                       >
                         <Save size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-white/2 flex justify-end gap-4 rounded-b-3xl">
           <button onClick={onClose} className="px-6 py-3 rounded-xl text-gray-400 hover:text-white font-bold transition-colors">Cancelar</button>
           <button 
             disabled={missingDays.length === 0}
             onClick={handleSave} 
             className="px-10 py-3 bg-[#3bf5a5] text-[#050814] rounded-xl font-extrabold hover:shadow-[0_0_30px_rgba(59,245,165,0.3)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center gap-2"
           >
             <CheckCircle size={18} className="text-black" /> Finalizar Dias
           </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE DE NOTIFICAÇÃO CYBER ---
const CyberNotification = ({ message, type, onClose }) => {
  return (
    <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[9999] animate-enter flex items-center gap-3 px-6 py-4 rounded-xl backdrop-blur-md border shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
      type === 'success' 
        ? 'bg-green-500/10 border-green-500/50 text-green-400' 
        : 'bg-red-500/10 border-red-500/50 text-red-400'
    }`}>
      {type === 'success' ? <CheckCircle size={20} className="animate-pulse" /> : <AlertCircle size={20} />}
      <span className="font-bold text-sm tracking-wide">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity"><X size={16}/></button>
    </div>
  );
};

// --- APP ---

const API_BASE_URL = 'https://127.0.0.1:8000';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // --- ESTADOS DOS DADOS ---
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState({});
  const [audienceData, setAudienceData] = useState({});
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [apiStatus, setApiStatus] = useState({ youtube: false, tiktok: false, instagram: false });
  const [aiSidebarStatus, setAiSidebarStatus] = useState(null);
  const [dailyVerse, setDailyVerse] = useState("");
  
  // --- ESTADOS PARA RELATÓRIO DE INTELIGÊNCIA ---
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [reportDates, setReportDates] = useState({ start: '', end: '' });

  // --- ESTADOS DE NOTIFICAÇÃO ---
  const [notification, setNotification] = useState(null); // { message, type: 'success'|'error' }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Inicializa datas do relatório e Versículo
  useEffect(() => {
      // Datas Padrão
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      // Garante formato YYYY-MM-DD para os inputs de data
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      setReportDates({
          start: formatDate(start),
          end: formatDate(end)
      });

      // Versículo do Dia
      if (verses && verses.length > 0) {
          const randomIndex = Math.floor(Math.random() * verses.length);
          setDailyVerse(verses[randomIndex]);
      }
  }, []);

  const handleGenerateAiReport = () => {
      setShowDateRangePicker(true);
  };

  const confirmGenerateReport = async () => {
      setShowDateRangePicker(false);
      setShowAnalyticsModal(true);
      setIsGeneratingReport(true);
      setAnalyticsData(null); // Limpa dados anteriores

      const d1 = new Date(reportDates.start).toLocaleDateString('pt-BR');
      const d2 = new Date(reportDates.end).toLocaleDateString('pt-BR');
      const prompt = `Faça uma análise completa de ${d1} até ${d2}. Foque em crescimento, engajamento e qualidade do conteúdo.`;

      try {
          const response = await fetch(`${API_BASE_URL}/api/ai/data_analytics`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt, context_type: 'report' }), // Adiciona flag de relatório
          });

          if (!response.ok) throw new Error("Erro na análise de dados");

          const data = await response.json();
          setAnalyticsData(data);
          showNotification("Relatório de Inteligência gerado com sucesso!", "success");
      } catch (error) {
          console.error("Erro ao gerar relatório IA:", error);
          showNotification("Erro ao gerar análise de IA.", "error");
          setAnalyticsData({
              summary_text: "**Erro ao gerar análise.** Tente novamente mais tarde.",
              key_insights: ["Erro de conexão"],
              charts: {}
          });
      } finally {
          setIsGeneratingReport(false);
      }
  };

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/status`);
      if (response.ok) {
        const data = await response.json();
        setApiStatus(data);
      }
    } catch (e) {
      console.error("Erro ao buscar status das APIs:", e);
    }
  }, []);

  const fetchAiSidebarStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/status`);
      if (response.ok) {
        const data = await response.json();
        setAiSidebarStatus(data);
      }
    } catch (e) {
      console.error("Erro ao buscar status da IA:", e);
    }
  }, []);

  const handleLogin = () => {
    setScreen('connect');
    showNotification("Acesso Autorizado. Bem-vindo ao CBCF Metrics!", "success");
    fetchStatus();
    fetchAiSidebarStatus();
  };

  const handleLogout = () => {
    setScreen('login');
    showNotification("Sessão encerrada com segurança.", "success");
  };

  const handleConnect = async (platform) => {
    try {
      // URL de autenticação que aponta para o nosso novo callback de desktop
      const desktopCallback = encodeURIComponent(`${API_BASE_URL}/auth/desktop_callback`);
      const authUrl = `${API_BASE_URL}/auth/${platform}/login?callback_url=${desktopCallback}`;
      
      if (window.electron) {
        console.log(`--- [AUTH] Abrindo login ${platform} no navegador externo...`);
        window.electron.openExternal(authUrl);
      } else {
        window.location.href = authUrl;
      }
    } catch (e) {
      console.error(`Erro ao conectar ${platform}:`, e);
      showNotification(`Erro ao conectar ${platform}`, 'error');
    }
  };

  const defaultMonthlyStartDate = new Date('2024-12-01');
  const defaultMonthlyEndDate = new Date('2025-12-31');

  const [monthlyStartDate, setMonthlyStartDate] = useState(defaultMonthlyStartDate.toISOString().split('T')[0]);
  const [monthlyEndDate, setMonthlyEndDate] = useState(defaultMonthlyEndDate.toISOString().split('T')[0]);
  
  // Estado para o filtro de plataforma dos posts
  const [postsPlatformFilter, setPostsPlatformFilter] = useState('all');
  const [syncing, setSyncing] = useState(false); // New state to indicate sync in progress

  const fetchData = useCallback(async (
    platformFilter = postsPlatformFilter,
    startMonthly = monthlyStartDate,
    endMonthly = monthlyEndDate
  ) => {
    try {
      // Fetch Summary
      fetch(`${API_BASE_URL}/dashboard/summary`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setSummary(data))
        .catch(e => console.error("Falha ao buscar summary:", e));
      
      // Fetch Posts
      const postsUrl = platformFilter === 'all' 
        ? `${API_BASE_URL}/posts` 
        : `${API_BASE_URL}/posts?platform=${platformFilter}`;
      fetch(postsUrl)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setPosts(data))
        .catch(e => console.error("Falha ao buscar posts:", e));

      // Fetch Audience
      fetch(`${API_BASE_URL}/dashboard/audience`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setAudienceData(data))
        .catch(e => console.error("Falha ao buscar audience data:", e));

      // Fetch Daily Growth
      fetch(`${API_BASE_URL}/dashboard/daily_growth`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setDailyData(data))
        .catch(e => console.error("Falha ao buscar daily growth:", e));

      // Fetch Monthly Growth
      const monthlyUrl = `${API_BASE_URL}/dashboard/monthly_growth?start_date=${startMonthly}&end_date=${endMonthly}`;
      fetch(monthlyUrl)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setMonthlyData(data))
        .catch(e => console.error("Falha ao buscar monthly growth:", e));

    } catch (e) {
      console.error("Falha geral ao despachar buscas:", e);
    }
  }, [postsPlatformFilter, monthlyStartDate, monthlyEndDate]);

  // Listener para Deep Link (OAuth Desktop)
  useEffect(() => {
    if (window.electron) {
      window.electron.onDeepLink((url) => {
        console.log("--- [DEEP LINK] Recebido: ", url);
        try {
          // O URL vem como cbcfmetrics://auth?token=xyz
          // Precisamos tratar para extrair o token
          const queryString = url.split('?')[1];
          if (queryString) {
            const params = new URLSearchParams(queryString);
            const token = params.get('token');
            if (token) {
              console.log("--- [DEEP LINK] Token capturado, atualizando status...");
              showNotification("Conta conectada com sucesso via Desktop!", "success");
              fetchStatus();
              fetchData();
            }
          }
        } catch (e) {
          console.error("Erro ao processar deep link:", e);
        }
      });
    }
  }, [fetchStatus, fetchData]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const platforms = ['youtube', 'tiktok', 'instagram'];
      for (const p of platforms) {
        if (apiStatus[p]) {
            console.log(`Iniciando sync de ${p}...`);
            await fetch(`${API_BASE_URL}/api/sync/${p}`);
        }
      }
      console.log(`Sincronização geral concluída!`);
      showNotification("Sincronização concluída com sucesso!", "success");
      fetchData(); // Refresh data after successful sync
    } catch (e) {
      console.error(`Erro durante a sincronização geral:`, e);
      showNotification("Erro durante a sincronização.", "error");
    } finally {
      setSyncing(false);
    }
  }, [fetchData, apiStatus]);

  const handleManualSave = async (updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics/update_manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        showNotification("Métricas salvas e dias finalizados com sucesso!", "success");
        setIsManualModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error("Erro ao salvar métricas manuais", e);
      showNotification("Erro ao salvar. Tente novamente.", "error");
    }
  };

  // Initial data fetch and automatic refresh
  useEffect(() => {
    if (screen === 'app') {
      // 1. Carrega dados visuais imediatamente
      fetchData(postsPlatformFilter, monthlyStartDate, monthlyEndDate);
      fetchAiSidebarStatus();
      
      // 2. Dispara uma sincronização isolada (sem dependências)
      const initialSync = async () => {
          console.log("--- DISPARO ÚNICO DE SINCRONIZAÇÃO INICIAL ---");
          await handleSync();
      };
      initialSync();
      
      // 3. Define intervalo fixo
      const syncInterval = setInterval(() => {
        handleSync();
        fetchAiSidebarStatus();
      }, 30 * 60 * 1000);

      return () => clearInterval(syncInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]); // APENAS quando mudar a tela para 'app'

  const handleCreatePost = async (newPostData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostData),
      });
      if (!response.ok) throw new Error('Falha ao criar post');
      showNotification("Postagem publicada com sucesso!", "success");
      fetchData();
      setIsModalOpen(false);
    } catch (e) {
      console.error("Erro ao criar post:", e);
      showNotification("Erro ao publicar postagem.", "error");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao deletar post');
      showNotification("Postagem removida da biblioteca.", "success");
      fetchData();
    } catch (e) {
      console.error("Erro ao deletar post:", e);
      showNotification("Erro ao remover postagem.", "error");
    }
  };

  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'biblioteca':
        return 'Biblioteca de Conteúdo';
      default:
        return 'Dashboard';
    }
  };

  return (
    <>
      <GlobalStyles />
      <TitleBar />
      <div className="pt-8 h-screen flex flex-col"> {/* Container Global com padding para TitleBar */}
        {screen === 'splash' && <SplashScreen onComplete={() => setScreen('login')} />}
        {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
        {screen === 'connect' && <ConnectApisScreen onEnter={() => setScreen('app')} apiStatus={apiStatus} onConnect={handleConnect} dailyVerse={dailyVerse} onLogout={handleLogout} />}
        {screen === 'app' && (
          <div className="flex flex-1 overflow-hidden bg-transparent">
            <aside className="w-64 flex-shrink-0 flex flex-col glass-panel border-r-0 m-4 rounded-2xl relative z-20">
            <div className="p-6">
               <h1 className="text-xl font-bold text-white italic tracking-tight">CBCF <span className="text-[#3bf5a5]">METRICS</span></h1>
               <div className="flex items-center gap-2 mt-2">
                  <div className="p-1 rounded bg-[#3bf5a5]/10 border border-[#3bf5a5]/20 text-[#3bf5a5]">
                    <BrainCircuit size={12} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Inteligência de Performance
                  </p>
               </div>
            </div>
            <nav className="flex-1 px-3 space-y-2">
               <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold border transition-all ${activeTab==='dashboard' ? 'bg-[#19e6ff]/10 text-white border-[#19e6ff]/20' : 'text-gray-400 border-transparent hover:bg-white/5'}`}>
                 <LayoutDashboard size={18} className={activeTab==='dashboard'?"text-[#19e6ff]":"text-[#19e6ff]/50"} /> <span className="text-sm">Visão Geral</span>
               </button>
               <button onClick={() => setActiveTab('biblioteca')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold border transition-all ${activeTab==='biblioteca' ? 'bg-[#19e6ff]/10 text-white border-[#19e6ff]/20' : 'text-gray-400 border-transparent hover:bg-white/5'}`}>
                 <BookOpen size={18} className={activeTab==='biblioteca'?"text-[#3bf5a5]":"text-[#3bf5a5]/50"} /> <span className="text-sm">Biblioteca</span>
               </button>
               <button onClick={() => setActiveTab('padroes')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold border transition-all ${activeTab==='padroes' ? 'bg-[#19e6ff]/10 text-white border-[#19e6ff]/20' : 'text-gray-400 border-transparent hover:bg-white/5'}`}>
                 <Diamond size={18} className={activeTab==='padroes'?"text-purple-400":"text-purple-400/50"} /> <span className="text-sm">Padrões</span>
               </button>
               <button onClick={() => setActiveTab('ai_assistant')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold border transition-all ${activeTab==='ai_assistant' ? 'bg-[#3bf5a5]/10 text-white border-[#3bf5a5]/20' : 'text-gray-400 border-transparent hover:bg-white/5'}`}>
                 <Sparkles size={18} className={activeTab==='ai_assistant'?"text-[#3bf5a5] animate-pulse":"text-[#3bf5a5]/50"} /> <span className="text-sm">Assistente IA</span>
               </button>
               <button onClick={() => setActiveTab('data_analytics')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold border transition-all ${activeTab==='data_analytics' ? 'bg-[#19e6ff]/10 text-white border-[#19e6ff]/20' : 'text-gray-400 border-transparent hover:bg-white/5'}`}>
                 <Bot size={18} className={activeTab==='data_analytics'?"text-[#19e6ff] animate-pulse":"text-[#19e6ff]/50"} /> <span className="text-sm">Análise de Dados</span>
               </button>
            </nav>
            
            <div className="p-5 border-t border-white/5 space-y-3">
               {/* STATUS DA IA - DINÂMICO */}
               {aiSidebarStatus && (
                 <div className="bg-[#0a0f1f] rounded-xl p-3 border border-white/5 mb-2 shadow-inner">
                    <div className="mb-3 border-b border-white/5 pb-2">
                        <span className="text-[10px] font-extrabold text-white uppercase tracking-widest block mb-0.5">INTERFACE GEMINI</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider truncate">
                                {aiSidebarStatus.active_model
                                    ? aiSidebarStatus.active_model
                                        .replace('models/', '')
                                        .replace('gemini-', '')
                                        .replace('-preview', '')
                                        .replace('-exp', '')
                                        .replace('-flash', ' Flash')
                                        .replace('1.5', '1.5')
                                        .replace('2.0', '2.0')
                                        .toUpperCase()
                                    : 'IA ONLINE'} • ATIVO
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-lg p-1.5 text-center border border-white/5">
                            <p className="text-[9px] text-gray-500 uppercase font-bold">Uso Hoje</p>
                            <p className="text-xs font-mono text-white font-bold">
                                {aiSidebarStatus.active_model_usage !== undefined ? aiSidebarStatus.active_model_usage : (aiSidebarStatus.requests_today || 0)}
                                <span className="text-[9px] text-gray-600 font-normal">/20</span>
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-1.5 text-center border border-white/5">
                            <p className="text-[9px] text-gray-500 uppercase font-bold">Velocidade</p>
                            <p className="text-xs font-mono text-white font-bold">
                                {aiSidebarStatus.requests_last_minute || 0}
                                <span className="text-[9px] text-gray-600 font-normal"> rpm</span>
                            </p>
                        </div>
                    </div>
                 </div>
               )}

               <button onClick={() => setScreen('login')} className="flex items-center gap-2 text-xs font-bold text-gray-400 w-full hover:text-white transition-colors"><LogOut size={14} /> SAIR</button>
               <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-red-400 w-full hover:text-red-300 transition-colors"><LogOut size={14} className="rotate-180" /> FAZER LOGOUT</button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col h-screen overflow-hidden relative p-4 pl-0">
             <div className="flex-1 rounded-2xl glass-panel overflow-hidden flex flex-col border border-white/5 shadow-2xl relative">
                <div className="cyber-grid opacity-50 pointer-events-none"></div>
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050814]/30">
                   <h2 className="text-lg font-bold text-white flex items-center gap-2">{getHeaderTitle()} <Activity size={14} className="text-[#19e6ff] animate-pulse"/></h2>
                   <div className="flex items-center gap-3">
                     {/* Botão de Ajuste Manual */}
                     <button 
                       onClick={() => setIsManualModalOpen(true)}
                       className="px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all flex items-center gap-2 border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                     >
                       <Clipboard size={14} /> Ajuste Manual
                     </button>

                     <button 
                       onClick={() => handleSync('youtube')} 
                       className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all flex items-center gap-2 
                                   ${syncing ? 'bg-white/5 text-gray-400 cursor-not-allowed' : 'text-[#050814] bg-[#3bf5a5] hover:bg-[#2fc184]'}`}
                       disabled={syncing}
                     >
                       {syncing ? (
                         <span className="flex items-center gap-1">
                           <RefreshCw size={14} className="animate-spin" /> Sincronizando...
                         </span>
                       ) : (
                         <span className="flex items-center gap-1">
                           <RefreshCw size={14} /> Sincronizar Plataformas
                         </span>
                       )}
                     </button>
                   </div>
                </header>

                {activeTab === 'dashboard' && <DashboardView posts={posts} summary={summary} audience={audienceData} dailyData={dailyData} monthlyData={monthlyData} onDelete={handleDeletePost} 
                  monthlyStartDate={monthlyStartDate} setMonthlyStartDate={setMonthlyStartDate}
                  monthlyEndDate={monthlyEndDate} setMonthlyEndDate={setMonthlyEndDate}
                  postsPlatformFilter={postsPlatformFilter} setPostsPlatformFilter={setPostsPlatformFilter}
                  onGenerateReport={handleGenerateAiReport}
                />}
                {activeTab === 'biblioteca' && <BibliotecaView />}
                {activeTab === 'padroes' && <PadroesView />}
                {activeTab === 'ai_assistant' && <AIChatView mode="general" apiBaseUrl={API_BASE_URL} posts={posts} />}
                {activeTab === 'data_analytics' && <AIChatView mode="analytics" apiBaseUrl={API_BASE_URL} posts={posts} />}
             </div>

             {/* --- MODAL SELETOR DE DATA PARA IA --- */}
             {showDateRangePicker && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md animate-enter p-4" onClick={() => setShowDateRangePicker(false)}>
                    <div 
                        className="bg-[#0b1021] border border-[#19e6ff]/30 rounded-3xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(25,230,255,0.2)] relative"
                        onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar dentro
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#19e6ff]/10 rounded-2xl text-[#19e6ff]">
                                <CalendarIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Período da Análise</h3>
                                <p className="text-xs text-gray-500">A IA analisará apenas este intervalo.</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="relative z-20">
                                <label htmlFor="report-start-date" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Data Inicial</label>
                                <input 
                                    id="report-start-date"
                                    type="date" 
                                    value={reportDates.start} 
                                    onChange={e => setReportDates(prev => ({...prev, start: e.target.value}))} 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#19e6ff] outline-none transition-all cursor-pointer relative" 
                                />
                            </div>
                            <div className="relative z-10">
                                <label htmlFor="report-end-date" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Data Final</label>
                                <input 
                                    id="report-end-date"
                                    type="date" 
                                    value={reportDates.end} 
                                    onChange={e => setReportDates(prev => ({...prev, end: e.target.value}))} 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#19e6ff] outline-none transition-all cursor-pointer relative" 
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={() => setShowDateRangePicker(false)} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={confirmGenerateReport} className="bg-[#19e6ff] text-black px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(25,230,255,0.3)] flex items-center gap-2">
                                Gerar Relatório <Sparkles size={16}/>
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {/* --- MODAL DE RESULTADO DA IA (COM GRÁFICOS) --- */}
             <DataAnalyticsModal 
                isOpen={showAnalyticsModal} 
                onClose={() => setShowAnalyticsModal(false)} 
                data={analyticsData} 
                loading={isGeneratingReport} 
                allPosts={posts.filter(p => {
                    const pDate = new Date(p.published_at).getTime();
                    const start = new Date(reportDates.start).getTime();
                    const end = new Date(reportDates.end).getTime();
                    return pDate >= start && pDate <= end;
                })} // PASSANDO TODOS OS POSTS PARA O MODAL
             />

             <AddPostModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleCreatePost} />
             <ManualUpdateModal isOpen={isManualModalOpen} onClose={()=>setIsManualModalOpen(false)} onSave={handleManualSave} apiBaseUrl={API_BASE_URL} />
          </main>
        </div>
      )}
      </div> {/* Fecha Container Global */}

      {/* Notificação Global - Funciona em todas as telas */}
      {notification && (
        <CyberNotification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </>
  );
}