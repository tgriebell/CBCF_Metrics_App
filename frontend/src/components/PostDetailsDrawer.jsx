import React, { useEffect, useState } from 'react';
import {
  X, ExternalLink, Calendar, TrendingUp,
  Eye, Heart, MessageCircle, Share2, Clock, Percent,
  Sparkles, CheckCircle, AlertTriangle, PlayCircle, Bookmark, Loader,
  Target, ArrowRight, Diamond, BrainCircuit, Users, ShieldAlert, Lightbulb, AlertCircle, ThumbsUp, ThumbsDown, Star, Search, BarChart, FileText, Layers, MessageSquare, Play, Youtube, Megaphone, Compass
} from 'lucide-react';
import StrategicReportModal from './StrategicReportModal';

const API_BASE_URL = 'https://127.0.0.1:8000';

// --- Brand Colors ---
const BRAND = {
  primary: '#3bf5a5',   // Neon Green
  secondary: '#19e6ff', // Cyan
  bg: '#050814',        // Deep Dark Blue
  card: '#0f172a',      // Slate 900
  text: '#e2e8f0',      // Slate 200
  accent: '#8b5cf6'     // Violet (for viral loops)
};

// --- Helper Functions ---
const formatDuration = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  return [m, s].map(v => v.toString().padStart(2, '0')).join(':');
};

const formatLargeNumber = (input) => {
    const num = parseInt(input, 10);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toLocaleString('pt-BR');
};

const formatDate = (dateString) => {
    if (!dateString) return 'Data desconhecida';
    return new Date(dateString).toLocaleDateString('pt-BR', { 
        day: '2-digit', month: 'short', year: 'numeric' 
    });
};

// --- Sub-components ---
const MetricItem = ({ icon: Icon, label, value, classification, subValue, iconColor = BRAND.primary, textColor = "text-white" }) => (
    <div className="bg-slate-800/40 p-3 lg:p-4 rounded-xl flex items-center justify-between border border-slate-700/50 hover:border-slate-600 transition-colors group shadow-lg shadow-black/20 overflow-hidden min-h-[80px]">
        <div className="flex items-center gap-3 w-full">
            <div className={`p-2 rounded-lg bg-slate-800/80 group-hover:bg-slate-700 transition-colors shadow-inner flex-shrink-0 self-start mt-1`}>
                <Icon size={18} style={{ color: iconColor }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 truncate">{label}</p>
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <p className={`text-xl font-bold leading-tight ${textColor}`}>{value}</p>
                        {classification && (
                             <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor} opacity-80`}>{classification}</span>
                        )}
                    </div>
                    {subValue && (
                        <span className="text-[9px] font-medium text-[#3bf5a5] mt-1 w-fit max-w-full break-words leading-tight opacity-90">
                            {subValue}
                        </span>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const ActionButton = ({ label, icon: Icon, onClick, primary = false }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 group active:scale-[0.98]
        ${primary 
            ? 'bg-[#3bf5a5] text-black hover:bg-[#32d48f] shadow-lg shadow-[#3bf5a5]/20'
            : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600'
        }`}
    >
        <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className={primary ? "text-black" : "text-[#3bf5a5]"} />}
            <span className="text-sm">{label}</span>
        </div>
        <ArrowRight size={14} className={`opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${primary ? "text-black" : "text-slate-400"}`} />
    </button>
);

// --- Actions Configuration ---
const ACTIONS_CONFIG = {
    'optimize_cta': { label: 'Otimizar Conversão (CTA)', icon: Target, color: '#facc15' }, // Yellow
    'replicate_format': { label: 'Replicar o que Funcionou', icon: TrendingUp, color: '#3bf5a5' }, // Green
    'improve_hook': { label: 'Melhorar Hook (3s)', icon: Sparkles, color: '#f43f5e' }, // Red/Rose
    'community_engage': { label: 'Responder Comentários (Aquecer)', icon: MessageCircle, color: '#a78bfa' }, // Purple
    'update_thumbnail': { label: 'Testar Nova Thumbnail', icon: Eye, color: '#fb923c' } // Orange
};

const PostDetailsDrawer = ({ isOpen, onClose, post }) => {
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false); // New state
  const [analytics, setAnalytics] = useState(null);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);
  const [isPattern, setIsPattern] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      fetchDetails();
      setIsPattern(post.is_pattern || false); // Set initial state from post prop if available
    } else {
      setAnalytics(null);
      setInsight(null);
      setError(null);
      setIsPattern(false);
    }
  }, [isOpen, post]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    setInsight(null); // Reset insight on new fetch
    
    // Allow youtube AND tiktok
    if (!post.platform?.includes('youtube') && !post.platform?.includes('tiktok')) {
        setLoading(false);
        return; 
    }

    try {
        const analyticsRes = await fetch(`${API_BASE_URL}/api/posts/${post.id}/analytics`);
        if (!analyticsRes.ok) throw new Error('Erro ao buscar métricas.');
        const analyticsData = await analyticsRes.json();
        
        console.log("DEBUG ANALYTICS DRAWER:", analyticsData); // DEBUG

        if (analyticsData.message || analyticsData.error) throw new Error(analyticsData.message);
        setAnalytics(analyticsData);
        
        // Insight is NO LONGER fetched automatically here.
        // It must be triggered manually by the user.

    } catch (err) {
        console.error(err);
        setError(err.message || 'Falha ao carregar detalhes.');
    } finally {
        setLoading(false);
    }
  };

  const generateInsight = async () => {
      if (!post || !analytics) return;
      
      setInsightLoading(true); // New local state for insight loading
      try {
        const insightRes = await fetch(`${API_BASE_URL}/api/posts/${post.id}/insight`, { method: 'POST' });
        if (insightRes.ok) {
            const insightData = await insightRes.json();
            setInsight(insightData);
        }
      } catch (err) {
          console.error("Erro ao gerar insight:", err);
          // Optionally handle insight error separately
      } finally {
          setInsightLoading(false);
      }
  };

  const handleAction = (actionName) => {
      alert(`Ação Iniciada: ${actionName}\n\n(Em breve: A IA processará este pedido)`);
  };

  const handleTogglePattern = async () => {
      try {
          const response = await fetch(`${API_BASE_URL}/api/posts/${post.id}/toggle_pattern`, { method: 'POST' });
          if (response.ok) {
              const data = await response.json();
              setIsPattern(data.is_pattern);
          }
      } catch (err) {
          console.error("Erro ao salvar padrão:", err);
      }
  };

  if (!isOpen) return null;

  // --- Derived Metrics & Logic ---
  const isYoutubeLong = post?.platform === 'youtube_long';
  const isTikTok = post?.platform === 'tiktok';
  
  // Prioritize detailed analytics, fallback to post.metrics (card data)
  const views = analytics?.views ?? analytics?.stats?.views ?? post?.metrics?.views ?? 0;
  const likes = analytics?.likes ?? analytics?.stats?.likes ?? post?.metrics?.likes ?? 0;
  const comments = analytics?.comments ?? analytics?.stats?.comments ?? post?.metrics?.comments ?? 0;
  const shares = analytics?.shares ?? analytics?.stats?.shares ?? post?.metrics?.shares ?? 0;
  const subsGained = analytics?.subscribersGained ?? 0;
  const avgViewPct = analytics?.averageViewPercentage ?? 0;
  
  // Theme Color based on content type
  let themeColor = BRAND.secondary; // Default Cyan (Shorts)
  if (isYoutubeLong) themeColor = '#ff0000';
  if (isTikTok) themeColor = '#ffffff'; // White/Black for TikTok

  const themeGlow = `0 0 20px ${themeColor}20`; // Soft glow

  // Conversion Rate Calculation
  const cRateVal = views > 0 ? (subsGained / views) * 100 : 0;
  const conversionRate = cRateVal.toFixed(2);
  
  let convLabel = "Baixa";
  let convColor = "text-red-500";
  
  if (cRateVal >= 5.0) { convLabel = "Fenomenal"; convColor = "text-purple-400"; }
  else if (cRateVal >= 3.0) { convLabel = "Alta"; convColor = "text-[#3bf5a5]"; }
  else if (cRateVal >= 1.0) { convLabel = "Média"; convColor = "text-yellow-400"; }
  
  // Human readable explanation (e.g., "1 sub / 900 views")
  const viewsPerSub = subsGained > 0 ? Math.round(views / subsGained) : 0;
  const convExplanation = subsGained > 0 ? `1 inscrito a cada ${formatLargeNumber(viewsPerSub)} views` : "Sem conversão";

  // Engagement Rate Calculation
  const totalInteractions = likes + comments + shares;
  const engagementRate = views > 0 ? ((totalInteractions / views) * 100).toFixed(1) : "0.0";

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity flex items-center justify-center p-4 animate-fade-in"
      >
        {/* Modal Window (Centered) */}
        <div 
            className="w-full max-w-7xl bg-[#0a0f1f] border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-scale-in"
            style={{ borderColor: `${themeColor}40`, boxShadow: themeGlow }} // Dynamic Border
            onClick={(e) => e.stopPropagation()}
        >
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0f1f] relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }} />

                <div className="flex items-center gap-4">
                    <div 
                        className="p-2 rounded-xl flex items-center justify-center shadow-lg border border-white/5"
                        style={{ backgroundColor: `${themeColor}10`, color: themeColor }}
                    >
                        {post?.platform?.includes('shorts') ? <TrendingUp size={20} /> : <PlayCircle size={20} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none tracking-tight">Análise de Performance</h3>
                        <p className="text-[10px] font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                            Sincronizado via YouTube Studio
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scroll">
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN (Video Identity & Key Stats) - Span 4 */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Video Card */}
                        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative group">
                             <div className="aspect-[9/16] lg:aspect-video w-full bg-black relative">
                                {post?.thumbnail_url ? (
                                    <img src={post.thumbnail_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-500" alt="Thumb" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><PlayCircle className="text-slate-600" size={48} /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                
                                {/* Badge */}
                                <div className="absolute top-3 left-3">
                                    <span 
                                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-lg backdrop-blur-md"
                                        style={{ backgroundColor: `${themeColor}20`, borderColor: `${themeColor}50`, color: themeColor }}
                                    >
                                        {isYoutubeLong ? 'Vídeo Longo' : 'Shorts'}
                                    </span>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4">
                                     <h2 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-1 drop-shadow-md" title={post?.title}>
                                        {post?.title}
                                    </h2>
                                    <span className="flex items-center gap-1 text-[10px] text-slate-300 font-mono"><Calendar size={10} /> {formatDate(post?.published_at)}</span>
                                </div>
                                
                                <a href={post?.url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full border border-white/20 text-white shadow-2xl hover:scale-110 transition-transform">
                                        <ExternalLink size={24} />
                                    </div>
                                </a>
                             </div>
                             
                             <div className="p-4 border-t border-slate-800 bg-[#0f1422]">
                                <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed italic">
                                    {post?.description || "Sem descrição disponível."}
                                </p>
                             </div>
                        </div>

                        {/* Seção de Inteligência IA */}
                        <div className="space-y-4">
                             <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 flex flex-col gap-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#3bf5a5]/5 rounded-full blur-2xl group-hover:bg-[#3bf5a5]/10 transition-all" />
                                
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <BrainCircuit size={14} className="text-[#3bf5a5]" /> Inteligência Artificial
                                </h4>
                                
                                {!insight ? (
                                    <button 
                                        onClick={generateInsight}
                                        disabled={insightLoading}
                                        className="w-full flex items-center justify-center gap-3 bg-[#3bf5a5]/5 hover:bg-[#3bf5a5]/10 text-[#3bf5a5] border border-[#3bf5a5]/30 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                    >
                                        {insightLoading ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                        {insightLoading ? "Analisando Dados..." : "Gerar Relatório Estratégico"}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsReportOpen(true)}
                                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#3bf5a5] to-[#19e6ff] text-black border-none py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_25px_rgba(59,245,165,0.4)]"
                                    >
                                        <BrainCircuit size={18} />
                                        Ver Relatório Profissional
                                    </button>
                                )}
                             </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA (Métricas Detalhadas) */}
                    <div className="lg:col-span-8 space-y-5">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
                                <Loader size={40} className="animate-spin mb-4" style={{ color: themeColor }} />
                                <p className="text-sm font-medium text-slate-400">Processando métricas profundas...</p>
                            </div>
                        ) : error ? (
                             <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center">
                                 <AlertTriangle className="mx-auto text-red-400 mb-3" size={40} />
                                <p className="text-base text-red-300 font-bold mb-1">Não foi possível carregar os dados</p>
                                <p className="text-sm text-red-400/70">{error}</p>
                            </div>
                        ) : analytics ? (
                            <>
                                {/* Main Stats Grid - 3 Columns */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <MetricItem 
                                        icon={Eye} 
                                        label="Visualizações" 
                                        value={formatLargeNumber(views)} 
                                        iconColor={themeColor} 
                                    />
                                    <MetricItem 
                                        icon={Target} 
                                        label="Conversão (Inscritos)" 
                                        value={`${conversionRate}%`} 
                                        classification={convLabel}
                                        subValue={convExplanation}
                                        iconColor={BRAND.primary}
                                        textColor={convColor}
                                    />
                                    <MetricItem 
                                        icon={TrendingUp} 
                                        label="Engajamento" 
                                        value={`${engagementRate}%`}
                                        subValue="Interações/Views"
                                        iconColor="#fbbf24" // Amber 400
                                    />
                                    <MetricItem 
                                        icon={Heart} 
                                        label="Likes" 
                                        value={formatLargeNumber(likes)} 
                                        iconColor="#f43f5e" 
                                    />
                                    <MetricItem 
                                        icon={MessageCircle} 
                                        label="Comentários" 
                                        value={formatLargeNumber(comments)} 
                                        iconColor="#a78bfa" 
                                    />
                                    <MetricItem 
                                        icon={Share2} 
                                        label="Compartilhamentos" 
                                        value={formatLargeNumber(shares)} 
                                        iconColor="#3b82f6" 
                                    />
                                </div>

                                {/* Retention Section (Redesigned) - Only show if data exists AND not TikTok */}
                                {avgViewPct > 0 && !isTikTok && (
                                <div className="bg-[#0f1422] p-5 rounded-2xl border border-slate-800/50 shadow-inner relative overflow-hidden">
                                     {/* Background decoration */}
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4 relative z-10">
                                        <Clock size={14} /> Retenção da Audiência
                                     </h4>
                                     
                                     <div className="flex items-end justify-between mb-2 px-1 relative z-10">
                                                                                 <div className="flex items-baseline gap-2">
                                                                                    <span className="text-3xl font-bold text-white tracking-tight">{analytics.averageViewPercentage?.toFixed(2) || 0}%</span>                                            <span className="text-xs text-slate-400 font-medium">assistido em média</span>
                                        </div>
                                     </div>

                                     {/* Big Progress Bar */}
                                     <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden shadow-inner mb-3 border border-slate-800/50 relative z-10">
                                        <div 
                                            className="h-full rounded-full relative transition-all duration-1000 ease-out"
                                            style={{ 
                                                width: `${Math.min(analytics.averageViewPercentage || 0, 100)}%`, 
                                                backgroundColor: themeColor,
                                                boxShadow: `0 0 20px ${themeColor}60`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                                        </div>
                                     </div>
                                     
                                     {/* Time Details */}
                                     <div className="flex justify-between items-center text-xs px-1 relative z-10">
                                         <span className="text-slate-600 font-mono">00:00</span>
                                         <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
                                            <span className="text-slate-400">Tempo Médio:</span>
                                            <span className="text-white font-bold font-mono text-sm">{formatDuration(analytics.averageViewDuration)}</span> 
                                            <span className="text-slate-600">/</span>
                                            <span className="text-slate-500 font-mono">
                                                {analytics.averageViewPercentage > 0 
                                                ? formatDuration(analytics.averageViewDuration / (analytics.averageViewPercentage / 100)) 
                                                : '--:--'}
                                            </span>
                                         </div>
                                         <span className="text-slate-600 font-mono">Fim</span>
                                     </div>

                                     {/* Subscriber Impact Row */}
                                     <div className="mt-6 pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-8 relative z-10">
                                         <div className="flex items-center gap-4 group">
                                            <div className="p-2.5 bg-green-500/10 rounded-xl text-green-500 border border-green-500/20"><TrendingUp size={20}/></div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Inscritos Ganhos</p>
                                                <p className="text-xl font-bold text-green-400">+{analytics.subscribersGained}</p>
                                            </div>
                                         </div>
                                         {isYoutubeLong && (
                                             <div className="flex items-center gap-4 group">
                                                <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-500 border border-cyan-500/20"><Bookmark size={20}/></div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Salvos em Playlist</p>
                                                    <p className="text-xl font-bold text-cyan-400">--</p>
                                                </div>
                                             </div>
                                         )}
                                     </div>
                                </div>
                                )}

                                {/* Seção Final: Configurações */}
                                <div className="pt-6 border-t border-slate-800/50 mt-4">
                                    <button 
                                        onClick={handleTogglePattern}
                                        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all duration-300 border relative overflow-hidden group
                                        ${isPattern 
                                            ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.3)]' 
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                                        } active:scale-95`}
                                    >
                                        <div className={`transition-transform duration-500 ${isPattern ? 'rotate-180 scale-110' : 'group-hover:scale-110'}`}>
                                            <Diamond size={18} className={isPattern ? "fill-current" : ""} />
                                        </div>
                                        <span className="relative z-10 tracking-widest text-xs uppercase">
                                            {isPattern ? "Padrão Definido" : "Definir como Padrão Estratégico"}
                                        </span>
                                        
                                        {/* Efeito de Brilho */}
                                        {!isPattern && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
      </div>
      <StrategicReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        insight={insight} 
        post={post}
        onRegenerate={generateInsight}
        isLoading={insightLoading}
      />
    </>
  );
};

export default PostDetailsDrawer;