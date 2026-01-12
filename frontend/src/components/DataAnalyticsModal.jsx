import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, TrendingUp, PieChart, Target, Zap, Lightbulb, BarChart3, Bot, Award, ShieldCheck, Play, Activity, LayoutGrid, Rocket, BrainCircuit, HelpCircle, Clock, Calendar, DollarSign, Timer, ArrowRight, MessageSquare, ThumbsUp, Eye, FileText, CheckCircle2, AlertTriangle, Info, Cpu, LineChart, Layers, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LabelList, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart as RechartsLineChart, Line } from 'recharts';

const PLATFORM_COLORS = {
    'youtube': '#FF0000',
    'tiktok': '#FFFFFF', 
    'instagram': '#E1306C',
    'shorts': '#FF0000'
};

// --- COMPONENTE DE EXPLICAÇÃO (TOOLTIP - CLIQUE - FIXED POSITION VIA PORTAL) ---
const InfoLabel = ({ title, desc }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const toggle = (e) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ 
                top: rect.top - 15, 
                left: rect.left + (rect.width / 2) 
            });
        }
        setIsOpen(!isOpen);
    };
    
    useEffect(() => {
        if(isOpen) window.addEventListener('scroll', () => setIsOpen(false), true);
        return () => window.removeEventListener('scroll', () => setIsOpen(false), true);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = () => setIsOpen(false);
        if (isOpen) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    return (
        <>
            <div 
                ref={buttonRef}
                className="group relative inline-block ml-2 align-middle z-[50] cursor-pointer"
                onClick={toggle}
            >
                <HelpCircle size={14} className={`transition-colors ${isOpen ? 'text-[#19e6ff]' : 'text-gray-600 hover:text-[#19e6ff]'}`} />
            </div>
            
            {isOpen && createPortal(
                <div 
                    className="fixed w-72 p-6 bg-[#02040a]/98 border border-[#19e6ff]/40 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,1)] z-[9999999] backdrop-blur-2xl animate-scale-in origin-bottom"
                    style={{ 
                        top: coords.top, 
                        left: coords.left, 
                        transform: 'translate(-50%, -100%)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className="text-[10px] font-black text-[#19e6ff] uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                        <Sparkles size={12} /> {title}
                    </p>
                    <p className="text-xs text-gray-100 leading-relaxed font-bold whitespace-normal break-words tracking-normal normal-case text-left">{desc}</p>
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#02040a] border-r border-b border-[#19e6ff]/40 transform rotate-45"></div>
                </div>,
                document.body
            )}
        </>
    );
};

// --- FUNÇÃO DE TRADUÇÃO DE MÉTRICAS ---
const formatMetricString = (str) => {
    if (!str) return '';
    return str
        .replace(/views/gi, 'visualizações')
        .replace(/avg/gi, 'médio')
        .replace(/followers/gi, 'seguidores')
        .replace(/subs\/dia/gi, 'inscritos/dia')
        .replace(/shares/gi, 'compart.')
        .replace(/YoY/gi, 'Anual')
        .replace(/efficiency/gi, 'eficiência');
};

// --- COMPONENTE DE PREVIEW DE POST (RICH CARD VIA PORTAL) ---
const PostTag = ({ id, allPosts }) => {
    const [isHovered, setIsHovered] = useState(false);
    const buttonRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    
    const cleanId = String(id || '').replace(/\D/g, '');
    const post = allPosts.find(p => 
        String(p.id) === cleanId || 
        String(p.platform_content_id) === String(id)
    );

    if (!id || id === 'N/A' || !post) return <span className="text-gray-600 font-bold italic text-[10px]">Estabilização Orgânica</span>;

    const handleMouseEnter = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top - 10, 
                left: rect.left + (rect.width / 2)
            });
        }
        setIsHovered(true);
    };

    const isTikTok = (post.platform || '').toLowerCase().includes('tiktok');
    const badgeColor = isTikTok ? 'bg-white text-black' : 'bg-red-600 text-white';
    const PlatformIcon = isTikTok ? (
        <img src="/img/tiktok.png" className="w-3 h-3 invert" alt="TK" />
    ) : (
        <img src="/img/youtube.png" className="w-3 h-3" alt="YT" />
    );

    return (
        <span className="relative inline-flex items-center mx-1 align-middle z-[50]">
            <button 
                ref={buttonRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsHovered(false)}
                className={`inline-flex items-center gap-1.5 ${badgeColor} px-2 py-0.5 rounded-md transition-all font-black text-[10px] shadow-lg hover:scale-110 active:scale-95 cursor-pointer h-5`}
            >
                {PlatformIcon}
                ID: {post.id}
            </button>

            {isHovered && createPortal(
                <div 
                    className="fixed w-80 bg-[#0b1021] border border-white/20 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden animate-scale-in origin-bottom backdrop-blur-3xl z-[9999999]"
                    style={{ 
                        top: coords.top, 
                        left: coords.left, 
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="aspect-video relative">
                        {post.thumbnail_url ? (
                            <img src={post.thumbnail_url} className="w-full h-full object-cover" alt="Thumb" />
                        ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase tracking-widest">Sem Preview</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1021] via-transparent to-transparent"></div>
                        <div className={`absolute top-3 right-3 ${badgeColor} px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-lg`}>
                            {post.platform}
                        </div>
                    </div>
                    <div className="p-5 text-left relative -mt-6">
                        <h4 className="text-white text-sm font-bold leading-tight line-clamp-2 mb-2">{post.title}</h4>
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
                            <div className="text-center">
                                <Eye size={12} className="mx-auto text-[#19e6ff] mb-1" />
                                <p className="text-[10px] font-black text-white">{post.metrics?.views?.toLocaleString() || 0}</p>
                            </div>
                            <div className="text-center">
                                <ThumbsUp size={12} className="mx-auto text-[#3bf5a5] mb-1" />
                                <p className="text-[10px] font-black text-white">{post.metrics?.likes?.toLocaleString() || 0}</p>
                            </div>
                            <div className="text-center">
                                <MessageSquare size={12} className="mx-auto text-yellow-400 mb-1" />
                                <p className="text-[10px] font-black text-white">{post.metrics?.comments?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </span>
    );
};

// --- PROCESSADOR DE TEXTO FLEXÍVEL ---
const SmartText = ({ text, allPosts }) => {
    if (!text) return null;
    const parts = text.split(/(\[ID:\s*[\w]+\]|id=[\w]+|#[\w]+)/gi);
    return (
        <span className="inline-content">
            {parts.map((part, i) => {
                const cleanId = part.replace(/[^\w]/g, ''); 
                if (cleanId && part.match(/(\[ID:|id=|#)/i)) {
                     return <PostTag key={i} id={cleanId} allPosts={allPosts} />;
                }
                return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
            })}
        </span>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950/95 border border-white/20 p-4 rounded-xl shadow-2xl backdrop-blur-md z-[10000]">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em] border-b border-white/5 pb-2">{label || 'Métrica'}</p>
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-10 mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }}></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{p.name}:</span>
                        </div>
                        <span className="text-[11px] font-black text-white">{p.value}{p.name.includes('%') ? '%' : ''}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const DataAnalyticsModal = ({ isOpen, onClose, data, loading, allPosts = [] }) => {
  const [renderKey, setRenderKey] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingPhrases = [
    "Sincronizando Neurônios de Dados...",
    "Mapeando Padrões de Alta Performance...",
    "Calculando Vetores de Crescimento...",
    "Ajustando Motor de Inteligência...",
    "Finalizando Estratégia de Elite..."
  ];

  useEffect(() => {
    if (isOpen && loading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingPhrases.length);
      }, 1500);
      return () => clearInterval(interval);
    }
    if (isOpen && !loading) {
      setTimeout(() => setRenderKey(prev => prev + 1), 300);
    }
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const h = data?.insights_hierarchy || {};
  const decisions = data?.executive_decisions || [];
  
  let diagnosticCards = data?.diagnostic_cards || [];
  if (diagnosticCards.length === 0 && data?.summary_text) {
      const sentences = data.summary_text.split(/\.\s+/).filter(s => s.length > 15).slice(0, 8);
      diagnosticCards = sentences.map((s, i) => ({
          title: i === 0 ? "Visão Estratégica" : `Insight Crítico #${i}`,
          content: s.endsWith('.') ? s : s + '.',
          type: i % 2 === 0 ? "positive" : "neutral",
          metric: "Data Focus"
      }));
  }

  const evolutionData = (() => {
      if (!data?.period) return [];
      
      const startDate = new Date(data.period.start);
      const endDate = new Date(data.period.end);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const intervals = [];
      
      if (diffDays > 60) {
          // AGRUPAMENTO POR MÊS (Para visões de longo prazo)
          let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          
          while (current <= endDate) {
              const monthLabel = current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
              const mStart = new Date(current.getFullYear(), current.getMonth(), 1);
              const mEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
              
              intervals.push({
                  label: monthLabel,
                  start: mStart,
                  end: mEnd,
                  youtube: 0,
                  tiktok: 0
              });
              current.setMonth(current.getMonth() + 1);
          }
      } else {
          // AGRUPAMENTO POR SEMANA (Para visões detalhadas)
          let current = new Date(startDate);
          // Ajusta para o início da semana (domingo) para ficar organizado
          current.setDate(current.getDate() - current.getDay());
          
          while (current <= endDate) {
              const wEnd = new Date(current);
              wEnd.setDate(current.getDate() + 6);
              wEnd.setHours(23, 59, 59);
              
              const weekLabel = `${current.getDate()}/${current.getMonth() + 1}`;
              
              intervals.push({
                  label: weekLabel,
                  start: new Date(current),
                  end: wEnd,
                  youtube: 0,
                  tiktok: 0
              });
              current.setDate(current.getDate() + 7);
          }
      }

      allPosts.forEach(post => {
          const pDate = new Date(post.published_at);
          const interval = intervals.find(i => pDate >= i.start && pDate <= i.end);
          if (interval) {
              const engagement = (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0);
              const p = (post.platform || '').toLowerCase();
              if (p.includes('youtube')) interval.youtube += engagement;
              if (p.includes('tiktok')) interval.tiktok += engagement;
          }
      });

      return intervals.map(i => ({ name: i.label, youtube: i.youtube, tiktok: i.tiktok }));
  })();

  const getIcon = (name) => {
      const n = name?.toLowerCase() || '';
      if(n.includes('rocket')) return <Rocket size={120} />;
      if(n.includes('zap')) return <Zap size={120} />;
      if(n.includes('target')) return <Target size={120} />;
      if(n.includes('users')) return <Users size={120} />;
      if(n.includes('layers')) return <Layers size={120} />;
      return <Activity size={120} />;
  };

  const getTacticalHint = (iconName) => {
      const n = iconName?.toLowerCase() || '';
      if(n.includes('rocket')) return "Estratégia de Expansão: Foco total em alcançar novos públicos.";
      if(n.includes('zap')) return "Ação de Choque: Movimento rápido para gerar pico imediato.";
      if(n.includes('target')) return "Ajuste de Precisão: Otimização fina para converter espectadores.";
      if(n.includes('users')) return "Gestão de Comunidade: Fortalecer o vínculo com a base.";
      if(n.includes('layers')) return "Estruturação: Organização de pilares editoriais.";
      return "Manobra Tática: Ação recomendada para melhorar a performance.";
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/98 backdrop-blur-3xl animate-enter p-4 md:p-8">
      <div className="w-full max-w-[1500px] h-full max-h-[94vh] bg-[#02040a] rounded-[3.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
        
        <div className="px-16 py-12 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md relative z-10">
           <div className="flex items-center gap-10">
              <div className="p-6 bg-gradient-to-br from-[#19e6ff]/40 via-black to-black rounded-[2.5rem] text-[#19e6ff] shadow-[0_0_60px_rgba(25,230,255,0.4)] border border-[#19e6ff]/30">
                <BrainCircuit size={48} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-6">Motor de Inteligência</h2>
                <p className="text-[#19e6ff]/60 text-xs font-black tracking-[0.6em] uppercase mt-4 flex items-center gap-3"><Cpu size={14} /> Estratégia de Alta Performance</p>
              </div>
           </div>
           <button onClick={onClose} className="p-5 hover:bg-white/10 rounded-full text-gray-400 transition-all hover:rotate-90 border border-white/5 shadow-2xl"><X size={36}/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-12 lg:px-20 lg:pt-20 lg:pb-0 relative z-10">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-16">
                    <div className="relative w-56 h-56 flex items-center justify-center flex-shrink-0">
                        <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-[#19e6ff] animate-spin"></div>
                        <div className="absolute inset-4 rounded-full border-l-4 border-r-4 border-[#3bf5a5] animate-reverse-spin"></div>
                        <Bot size={80} className="text-white animate-pulse" />
                    </div>
                    <div className="space-y-4 text-center">
                        <div className="h-24 flex items-center justify-center">
                             <p className="text-3xl font-black text-white uppercase tracking-[0.5em] animate-pulse leading-none">{loadingPhrases[loadingStep]}</p>
                        </div>
                        <p className="text-[#19e6ff] text-[10px] font-bold uppercase tracking-[0.8em]">Analisando Bilhões de Pontos de Dados</p>
                    </div>
                </div>
            ) : data ? (
                <div className="space-y-24 pb-0">
                    
                    {/* 1. DECISÕES EXECUTIVAS - CENTRALIZADO */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {decisions.map((dec, i) => (
                            <div key={i} className="bg-[#0b1021] border border-[#19e6ff]/20 p-10 rounded-[3rem] relative group hover:border-[#19e6ff]/50 transition-all shadow-2xl flex flex-col h-full overflow-hidden">
                                <div className="absolute -top-4 -right-4 p-10 opacity-[0.04] text-white overflow-hidden rounded-[4rem]">{getIcon(dec.icon)}</div>
                                
                                {/* Header Centralizado */}
                                <div className="flex items-center justify-center gap-3 mb-8 border-b border-white/5 pb-6 relative z-20">
                                    <div className="w-2 h-2 rounded-full bg-[#19e6ff] shadow-[0_0_10px_#19e6ff] shrink-0"></div>
                                    <h4 className="text-[#19e6ff] font-black text-xs md:text-sm uppercase tracking-[0.3em] leading-none text-center">
                                        {dec.title}
                                    </h4>
                                    <InfoLabel title="Conceito Tático" desc={getTacticalHint(dec.icon)} />
                                </div>

                                <div className="text-white font-bold text-lg leading-relaxed relative z-10 flex-1 flex items-center text-center px-4">
                                    <SmartText text={dec.desc} allPosts={allPosts} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 2. GRÁFICOS PESADOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 rounded-[4rem] p-12 shadow-2xl relative flex flex-col h-[650px]">
                            <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.5em] mb-4 flex items-center gap-3 relative z-20">
                                <Activity size={16} className="text-[#19e6ff]" /> Poder de Narrativa <InfoLabel title="Análise Temática" desc="Performance cruzada entre engajamento e volume de produção." />
                            </h3>
                            <div className="w-full h-full relative z-10" key={`radar-${renderKey}`}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.charts?.narrative_ranking || []}>
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="theme" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: '900' }} />
                                        <Radar name="Eficiência" dataKey="efficiency_score" stroke="#19e6ff" fill="#19e6ff" fillOpacity={0.4} />
                                        <Radar name="Volume" dataKey="volume" stroke="#3bf5a5" fill="#3bf5a5" fillOpacity={0.1} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="bottom" />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="flex flex-col gap-8 h-[650px]">
                             <div className="bg-[#0b1021] border border-white/5 rounded-[3.5rem] p-10 flex-1 flex flex-col justify-center relative overflow-visible">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.06] text-white"><Calendar size={100} /></div>
                                <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2 relative z-20">
                                    <Clock size={14} className="text-[#3bf5a5]" /> Melhor Momento <InfoLabel title="Janela de Pico" desc="Melhor combinação de tempo e espaço." />
                                </h4>
                                <div className="text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">{data.best_posting_day?.day || 'Análise...'}</div>
                                <div className="text-sm text-[#19e6ff] font-black uppercase tracking-[0.2em] mb-6 relative z-10">{data.best_posting_day?.best_theme}</div>
                                <p className="text-[11px] text-gray-400 font-bold leading-relaxed border-t border-white/5 pt-6 relative z-10">{data.best_posting_day?.reason}</p>
                             </div>

                             <div className="bg-gradient-to-br from-[#19e6ff]/10 to-[#0b1021] border border-[#19e6ff]/20 rounded-[3.5rem] p-10 flex-1 flex flex-col justify-center relative overflow-visible">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.06] text-[#19e6ff]"><DollarSign size={100} /></div>
                                <h4 className="text-[#19e6ff] text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2 relative z-20">
                                    <TrendingUp size={14} /> ROI / Hora <InfoLabel title="Eficiência Financeira" desc="Retorno real por unidade de tempo." />
                                </h4>
                                <div className="flex items-center justify-start gap-4 mb-4 relative z-10">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Domínio:</span>
                                    <span className="text-xs font-black text-[#3bf5a5] uppercase px-4 py-1.5 bg-[#3bf5a5]/10 rounded-xl border border-[#3bf5a5]/20">{data.money_equivalence?.winner || 'Equilíbrio'}</span>
                                </div>
                                <p className="text-xs text-gray-300 font-bold leading-relaxed relative z-10"><SmartText text={data.money_equivalence?.explanation} allPosts={allPosts} /></p>
                             </div>
                        </div>
                    </div>

                    {/* 3. QUADRANTE DE METRICAS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[950px] mb-24">
                        <div className="flex flex-col gap-8 h-full">
                            <div className="bg-slate-900/40 border border-white/10 rounded-[4rem] p-10 flex-[1.8] shadow-2xl relative flex flex-col items-center">
                                <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.5em] mb-4 self-start flex items-center gap-3 relative z-20">
                                    <PieChart size={16} className="text-[#3bf5a5]" /> Share de Audiência <InfoLabel title="Domínio" desc="Onde seu público concentra o tempo." />
                                </h3>
                                <div className="w-full h-full relative flex items-center justify-center z-10" key={`pie-${renderKey}`}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie data={data.charts?.platform_share || []} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={15} dataKey="value" stroke="none">
                                                {(data.charts?.platform_share || []).map((entry, index) => {
                                                    const name = (entry.name || '').toLowerCase();
                                                    let fill = '#333';
                                                    if (name.includes('youtube') || name.includes('shorts')) fill = PLATFORM_COLORS['youtube'];
                                                    else if (name.includes('tiktok')) fill = PLATFORM_COLORS['tiktok'];
                                                    else if (name.includes('instagram')) fill = PLATFORM_COLORS['instagram'];
                                                    return <Cell key={`cell-${index}`} fill={fill} />;
                                                })}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center mt-[-20px]">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Líder</span>
                                        <span className="text-4xl font-black text-[#19e6ff] uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(25,230,255,0.6)]">
                                            {(data.dominant_channel || '').split(' ')[0]}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full mt-auto bg-[#0b1021] rounded-3xl p-6 border border-white/5 flex items-center gap-4 relative z-20">
                                    <div className="p-3 bg-[#19e6ff]/10 rounded-full text-[#19e6ff] flex-shrink-0"><Award size={20} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Análise de Liderança</p>
                                        <p className="text-xs font-bold text-gray-200 leading-relaxed">
                                            {data.dominant_channel}. O ecossistema apresenta uma concentração estratégica que favorece a retenção orgânica através de pilares de alto impacto.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 border border-white/10 rounded-[4rem] p-8 flex-1 shadow-2xl relative flex flex-col min-h-[380px]">
                                <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.5em] mb-6 flex items-center gap-3 relative z-20">
                                    <ShieldCheck size={16} className="text-orange-400" /> Qualidade (YT vs TK) <InfoLabel title="Score" desc="Quem retém mais?" />
                                </h3>
                                <div className="relative flex-1 flex items-center justify-around">
                                    {(() => {
                                        const calcScore = (posts, platformName) => {
                                            const totals = posts.reduce((acc, p) => ({
                                                v: acc.v + (p.metrics?.views || 0),
                                                l: acc.l + (p.metrics?.likes || 0),
                                                c: acc.c + (p.metrics?.comments || 0),
                                                s: acc.s + (p.metrics?.shares || 0)
                                            }), { v: 0, l: 0, c: 0, s: 0 });
                                            const interactions = totals.l + (totals.c * 2) + (totals.s * 5);
                                            return Math.min(Math.round(totals.v > 0 ? (interactions / totals.v) * 500 : 0), 100);
                                        };
                                        const ytScore = calcScore(allPosts.filter(p => (p.platform || '').toLowerCase().includes('youtube')), 'YouTube');
                                        const tkScore = calcScore(allPosts.filter(p => (p.platform || '').toLowerCase().includes('tiktok')), 'TikTok');
                                        return (
                                            <>
                                                <div className="w-1/2 h-full relative flex flex-col items-center justify-center border-r border-white/5">
                                                    <div className="w-full h-[120px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RechartsPieChart>
                                                                <Pie data={[{ value: ytScore }, { value: 100 - ytScore }]} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={85} dataKey="value" stroke="none">
                                                                    <Cell fill="#FF0000" /><Cell fill="rgba(255,255,255,0.05)" />
                                                                </Pie>
                                                            </RechartsPieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="text-center mt-[-20px]">
                                                        <span className="text-3xl font-black text-white block">{ytScore}</span>
                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">YouTube</span>
                                                    </div>
                                                </div>
                                                <div className="w-1/2 h-full relative flex flex-col items-center justify-center">
                                                    <div className="w-full h-[120px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RechartsPieChart>
                                                                <Pie data={[{ value: tkScore }, { value: 100 - tkScore }]} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={85} dataKey="value" stroke="none">
                                                                    <Cell fill="#19e6ff" /><Cell fill="rgba(255,255,255,0.05)" />
                                                                </Pie>
                                                            </RechartsPieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="text-center mt-[-20px]">
                                                        <span className="text-3xl font-black text-white block">{tkScore}</span>
                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">TikTok</span>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="mt-6 px-6 pb-4">
                                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed italic text-center border-t border-white/5 pt-4">
                                        YouTube foca em retenção de longa duração, enquanto TikTok domina em tração imediata e viralidade de curto prazo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-8 h-full">
                            <div className="bg-slate-900/40 border border-white/10 rounded-[4rem] p-10 shadow-2xl flex-[1.6] flex flex-col relative">
                                <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.5em] mb-6 flex items-center gap-3 relative z-20">
                                    <BarChart3 size={16} className="text-[#19e6ff]" /> Eficiência de Conversão <InfoLabel title="Impacto" desc="Visualização em seguidor fiel." />
                                </h3>
                                <div className="flex-1 flex flex-col justify-center gap-5 relative z-10">
                                    {(data.charts?.efficiency_comparison || []).map((item, idx) => {
                                        const isYt = item.platform.toLowerCase().includes('youtube');
                                        const engPercent = Math.min((item.engagement_rate / 25) * 100, 100);
                                        const convPercent = Math.min((item.conversion_rate / 10) * 100, 100);
                                        const powerScore = Math.round(Math.min((item.engagement_rate * 2) + (item.conversion_rate * 15), 100));
                                        return (
                                            <div key={idx} className="bg-[#0b1021] border border-white/5 rounded-3xl p-6 group hover:border-[#19e6ff]/30 transition-all shadow-lg">
                                                <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isYt ? 'bg-red-500/10' : 'bg-white/10'} border border-white/5`}>
                                                            {isYt ? <img src="/img/youtube.png" className="w-5 h-5" alt="YT"/> : <img src="/img/tiktok.png" className="w-5 h-5 invert" alt="TK"/>}
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-black text-white uppercase tracking-wider block">{item.platform}</span>
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase">Status: Ativo</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] text-gray-500 font-bold uppercase block mb-0.5">Power Score</span>
                                                        <span className="text-2xl font-black text-white flex items-center justify-end gap-1"><Zap size={14} className="text-yellow-400 fill-yellow-400" /> {powerScore}</span>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-[9px] font-bold text-[#19e6ff] mb-1.5 uppercase tracking-wider"><span>Engajamento</span><span>{item.engagement_rate}%</span></div>
                                                    <div className="w-full h-2 bg-[#19e6ff]/10 rounded-full overflow-hidden"><div className="h-full bg-[#19e6ff]" style={{ width: `${engPercent}%` }}></div></div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[9px] font-bold text-[#3bf5a5] mb-1.5 uppercase tracking-wider"><span>Conversão</span><span>{item.conversion_rate}%</span></div>
                                                    <div className="w-full h-2 bg-[#3bf5a5]/10 rounded-full overflow-hidden"><div className="h-full bg-[#3bf5a5]" style={{ width: `${convPercent}%` }}></div></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-slate-900/40 border border-white/10 rounded-[4rem] p-10 shadow-2xl flex-1 flex flex-col min-h-[300px]">
                                <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.5em] mb-4 flex items-center gap-3 relative z-20">
                                    <LineChart size={16} className="text-purple-400" /> Tendência Recente <InfoLabel title="Evolução" desc="Soma total de todas as interações." />
                                </h3>
                                <div className="w-full h-full relative z-10" key={`line-${renderKey}`}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsLineChart data={evolutionData} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                                            <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} interval={0} padding={{ left: 40, right: 40 }} />
                                            <YAxis yAxisId="left" hide /><YAxis yAxisId="right" orientation="right" hide />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line yAxisId="left" type="monotone" dataKey="youtube" stroke="#FF0000" strokeWidth={3} dot={{r: 4}} name="YouTube" />
                                            <Line yAxisId="right" type="monotone" dataKey="tiktok" stroke="#FFFFFF" strokeWidth={3} dot={{r: 4}} name="TikTok" />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-4 bg-gradient-to-br from-[#19e6ff]/15 to-black border border-[#19e6ff]/30 p-10 rounded-[3rem] shadow-2xl relative flex items-center justify-between gap-10">
                            <div className="flex items-center gap-6 text-[#19e6ff] shrink-0"><Award size={40} /><div><span className="text-xs font-black uppercase tracking-[0.5em] block mb-1">Insight Mestre</span></div></div>
                            <div className="text-2xl text-white font-black leading-tight flex-1 text-right border-l border-white/10 pl-10 py-2"><SmartText text={h.master} allPosts={allPosts} /></div>
                        </div>
                        
                         <div className="lg:col-span-2 bg-[#0b1021]/80 border border-white/10 p-10 rounded-[3rem] flex flex-col shadow-xl relative h-full">
                             <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-white"><Timer size={80} /></div>
                             <div className="flex items-center gap-3 mb-8 text-orange-400"><TrendingUp size={24} /><span className="text-[11px] font-black uppercase tracking-[0.4em]">Delay Effect</span></div>
                             
                             {/* Layout Vertical para preencher o quadro */}
                             <div className="flex flex-col gap-6 flex-1">
                                 {/* Card YouTube */}
                                 <div className="flex flex-col justify-between bg-white/[0.02] rounded-3xl p-6 border border-white/5 flex-1 transition-all hover:bg-white/[0.04] group/card">
                                     <div className="flex items-center justify-between mb-4">
                                         <div className="flex items-center gap-3">
                                             <img src="/img/youtube.png" className="w-5 h-5" />
                                             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">YouTube Insight</span>
                                             <PostTag id={h.delayed_youtube?.video_id} allPosts={allPosts} />
                                         </div>
                                         <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-[10px] font-black text-orange-400 uppercase">+{h.delayed_youtube?.delay_days || 0} dias</span>
                                     </div>
                                     <p className="text-gray-200 font-bold text-sm leading-relaxed mb-4 flex-1">
                                         <SmartText text={h.delayed_youtube?.insight || "Analisando comportamento de retenção tardia..."} allPosts={allPosts} />
                                     </p>
                                     {h.delayed_youtube?.action && (
                                         <div className="bg-orange-500/5 border-l-2 border-orange-500/40 p-3 rounded-r-xl mt-auto">
                                             <p className="text-[10px] text-gray-400 font-bold italic flex items-center gap-2">
                                                 <Zap size={12} className="text-orange-400"/> {h.delayed_youtube.action}
                                             </p>
                                         </div>
                                     )}
                                 </div>

                                 {/* Card TikTok */}
                                 <div className="flex flex-col justify-between bg-white/[0.02] rounded-3xl p-6 border border-white/5 flex-1 transition-all hover:bg-white/[0.04] group/card">
                                     <div className="flex items-center justify-between mb-4">
                                         <div className="flex items-center gap-3">
                                             <img src="/img/tiktok.png" className="w-5 h-5 invert" />
                                             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TikTok Insight</span>
                                             <PostTag id={h.delayed_tiktok?.video_id} allPosts={allPosts} />
                                         </div>
                                         <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-[10px] font-black text-orange-400 uppercase">+{h.delayed_tiktok?.delay_days || 0} dias</span>
                                     </div>
                                     <p className="text-gray-200 font-bold text-sm leading-relaxed mb-4 flex-1">
                                         <SmartText text={h.delayed_tiktok?.insight || "Mapeando propagação algorítmica..."} allPosts={allPosts} />
                                     </p>
                                     {h.delayed_tiktok?.action && (
                                         <div className="bg-orange-500/5 border-l-2 border-orange-500/40 p-3 rounded-r-xl mt-auto">
                                             <p className="text-[10px] text-gray-400 font-bold italic flex items-center gap-2">
                                                 <Zap size={12} className="text-orange-400"/> {h.delayed_tiktok.action}
                                             </p>
                                         </div>
                                     )}
                                 </div>
                             </div>
                        </div>

                        <div className="lg:col-span-2 bg-[#0b1021]/80 border border-white/10 p-10 rounded-[3rem] flex flex-col shadow-xl relative h-full">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-white"><BrainCircuit size={80} /></div>
                            <div className="flex items-center gap-3 mb-8 text-purple-400"><BrainCircuit size={24} /><span className="text-[11px] font-black uppercase tracking-[0.4em]">Comportamental</span></div>
                            <div className="mb-6 border-b border-white/5 pb-6">
                                <p className="text-gray-200 font-bold text-lg leading-relaxed text-center px-4"><SmartText text={h.behavioral} allPosts={allPosts} /></p>
                                <p className="text-[11px] text-gray-500 font-bold text-center mt-4 italic">Padrão: Audiência reage com pico de interesse em conteúdos de análise técnica.</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 relative z-10">
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Activity size={12} /> Ressonância Emocional</p>
                                <div className="space-y-3">
                                    {(() => {
                                        const stats = allPosts.reduce((acc, p) => {
                                            const v = p.metrics?.views || 0, l = p.metrics?.likes || 0, c = p.metrics?.comments || 0, s = p.metrics?.shares || 0;
                                            return { sumViews: acc.sumViews + v, sumInteractions: acc.sumInteractions + (l + c), sumShares: acc.sumShares + s, maxViews: Math.max(acc.maxViews, v), maxIntRate: Math.max(acc.maxIntRate, v > 0 ? (l + c) / v : 0), maxViralRate: Math.max(acc.maxViralRate, v > 0 ? s / v : 0), count: acc.count + 1 };
                                        }, { sumViews: 0, sumInteractions: 0, sumShares: 0, maxViews: 0, maxIntRate: 0, maxViralRate: 0, count: 0 });
                                        if (stats.count === 0) return null;
                                        const attScore = Math.min((stats.sumViews / (stats.count * stats.maxViews * 0.8 || 1)) * 100 * stats.count, 100); 
                                        const intScore = Math.min(((stats.sumInteractions / (stats.sumViews || 1)) / (stats.maxIntRate * 0.8 || 0.1)) * 100, 100);
                                        const virScore = Math.min(((stats.sumShares / (stats.sumViews || 1)) / (stats.maxViralRate * 0.8 || 0.05)) * 100, 100);
                                        return (
                                            <>
                                                <div><div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1 uppercase"><span>Atenção</span><span>{Math.round(attScore)}%</span></div><div className="w-full h-1.5 bg-gray-700/30 rounded-full overflow-hidden"><div className="h-full bg-purple-400 rounded-full" style={{ width: `${attScore}%` }}></div></div></div>
                                                <div><div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1 uppercase"><span>Interação</span><span>{Math.round(intScore)}%</span></div><div className="w-full h-1.5 bg-gray-700/30 rounded-full overflow-hidden"><div className="h-full bg-[#19e6ff] rounded-full" style={{ width: `${intScore}%` }}></div></div></div>
                                                <div><div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1 uppercase"><span>Viralidade</span><span>{Math.round(virScore)}%</span></div><div className="w-full h-1.5 bg-gray-700/30 rounded-full overflow-hidden"><div className="h-full bg-[#3bf5a5] rounded-full" style={{ width: `${virScore}%` }}></div></div></div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <div className="flex items-center gap-6 px-8 border-b border-white/5 pb-10"><div className="p-4 bg-[#19e6ff]/10 rounded-2xl"><Cpu size={40} className="text-[#19e6ff]" /></div><h3 className="text-white font-black text-4xl uppercase tracking-tighter">Diagnóstico Multidimensional</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                             {diagnosticCards.map((card, idx) => {
                                 const isPositive = card.type === 'positive', isWarning = card.type === 'warning';
                                 const iconColor = isPositive ? 'text-[#3bf5a5]' : isWarning ? 'text-orange-500' : 'text-blue-400';
                                 const borderColor = isPositive ? 'border-[#3bf5a5]/30' : isWarning ? 'border-orange-500/30' : 'border-blue-400/20';
                                 let IconComponent = isPositive ? CheckCircle2 : isWarning ? AlertTriangle : Info;
                                 return (
                                     <div key={idx} className={`bg-[#0b1021] border ${borderColor} p-6 rounded-[2.5rem] shadow-2xl hover:scale-[1.02] transition-all group relative flex flex-col h-full overflow-hidden`}>
                                         
                                         {/* Número de Fundo (Ajustado para dentro) */}
                                         <div className="absolute right-2 -top-4 text-[120px] font-black text-white/[0.03] select-none pointer-events-none z-0 tracking-tighter">
                                             {String(idx + 1).padStart(2, '0')}
                                         </div>

                                         {/* Header Simples */}
                                         <div className="flex items-center gap-3 mb-4 relative z-10"><IconComponent size={24} className={iconColor} /><span className={`text-[10px] font-black uppercase tracking-[0.2em] ${iconColor}`}>{isPositive ? "Positivo" : isWarning ? "Atenção" : "Neutro"}</span></div>
                                         <div className="flex-1 mb-6 relative z-10 flex flex-col justify-center">
                                             <h4 className="text-white font-black text-lg mb-3 leading-tight group-hover:text-[#19e6ff] transition-colors">{card.title}</h4>
                                             <p className="text-gray-400 text-[11px] font-bold leading-relaxed"><SmartText text={card.content} allPosts={allPosts} /></p>
                                         </div>
                                         {card.metric && <div className="mt-auto relative z-10"><div className={`w-full py-2 rounded-xl text-[10px] font-black border border-white/5 uppercase tracking-widest text-center ${iconColor} bg-white/5`}>{formatMetricString(card.metric)}</div></div>}
                                     </div>
                                 )
                             })}
                        </div>
                    </div>

                    <div className="border-t border-white/5 py-12 !mt-12 flex flex-col items-center justify-center text-gray-600 text-center w-full gap-4">
                        <p className="text-xs font-black uppercase tracking-[0.5em]">Fim do Relatório de Inteligência</p>
                        <p className="font-mono text-[10px] opacity-40">REF: {new Date().toISOString().split('T')[0].replace(/-/g, '')}-{Math.random().toString(36).substring(2, 6).toUpperCase()}</p>
                    </div>

                </div>
            ) : null}
        </div>
      </div>
    </div>
  );
};

export default DataAnalyticsModal;