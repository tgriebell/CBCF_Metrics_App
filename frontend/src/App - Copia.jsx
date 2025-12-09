import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, Plus, Trash2, RefreshCw, LogOut, Video, Search, Filter,
  Eye, EyeOff, User, Lock, Sparkles, Wand2, Bot,
  TrendingUp, Calendar as CalendarIcon, Zap, Activity, ChevronLeft, ChevronRight,
  Heart, MessageCircle, Share2, Bookmark, Bell, Users, PlayCircle, Youtube, Instagram,
  Edit, Image as ImageIcon, X, Upload, ThumbsDown, UserPlus
} from 'lucide-react';

// --- CONFIGURAÇÃO DE CORES (REGRAS FINAIS) ---
const colors = {
  bg: '#050814',
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
    
    :root {
      --neon-green: #3bf5a5;
      --neon-blue: #19e6ff;
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-bg: rgba(5, 8, 20, 0.85);
    }

    body { 
      font-family: 'Inter', sans-serif; 
      background-color: #020715;
      margin: 0; 
      color: #e5f0ff; 
      overflow: hidden;
    }
    
    /* Grid Cibernético */
    .cyber-grid {
      position: absolute; inset: 0;
      background-size: 50px 50px;
      background-image: 
        linear-gradient(to right, rgba(25, 230, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(25, 230, 255, 0.03) 1px, transparent 1px);
      mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
      pointer-events: none; z-index: 0;
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
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
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
      box-shadow: 0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(59,245,165,0.05);
      position: relative; overflow: hidden;
    }
    
    .splash-logo-frame {
      background-color: #000;
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

// Splash Screen
const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      const increment = Math.max(1, (100 - current) / 10); 
      current += increment;
      if (current >= 99) { current = 100; clearInterval(interval); }
      setProgress(current);
    }, 50);
    const timer = setTimeout(onComplete, 3500);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [onComplete]);

  return (
    <main className="fixed inset-0 z-[9999] flex flex-col items-center justify-center splash-bg">
      <section className="splash-logo-card animate-enter">
        <div className="splash-logo-frame">
          <img src="/img/splash.png" alt="CBCF" className="w-[260px] h-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(59,245,165,0.15)]" />
          <div className="splash-loader-bar">
            <div className="bar-inner" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="mt-4 w-full flex justify-between text-[10px] font-bold tracking-[0.2em] text-[#3bf5a5] opacity-80 uppercase">
             <span>Inicializando</span>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'cbcfsafe') onLogin();
    else setError('Acesso negado.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020715]">
      <div className="cyber-grid opacity-40 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#3bf5a5] rounded-full mix-blend-screen filter blur-[150px] animate-breathe-subtle opacity-10 pointer-events-none"></div>
      
      <section className="w-full max-w-[400px] p-10 glass-panel rounded-2xl relative z-10 animate-enter border-t border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-[#3bf5a5]/30 bg-[#3bf5a5]/5 rounded-full text-[#3bf5a5] text-[10px] font-bold tracking-[0.2em]">ACESSO RESTRITO</div>
          <h1 className="text-3xl font-bold text-white mb-1">CBCF <span className="text-[#19e6ff]">Painel</span></h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-wider">Identificação</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-gray-500"/>
              <input type="text" value={user} onChange={e=>setUser(e.target.value)} className="w-full pl-12 py-3 rounded-xl input-future text-sm" placeholder="Usuário" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-wider">Chave</label>
             <div className="relative">
              <Lock size={16} className="absolute left-4 top-3.5 text-gray-500"/>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full pl-12 py-3 rounded-xl input-future text-sm" placeholder="••••••" />
            </div>
          </div>
          {error && <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>}
          <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest btn-neon mt-2">Entrar</button>
        </form>
      </section>
    </div>
  );
};

// --- DADOS MOCKADOS ---
const SUBSCRIBERS_GROWTH = [
  { name: 'Jan', shorts: 1200, youtube: 5000, tiktok: 8000, instagram: 4000 },
  { name: 'Fev', shorts: 1500, youtube: 5200, tiktok: 12000, instagram: 4500 },
  { name: 'Mar', shorts: 2200, youtube: 5500, tiktok: 15000, instagram: 4800 },
  { name: 'Abr', shorts: 3000, youtube: 5900, tiktok: 22000, instagram: 5100 },
  { name: 'Mai', shorts: 4500, youtube: 6500, tiktok: 28000, instagram: 6000 },
  { name: 'Jun', shorts: 5200, youtube: 7000, tiktok: 35000, instagram: 6500 },
  { name: 'Jul', shorts: 6800, youtube: 7800, tiktok: 42000, instagram: 7000 },
  { name: 'Ago', shorts: 8000, youtube: 8500, tiktok: 50000, instagram: 7500 },
  { name: 'Set', shorts: 9500, youtube: 9200, tiktok: 65000, instagram: 8200 },
  { name: 'Out', shorts: 11000, youtube: 10500, tiktok: 75000, instagram: 9000 },
  { name: 'Nov', shorts: 12500, youtube: 11500, tiktok: 88000, instagram: 10000 },
  { name: 'Dez', shorts: 15000, youtube: 12800, tiktok: 95000, instagram: 11500 },
  { name: 'Jan', shorts: 18000, youtube: 14000, tiktok: 105000, instagram: 13000 },
];

const MOCK_DAILY_PLATFORM_GROWTH = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  shorts: Math.floor(Math.random() * 50) + 10,
  youtube: Math.floor(Math.random() * 30) + 5,
  tiktok: Math.floor(Math.random() * 100) + 20,
  instagram: Math.floor(Math.random() * 60) + 15,
}));

// --- CARD DE AUDIÊNCIA ---
const AudienceCard = ({ title, count, growth, imgSrc, color, delay }) => {
  return (
    <div className={`p-5 rounded-xl glass-panel relative overflow-hidden group hover:border-[${color}]/30 transition-all duration-500 animate-enter ${delay}`}>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-8 h-8 rounded-lg bg-white/5 p-1.5 flex items-center justify-center border border-white/10">
                <img src={imgSrc} alt={title} className="w-full h-full object-contain" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</span>
          </div>
          <div className="text-2xl font-bold text-white">{count}</div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold" style={{ color: colors.primary }}>
            <TrendingUp size={12} />
            +{growth} este mês
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 scale-150 blur-sm pointer-events-none">
           <img src={imgSrc} className="w-24 h-24" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ backgroundColor: color, opacity: 0.5 }}></div>
    </div>
  );
};

// --- KPI CARD (METAS) ---
const PostGoalCard = ({ title, current, goal, color }) => {
  const isOff = goal === 'Off';
  const numericGoal = typeof goal === 'number' ? goal : 1;
  const progress = isOff ? 0 : (current / numericGoal) * 100;
  const isMet = !isOff && current >= numericGoal;
  
  return (
    <div className="p-4 rounded-xl bg-[#0a0f1f]/60 border border-white/5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-3">
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
         <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isMet ? 'bg-[#3bf5a5]/20 text-[#3bf5a5]' : (isOff ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-500')}`}>
           {isOff ? 'DIA OFF' : (isMet ? 'META OK' : 'PENDENTE')}
         </span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-2xl font-bold text-white">{current}</span>
        <span className="text-xs text-gray-500 mb-1">/ {goal} posts</span>
      </div>
      <div className="h-1.5 w-full bg-[#050814] rounded-full overflow-hidden">
         <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
};

// --- HELPER DE MÉTRICAS ---
const MetricItem = ({ icon: Icon, value, label, color }) => (
  <div className="flex flex-col items-center w-16">
    <div className="flex items-center gap-1 text-gray-400 mb-1">
      <Icon size={14} style={{ color: color }} />
    </div>
    <span className="text-xs font-bold text-gray-200">{value ? value.toLocaleString() : 0}</span>
    <span className="text-[9px] text-gray-600 uppercase text-center leading-tight">{label}</span>
  </div>
);

// --- POST ROW (LÓGICA DETALHADA POR PLATAFORMA) ---
const PostRow = ({ post, onEdit, onDelete }) => {
  let badgeColor = '#888';
  let PlatformIcon = Video;
  let platformLabel = 'Video';

  if (post.platform.includes('youtube_shorts')) {
    badgeColor = colors.shorts; 
    PlatformIcon = () => <img src="/img/youtubeshorts.png" className="w-4 h-4" />;
    platformLabel = 'Shorts';
  } else if (post.platform.includes('youtube_long')) {
    badgeColor = colors.youtube;
    PlatformIcon = () => <img src="/img/youtube.png" className="w-4 h-4" />;
    platformLabel = 'Longo';
  } else if (post.platform.includes('tiktok')) {
    badgeColor = colors.tiktok;
    PlatformIcon = () => <img src="/img/tiktok.png" className="w-4 h-4" />;
    platformLabel = 'TikTok';
  } else if (post.platform.includes('instagram')) {
    badgeColor = colors.instagram;
    PlatformIcon = () => <img src="/img/instagram.png" className="w-4 h-4" />;
    platformLabel = 'Reels';
  }

  // Lógica de Métricas Específicas Solicitada
  const renderMetrics = () => {
    // TikTok: Curtidas, Comentarios, Compartilhamento, Salvamentos
    if (post.platform.includes('tiktok')) {
      return [
        <MetricItem key="l" icon={Heart} value={post.likes} label="Curtidas" color="#ff5578" />,
        <MetricItem key="c" icon={MessageCircle} value={post.comments} label="Coment." color="#19e6ff" />,
        <MetricItem key="sh" icon={Share2} value={post.shares} label="Comp." color="#a78bfa" />,
        <MetricItem key="sv" icon={Bookmark} value={post.saves} label="Salvos" color="#f472b6" />
      ];
    }
    
    // Shorts: Curtidas, Nao gostei, Comentarios, Compartilhamento, Se inscreveu
    if (post.platform.includes('youtube_shorts')) {
      return [
        <MetricItem key="l" icon={Heart} value={post.likes} label="Curtidas" color="#ff5578" />,
        <MetricItem key="dl" icon={ThumbsDown} value={post.dislikes || 0} label="Ñ Gostei" color="#64748b" />,
        <MetricItem key="c" icon={MessageCircle} value={post.comments} label="Coment." color="#19e6ff" />,
        <MetricItem key="sh" icon={Share2} value={post.shares} label="Comp." color="#a78bfa" />,
        <MetricItem key="sub" icon={UserPlus} value={post.subs || 0} label="+Insc." color="#3bf5a5" />
      ];
    }

    // Longo: Curtidas, Nao gostei, Comentarios, Compartilhamento, Se inscreveu, Sininho
    if (post.platform.includes('youtube_long')) {
      return [
        <MetricItem key="l" icon={Heart} value={post.likes} label="Curtidas" color="#ff5578" />,
        <MetricItem key="dl" icon={ThumbsDown} value={post.dislikes || 0} label="Ñ Gostei" color="#64748b" />,
        <MetricItem key="c" icon={MessageCircle} value={post.comments} label="Coment." color="#19e6ff" />,
        <MetricItem key="sh" icon={Share2} value={post.shares} label="Comp." color="#a78bfa" />,
        <MetricItem key="sub" icon={UserPlus} value={post.subs || 0} label="+Insc." color="#3bf5a5" />,
        <MetricItem key="bell" icon={Bell} value={post.bells || 0} label="Sininho" color="#fbbf24" />
      ];
    }

    // Insta: Curtidas, Comentarios, Compartilhamento, Salvamentos
    if (post.platform.includes('instagram')) {
      return [
        <MetricItem key="l" icon={Heart} value={post.likes} label="Curtidas" color="#ff5578" />,
        <MetricItem key="c" icon={MessageCircle} value={post.comments} label="Coment." color="#19e6ff" />,
        <MetricItem key="sh" icon={Share2} value={post.shares} label="Comp." color="#a78bfa" />,
        <MetricItem key="sv" icon={Bookmark} value={post.saves} label="Salvos" color="#f472b6" />
      ];
    }
    
    // Fallback Genérico
    return [
      <MetricItem key="l" icon={Heart} value={post.likes} label="Curtidas" color="#ff5578" />,
      <MetricItem key="c" icon={MessageCircle} value={post.comments} label="Coment." color="#19e6ff" />
    ];
  };

  return (
    <div className="group flex items-center justify-between p-4 mb-3 rounded-xl glass-panel hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
      <div className="flex items-center gap-4 min-w-[250px]">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 bg-[#0a0f1f]">
           {post.cover_image ? <img src={post.cover_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Video size={20} className="text-gray-700" /></div>}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PlatformIcon />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase tracking-wide border border-white/5" style={{ color: badgeColor }}>
              {platformLabel}
            </span>
          </div>
          <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-[#3bf5a5] transition-colors">{post.title}</h4>
          <span className="text-[10px] text-gray-600">{new Date(post.date).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-center">
        {renderMetrics()}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(post)} className="p-2 rounded hover:bg-[#19e6ff]/10 text-[#19e6ff] transition-colors"><Edit size={16} /></button>
        <button onClick={() => onDelete(post.id)} className="p-2 rounded hover:bg-red-500/10 text-red-400 transition-colors"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

// --- DASHBOARD VIEW ---
const DashboardView = ({ posts, summary }) => {
  const [platform, setPlatform] = useState('all');
  const [metric, setMetric] = useState('views'); 

  // Filtro para o gráfico
  const getChartLines = () => {
    if (platform === 'all') {
      return [
        <Area key="tt" type="monotone" dataKey="tiktok" name="TikTok" stroke={colors.tiktok} fill="url(#gradTikTok)" strokeWidth={2} />,
        <Area key="yt" type="monotone" dataKey="youtube" name="YouTube" stroke={colors.youtube} fill="url(#gradYouTube)" strokeWidth={2} />,
        <Area key="sh" type="monotone" dataKey="shorts" name="Shorts" stroke={colors.shorts} fill="url(#gradShorts)" strokeWidth={2} strokeDasharray="5 5" />,
        <Area key="ig" type="monotone" dataKey="instagram" name="Instagram" stroke={colors.instagram} fill="url(#gradInsta)" strokeWidth={2} />
      ];
    }
    const colorMap = { youtube_long: colors.youtube, youtube_shorts: colors.shorts, tiktok: colors.tiktok, instagram: colors.instagram };
    const dataKeyMap = { youtube_long: 'youtube', youtube_shorts: 'shorts', tiktok: 'tiktok', instagram: 'instagram' };
    
    return <Area type="monotone" dataKey={dataKeyMap[platform]} stroke={colorMap[platform]} fill={`url(#grad${platform === 'youtube_long' ? 'YouTube' : (platform === 'youtube_shorts' ? 'Shorts' : (platform === 'tiktok' ? 'TikTok' : 'Insta'))})`} strokeWidth={3} />;
  };

  const instaTotal = posts.filter(p => p.platform.includes('instagram')).reduce((acc, curr) => ({
    views: acc.views + (curr.views || 0),
    likes: acc.likes + (curr.likes || 0),
    comments: acc.comments + (curr.comments || 0)
  }), { views: 0, likes: 0, comments: 0 });

  const day = new Date().getDay();
  const ytLongGoal = (day === 2 || day === 4) ? 1 : 'Off';

  const getButtonColor = (p) => {
    if (p === 'all') return colors.primary; 
    if (p === 'tiktok') return colors.tiktok;
    if (p === 'instagram') return colors.instagram;
    if (p === 'youtube_shorts') return colors.shorts;
    if (p === 'youtube_long') return colors.youtube;
    return colors.secondary;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll animate-enter">
      
      <div className="flex items-center justify-center gap-4 mb-4">
        {['all', 'youtube_shorts', 'youtube_long', 'tiktok', 'instagram'].map(p => {
           const buttonColor = getButtonColor(p);
           return (
             <button 
               key={p} 
               onClick={() => setPlatform(p)}
               className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                 platform === p 
                 ? `bg-white/10 text-white` 
                 : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
               }`}
               style={{ 
                 borderColor: platform === p ? buttonColor : 'transparent',
                 color: platform === p ? buttonColor : undefined
               }}
             >
               {p === 'all' ? 'Visão Geral' : (p === 'youtube_shorts' ? 'YT Shorts' : (p === 'youtube_long' ? 'YT Longo' : p))}
             </button>
           );
        })}
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">Audiência & Crescimento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={platform === 'all' || platform === 'youtube_shorts' ? '' : 'opacity-30 grayscale'}>
             <AudienceCard title="YouTube Shorts" count="12.5K" growth="140" imgSrc="/img/youtubeshorts.png" color={colors.shorts} delay="delay-1" />
          </div>
          <div className={platform === 'all' || platform === 'youtube_long' ? '' : 'opacity-30 grayscale'}>
             <AudienceCard title="YouTube Principal" count="45.2K" growth="85" imgSrc="/img/youtube.png" color={colors.youtube} delay="delay-2" />
          </div>
          <div className={platform === 'all' || platform === 'tiktok' ? '' : 'opacity-30 grayscale'}>
             <AudienceCard title="TikTok" count="120K" growth="1.2K" imgSrc="/img/tiktok.png" color={colors.tiktok} delay="delay-3" />
          </div>
          <div className={platform === 'all' || platform === 'instagram' ? '' : 'opacity-30 grayscale'}>
             <AudienceCard title="Instagram" count="28.4K" growth="320" imgSrc="/img/instagram.png" color={colors.instagram} delay="delay-3" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl glass-panel relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2 text-white text-sm uppercase tracking-wider">
              <TrendingUp size={16} className="text-[#3bf5a5]" /> 
              {platform === 'all' ? 'Crescimento de Inscritos (Jan - Jan)' : 'Performance da Plataforma'}
            </h3>
            {platform !== 'all' && (
               <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                  {['views', 'likes', 'comments'].map(m => (
                    <button key={m} onClick={()=>setMetric(m)} className={`px-3 py-1 text-[10px] uppercase font-bold rounded ${metric === m ? 'bg-white/10 text-white' : 'text-gray-500'}`}>
                      {m}
                    </button>
                  ))}
               </div>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SUBSCRIBERS_GROWTH} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTikTok" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.tiktok} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.tiktok} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gradYouTube" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.youtube} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.youtube} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gradShorts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.shorts} stopOpacity={0.1}/><stop offset="95%" stopColor={colors.shorts} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gradInsta" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.instagram} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.instagram} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']} hide={true} />
                <Tooltip content={<CustomTooltip />} />
                {getChartLines()}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Metas de Hoje</h3>
          {(platform === 'all' || platform === 'youtube_shorts') && <PostGoalCard title="Shorts (Diário)" current={summary.shorts.current} goal={summary.shorts.goal} color={colors.shorts} />}
          {(platform === 'all' || platform === 'tiktok') && <PostGoalCard title="TikTok (Diário)" current={summary.tiktok.current} goal={summary.tiktok.goal} color={colors.tiktok} />}
          {(platform === 'all' || platform === 'youtube_long') && <PostGoalCard title="YouTube Longo" current={summary.youtube_long.current} goal={ytLongGoal} color={colors.youtube} />}
        </div>
      </div>
      
      {/* GRÁFICO DE CRESCIMENTO DIÁRIO (DIA 1-31) - BARRAS LADO A LADO */}
      {platform === 'all' && (
        <div className="p-6 rounded-xl glass-panel relative border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Activity size={16} className="text-[#3bf5a5]" /> Crescimento Diário (Mês Atual)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DAILY_PLATFORM_GROWTH} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                {/* BARRAS AGRUPADAS (Sem stackId) */}
                <Bar dataKey="shorts" name="Shorts" fill={colors.shorts} radius={[2, 2, 0, 0]} />
                <Bar dataKey="youtube" name="YouTube" fill={colors.youtube} radius={[2, 2, 0, 0]} />
                <Bar dataKey="tiktok" name="TikTok" fill={colors.tiktok} radius={[2, 2, 0, 0]} />
                <Bar dataKey="instagram" name="Instagram" fill={colors.instagram} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {platform === 'instagram' && (
        <div className="grid grid-cols-3 gap-4 animate-enter">
           <div className="p-6 rounded-xl glass-panel text-center">
              <div className="text-3xl font-bold text-white mb-1">{instaTotal.views.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-[#E1306C] uppercase tracking-wider">Views Totais</div>
           </div>
           <div className="p-6 rounded-xl glass-panel text-center">
              <div className="text-3xl font-bold text-white mb-1">{instaTotal.likes.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-[#E1306C] uppercase tracking-wider">Curtidas</div>
           </div>
           <div className="p-6 rounded-xl glass-panel text-center">
              <div className="text-3xl font-bold text-white mb-1">{instaTotal.comments.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-[#E1306C] uppercase tracking-wider">Comentários</div>
           </div>
        </div>
      )}

      <section>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
          <Zap size={16} className="text-[#19e6ff]" /> Últimas Publicações
        </h3>
        <div className="space-y-2">
          {posts
            .filter(p => platform === 'all' || p.platform.includes(platform))
            .map(post => (
               <PostRow key={post.id} post={post} onEdit={()=>{}} onDelete={() => {}} />
          ))}
        </div>
      </section>
    </div>
  );
};

// --- CALENDÁRIO ---
const CalendarView = ({ posts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  
  const days = getDaysInMonth(currentDate);
  const startDay = getFirstDay(currentDate);
  
  return (
    <div className="flex-1 p-6 animate-enter h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white capitalize flex items-center gap-3">
          <CalendarIcon className="text-[#3bf5a5]" /> 
          {currentDate.toLocaleString('pt-BR', { month: 'long' })} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white"><ChevronLeft/></button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white"><ChevronRight/></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto">
        {Array.from({ length: startDay }).map((_,i)=><div key={`e-${i}`}/>)}
        {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const dayPosts = posts.filter(p => new Date(p.date).getDate() === d && new Date(p.date).getMonth() === currentDate.getMonth());
            return (
              <div key={d} className="min-h-[80px] glass-panel rounded p-2 border-white/5 relative hover:bg-white/5">
                <span className="text-xs text-gray-500 absolute top-1 right-2">{d}</span>
                <div className="mt-4 space-y-1">
                  {dayPosts.map((p,idx)=>(<div key={idx} className="text-[8px] p-1 rounded bg-[#3bf5a5]/20 text-[#3bf5a5] truncate">{p.title}</div>))}
                </div>
              </div>
            )
        })}
      </div>
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
                 <div className="grid grid-cols-2 gap-3">
                    {['youtube_shorts', 'tiktok', 'instagram', 'youtube_long'].map(p => (
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

const AIAssistantModal = ({ isOpen, onClose }) => {
  const [res, setRes] = useState('');
  const [loading, setLoading] = useState(false);
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
       <div className="w-full max-w-md p-6 glass-panel rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4 flex gap-2"><Sparkles className="text-[#19e6ff]"/> IA Gemini</h2>
          <textarea className="w-full h-32 bg-[#050814] border border-white/10 text-white p-3 rounded" placeholder="Ideia para..." />
          <div className="flex justify-end gap-2 mt-4">
             <button onClick={onClose} className="text-gray-400 px-4">Fechar</button>
             <button className="bg-[#19e6ff] text-black px-4 py-2 rounded font-bold">Gerar</button>
          </div>
       </div>
    </div>
  )
}

// --- APP ---
const MOCK_POSTS = [
  { id: 1, platform: 'youtube_shorts', title: 'Rino: O que não te contam', views: 12500, likes: 1200, comments: 45, shares: 30, date: '2023-10-24' },
  { id: 2, platform: 'tiktok', title: 'Antes e Depois Incrível', views: 45000, likes: 3400, comments: 120, shares: 500, saves: 200, date: '2023-10-24' },
];
const MOCK_SUMMARY = { shorts: { current: 2, goal: 5 }, tiktok: { current: 4, goal: 5 }, youtube_long: { current: 0, goal: 1 }, instagram: { current: 0, goal: 0 } };

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState(MOCK_SUMMARY);

  const fetchData = async () => {
     try {
       const r = await fetch('http://127.0.0.1:8000/posts');
       if(!r.ok) throw new Error('Offline');
       setPosts(await r.json());
     } catch(e) { setPosts(MOCK_POSTS); }
  };

  useEffect(() => { if(screen==='app') fetchData(); }, [screen]);

  const handleCreatePost = async (newPost) => {
    setPosts([{ ...newPost, id: Math.random(), date: new Date().toISOString(), views: 0 }, ...posts]);
    setIsModalOpen(false);
  };

  return (
    <>
      <GlobalStyles />
      {screen === 'splash' && <SplashScreen onComplete={() => setScreen('login')} />}
      {screen === 'login' && <LoginScreen onLogin={() => setScreen('app')} />}
      {screen === 'app' && (
        <div className="flex h-screen overflow-hidden bg-transparent">
          <div className="cyber-grid opacity-10 pointer-events-none"></div>
          <aside className="w-64 flex-shrink-0 flex flex-col glass-panel border-r-0 m-4 rounded-2xl relative z-20">
            <div className="p-6">
               <h1 className="text-xl font-bold text-white italic">CBCF <span className="text-[#3bf5a5]">METRICS</span></h1>
               <p className="text-[9px] text-gray-500 mt-1 uppercase">Pro v2.0</p>
            </div>
            <nav className="flex-1 px-3 space-y-2">
               <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold border transition-all ${activeTab==='dashboard' ? 'bg-[#19e6ff]/10 text-white border-[#19e6ff]/20' : 'text-gray-400 border-transparent hover:bg-white/5'}`}>
                 <LayoutDashboard size={18} className={activeTab==='dashboard'?"text-[#19e6ff]":""} /> <span className="text-sm">Visão Geral</span>
               </button>
               <button onClick={() => setIsAIModalOpen(true)} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                 <Sparkles size={18} className="text-[#3bf5a5] group-hover:animate-pulse" /> <span className="text-sm">Assistente IA</span>
               </button>
               <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold border transition-all ${activeTab==='calendar' ? 'bg-[#19e6ff]/10 text-white border-[#19e6ff]/20' : 'text-gray-400 border-transparent hover:bg-white/5'}`}>
                 <CalendarIcon size={18} className={activeTab==='calendar'?"text-purple-400":""} /> <span className="text-sm">Calendário</span>
               </button>
            </nav>
            <div className="p-5 border-t border-white/5">
               <button onClick={() => setScreen('login')} className="flex items-center gap-2 text-xs font-bold text-red-400 w-full"><LogOut size={14} /> SAIR</button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col h-screen overflow-hidden relative p-4 pl-0">
             <div className="flex-1 rounded-2xl glass-panel overflow-hidden flex flex-col border border-white/5 shadow-2xl relative">
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050814]/30">
                   <h2 className="text-lg font-bold text-white flex items-center gap-2">{activeTab === 'dashboard' ? 'Dashboard' : 'Calendário'} <Activity size={14} className="text-[#19e6ff] animate-pulse"/></h2>
                   <button onClick={()=>setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs text-[#050814] bg-[#19e6ff] hover:bg-[#15c2db] uppercase"><Plus size={16}/> Nova Postagem</button>
                </header>

                {activeTab === 'dashboard' && <DashboardView posts={posts} summary={summary} />}
                {activeTab === 'calendar' && <CalendarView posts={posts} />}
             </div>
             <AddPostModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleCreatePost} />
             <AIAssistantModal isOpen={isAIModalOpen} onClose={()=>setIsAIModalOpen(false)} />
          </main>
        </div>
      )}
    </>
  );
}