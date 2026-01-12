import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; 
import PostCard from './PostCard'; 
import PostDetailsDrawer from './PostDetailsDrawer';
import { 
  Sparkles, Loader, AlertTriangle, Layers, X, 
  Zap, Target, Eye, Heart, Users, BookOpen, CheckCircle,
  Image, Mic, BrainCircuit, Scissors, MessageCircle, AlertOctagon, ThumbsDown,
  Video, Edit, Clock, Camera, Star 
} from 'lucide-react'; 
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

const API_BASE_URL = 'https://127.0.0.1:8000';

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', img: '/img/youtube.png', color: '#ff0000' },
  { id: 'shorts', label: 'Shorts', img: '/img/youtubeshorts.png', color: '#ff0000' },
  { id: 'tiktok', label: 'TikTok', img: '/img/tiktok.png', color: '#00f2ea' }, 
  { id: 'instagram', label: 'Instagram', img: '/img/instagram.png', color: '#E1306C' }
];

const PatternDNAView = ({ data, onClose }) => {
  if (!data) return null;

  let dna = data;
  if (typeof data === 'string') {
      try {
          dna = JSON.parse(data);
      } catch (e) {
          return (
            <div className="mb-8 p-6 bg-slate-900 border border-purple-500/30 rounded-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
                <ReactMarkdown className="prose prose-invert">{data}</ReactMarkdown>
            </div>
          )
      }
  }

  const iconMap = {
      'zap': Zap, 'target': Target, 'eye': Eye, 'heart': Heart, 
      'users': Users, 'book-open': BookOpen, 'check-circle': CheckCircle,
      'scissors': Scissors, 'mic': Mic, 'message-circle': MessageCircle,
      'video': Video, 'edit': Edit, 'clock': Clock, 'camera': Camera, 'star': Star,
      'alert': AlertTriangle
  };

  return (
    <div className="mb-12 animate-fade-in-up">
        {/* HERO HEADER */}
        <div className="relative p-8 rounded-3xl overflow-hidden border border-purple-500/30 bg-[#0a0f1e] shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-6">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none text-purple-500">
                <BrainCircuit size={180} />
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                {/* Score Circle */}
                <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                        <circle cx="64" cy="64" r="58" stroke="#a855f7" strokeWidth="8" fill="transparent" 
                            strokeDasharray={365} 
                            strokeDashoffset={365 - (365 * (dna.virality_score || 0)) / 100} 
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white">{dna.virality_score}</span>
                        <span className="text-[9px] uppercase tracking-widest text-purple-400 font-bold">Score</span>
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-widest mb-3">
                        <Layers size={12} /> Arquétipo Dominante
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">{dna.pattern_archetype || "Padrão Não Identificado"}</h2>
                    <div className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl prose prose-invert prose-p:leading-relaxed">
                        <ReactMarkdown>{dna.executive_summary}</ReactMarkdown>
                    </div>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>

        {/* --- STRATEGIC PILLARS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 auto-rows-fr">
            {/* 1. GOLDEN KEYWORDS */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#0b1021] flex flex-col h-full">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={12} className="text-yellow-400" /> Palavras de Ouro
                </h3>
                <div className="flex flex-wrap gap-2 flex-1 content-start">
                    {dna.golden_keywords?.map((kw, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-yellow-400/5 border border-yellow-400/20 text-yellow-200 text-[10px] font-bold shadow-[0_0_10px_rgba(250,204,21,0.05)] hover:bg-yellow-400/10 transition-colors">
                            {kw}
                        </span>
                    ))}
                </div>
            </div>

            {/* 2. EMOTIONAL TRIGGER */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#0b1021] flex flex-col h-full">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Heart size={12} className="text-pink-500" /> Gatilho Emocional
                </h3>
                <div className="flex-1 flex flex-col justify-center">
                    <p className="text-xs font-bold text-white mb-3 text-center">{dna.emotional_trigger?.type || "Equilíbrio"}</p>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative mb-2">
                        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-pink-500" style={{ width: `${dna.emotional_trigger?.intensity || 50}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 uppercase font-bold w-full">
                        <span>Lógica</span>
                        <span>Emoção</span>
                    </div>
                </div>
            </div>

            {/* 3. PACING STRUCTURE */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#0b1021] flex flex-col h-full">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Layers size={12} className="text-blue-400" /> Estrutura de Ritmo
                </h3>
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex h-8 w-full rounded-lg overflow-hidden gap-0.5 mb-2">
                        {dna.pacing_structure?.map((part, i) => (
                            <div key={i} className="h-full flex items-center justify-center relative group" style={{ width: `${part.percent}%`, backgroundColor: part.color }}>
                                <span className="text-[9px] font-bold text-black/70 z-10">{part.percent}%</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold px-1 w-full">
                        {dna.pacing_structure?.map((part, i) => (
                            <span key={i} style={{ color: part.color }}>{part.phase}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- NEW SECTION: BRAND & VISUALS --- */}
        {(dna.visual_style || dna.brand_voice) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 auto-rows-fr">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0b1021] flex gap-4 h-full items-center">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 h-fit flex-shrink-0"><Image size={24} /></div>
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Diretrizes Visuais (Capa & Hooks)</h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{dna.visual_style}</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0b1021] flex gap-4 h-full items-center">
                    <div className="p-3 bg-green-500/10 rounded-xl text-green-400 h-fit flex-shrink-0"><Mic size={24} /></div>
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tom de Voz da Marca</h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{dna.brand_voice}</p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0b1021]">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target size={14} className="text-purple-400" /> Perfil Psicológico
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dna.psychological_profile || []}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Psicologia" dataKey="A" stroke="#a855f7" strokeWidth={2} fill="#a855f7" fillOpacity={0.4} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} itemStyle={{ color: '#a855f7' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 bg-[#0b1021]">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Zap size={14} className="text-purple-400" /> DNA Viral (Métricas Chave)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dna.dna_metrics?.map((metric, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-white text-sm">{metric.trait}</span>
                                <span className="font-mono text-purple-400 font-bold">{metric.score}/100</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500" style={{ width: `${metric.score}%` }}></div>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">{metric.insight}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-6 glass-panel p-8 rounded-2xl border border-white/5 bg-[#0b1021]">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <BookOpen size={14} className="text-purple-400" /> Protocolo de Replicação (Passo a Passo)
            </h3>
            
            <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent md:block hidden"></div>
                <div className="space-y-8">
                    {dna.replication_script?.map((step, idx) => {
                        const Icon = iconMap[step.icon] || CheckCircle;
                        return (
                            <div key={idx} className="flex flex-col md:flex-row gap-6 relative group items-center">
                                <div className="hidden md:flex flex-col items-center z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-[#1e293b] border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform text-purple-400">
                                        <Icon size={28} />
                                    </div>
                                </div>
                                <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase tracking-wide">
                                            {step.phase}
                                        </span>
                                    </div>
                                    <div className="text-white text-base font-medium leading-relaxed prose prose-invert prose-p:leading-relaxed">
                                        <ReactMarkdown>{step.action}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {dna.antipatterns && (
            <div className="mt-6 p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertOctagon size={14} /> Erros Fatais (O que mata a retenção)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dna.antipatterns.map((error, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-black/20 border border-red-500/10 flex items-start gap-3">
                            <ThumbsDown size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-red-200/80 font-medium">{error}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {dna.checklist && (
            <div className="mt-6 p-8 rounded-3xl border border-[#3bf5a5]/30 bg-gradient-to-br from-[#001a10] to-black relative overflow-hidden shadow-[0_0_40px_rgba(59,245,165,0.1)]">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-[#3bf5a5] pointer-events-none">
                    <CheckCircle size={150} />
                </div>
                <h3 className="text-sm font-bold text-[#3bf5a5] uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10">
                    <div className="p-1.5 rounded-full bg-[#3bf5a5]/20 border border-[#3bf5a5]/40">
                        <CheckCircle size={16} /> 
                    </div>
                    Checklist de Ouro (Execução Imediata)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                    {dna.checklist.map((item, idx) => {
                        const Icon = iconMap[item.icon] || CheckCircle;
                        return (
                            <div key={idx} className="flex flex-col items-center text-center p-5 rounded-xl bg-black/40 border border-[#3bf5a5]/20 hover:border-[#3bf5a5]/60 hover:bg-[#3bf5a5]/10 transition-all duration-300 group h-full">
                                <div className="mb-3 w-10 h-10 rounded-full border border-[#3bf5a5]/30 bg-[#3bf5a5]/10 flex items-center justify-center text-[#3bf5a5] shadow-[0_0_15px_rgba(59,245,165,0.2)]">
                                    <Icon size={18} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs text-green-100/90 font-medium leading-relaxed">{item.item || item}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
    </div>
  );
};

const PadroesView = () => {
  const [allPosts, setAllPosts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('youtube'); 
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (!response.ok) throw new Error('Falha ao buscar os dados da biblioteca.');
        const data = await response.json();
        setAllPosts(data.filter(post => post.is_pattern));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const analyzePatterns = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
        const response = await fetch(`${API_BASE_URL}/api/patterns/analyze?platform=${selectedPlatform}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error("Erro ao analisar padrões");
        const data = await response.json();
        let parsedData = data.insight;
        if (typeof data.insight === 'string' && (data.insight.trim().startsWith('{') || data.insight.trim().startsWith('['))) {
             try { parsedData = JSON.parse(data.insight); } catch(e) {}
        }
        setAnalysisResult(parsedData);
    } catch (error) {
        console.error("Erro na análise:", error);
        setAnalysisResult(null); 
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => setIsDrawerOpen(false);

  const filteredPosts = allPosts.filter(post => {
    const p = post.platform ? post.platform.toLowerCase() : '';
    if (selectedPlatform === 'youtube') return p === 'youtube' || p === 'youtube_long';
    if (selectedPlatform === 'shorts') return p.includes('shorts');
    if (selectedPlatform === 'tiktok') return p.includes('tiktok');
    if (selectedPlatform === 'instagram') return p.includes('instagram');
    return false;
  });

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll animate-enter">
        <header>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-6 border-b border-white/10 pb-3 flex items-center gap-3">
            <Sparkles className="text-purple-400" /> 
            Padrões de Conteúdo (Referências)
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-4">
                {PLATFORMS.map((platform) => {
                const isActive = selectedPlatform === platform.id;
                return (
                    <button
                    key={platform.id}
                    onClick={() => { setSelectedPlatform(platform.id); setAnalysisResult(null); }}
                    className={`relative group flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 overflow-hidden ${isActive ? 'bg-slate-800/80 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-105' : 'bg-slate-900/40 border-slate-800/50 text-slate-500 hover:bg-slate-800 hover:border-slate-700 hover:text-slate-300'}`}
                    style={{ borderColor: isActive ? platform.color : '', boxShadow: isActive ? `0 0 15px ${platform.color}40` : '' }}
                    >
                    {isActive && <div className="absolute inset-0 opacity-10" style={{ backgroundColor: platform.color }} />}
                    <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 grayscale group-hover:grayscale-0'}`}>
                        <img src={platform.img} alt={platform.label} className="w-6 h-6 object-contain" />
                    </div>
                    <span className={`text-sm font-bold uppercase tracking-wider relative z-10 ${isActive ? 'text-white' : ''}`}>{platform.label}</span>
                    {isActive && <span className="absolute bottom-1 right-1/2 translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_5px_white]" />}
                    </button>
                );
                })}
            </div>
            <button
                onClick={analyzePatterns}
                disabled={isAnalyzing}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${isAnalyzing ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-cyan-950/50 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-900/80 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]'}`}
            >
                {isAnalyzing ? <><Loader size={16} className="animate-spin" /> Processando...</> : <><BrainCircuit size={16} /> Analisar com IA</>}
            </button>
          </div>
          <PatternDNAView data={analysisResult} onClose={() => setAnalysisResult(null)} />
        </header>
        {loading && <div className="flex flex-col items-center justify-center text-center py-16"><Loader className="animate-spin text-purple-400 mb-4" size={48} /><p className="text-lg font-semibold text-white">Carregando padrões...</p></div>}
        {error && <div className="flex flex-col items-center justify-center text-center py-16 bg-red-500/5 rounded-2xl border border-red-500/10"><AlertTriangle className="text-red-400 mb-4" size={48} /><p className="text-lg font-semibold text-red-300">Erro de Conexão</p><p className="text-sm text-red-400/80 max-w-md">{error}</p></div>}
        {!loading && !error && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
            {filteredPosts.length > 0 ? filteredPosts.map(post => <PostCard key={post.id} post={post} onClick={() => handlePostClick(post)} isPatternCard={true} />) : (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-purple-800 rounded-3xl bg-slate-900/20"><div className="opacity-30 mb-4 flex justify-center"><Sparkles size={64} className="text-purple-400" /></div><p className="text-xl font-bold text-slate-400">Nenhum padrão encontrado</p></div>
            )}
          </section>
        )}
      </div>
      <PostDetailsDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} post={selectedPost} />
    </>
  );
};

export default PadroesView;