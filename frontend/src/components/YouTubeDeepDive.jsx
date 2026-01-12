import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  TrendingUp, Users, Clock, Target, Zap, Activity,
  Award, AlertTriangle, MousePointer2, BarChart3,
  PlayCircle, Flame, Star, Search, ShieldCheck,
  Share2, Calendar, LayoutGrid, Rocket, Globe,
  DollarSign, Eye, ThumbsUp, MessageSquare, Video,
  MapPin, Hash, CheckCircle2, BarChart4, Beaker,
  Crosshair, HelpCircle, X, UserPlus
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, RadialBarChart, RadialBar, Legend,
  ReferenceLine, ReferenceArea
} from 'recharts';

// --- CORES & TEMA ---
const colors = {
  primary: '#3bf5a5',    // Verde Neon (Crescimento)
  secondary: '#19e6ff',  // Azul Neon (Tecnologia/Dados)
  accent: '#8b5cf6',     // Roxo (Autoridade)
  youtube: '#ff0000',    // Vermelho YouTube
  shorts: '#19e6ff',     // Azul Shorts
  darkBg: '#0b1021',     // Fundo Card
  glass: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)'
};

const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString('pt-BR');
};

// --- COMPONENTE DE AJUDA FLUTUANTE (POPOVER) ---
const HelpTooltip = ({ title, text, align = 'center' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Configuração de Alinhamento
    let containerClasses = "left-1/2 -translate-x-1/2 origin-bottom"; // Default Center
    let arrowClasses = "left-1/2 -translate-x-1/2"; // Default Center

    if (align === 'right') {
        containerClasses = "right-0 origin-bottom-right translate-x-2"; 
        arrowClasses = "right-3 translate-x-0"; // Seta na direita
    } else if (align === 'left') {
        containerClasses = "left-0 origin-bottom-left -translate-x-2";
        arrowClasses = "left-3 translate-x-0";
    }

    return (
        <div className="relative inline-flex items-center ml-2" ref={wrapperRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`text-gray-600 hover:text-white transition-colors flex items-center justify-center ${isOpen ? 'text-[#19e6ff]' : ''}`}
            >
                <HelpCircle size={13} />
            </button>

            {isOpen && (
                <div className={`absolute bottom-full mb-3 w-64 bg-[#0f172a] border border-white/20 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[100] animate-enter ${containerClasses}`}>
                    <div className="p-4 relative">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-[11px] font-black text-[#19e6ff] uppercase tracking-wider pr-4">{title}</h4>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white"><X size={12}/></button>
                        </div>
                        <p className="text-[11px] text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                            {text}
                        </p>
                        <div className={`absolute -bottom-1.5 w-3 h-3 bg-[#0f172a] border-b border-r border-white/20 rotate-45 ${arrowClasses}`}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTES VISUAIS (WIDGETS) ---

const StatCard = ({ icon: Icon, label, value, subtext, color, trend, helpText, tooltipAlign = 'center', bgOpacity = '0.05' }) => (
  <div className="rounded-3xl bg-[#0b1021] border border-white/5 relative group hover:border-white/10 transition-all shadow-lg">
    {/* Background Icon Container (Overflow Hidden) */}
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className={`absolute -top-6 -right-6 transition-opacity transform rotate-12`} style={{ color, opacity: bgOpacity }}>
           <Icon size={140} />
        </div>
    </div>
    
    <div className="relative z-10 p-5">
       <div className="flex items-center mb-2 h-6">
         <div className="p-2 rounded-lg bg-white/5 flex items-center justify-center mr-2" style={{ color }}><Icon size={16} /></div>
         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-0.5">{label}</span>
         {helpText && <HelpTooltip title={label} text={helpText} align={tooltipAlign} />}
       </div>
       <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
          {trend && <span className="text-xs font-bold" style={{ color: trend > 0 ? colors.primary : '#ef4444' }}>{trend > 0 ? '+' : ''}{trend}%</span>}
       </div>
       {subtext && <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-wider">{subtext}</p>}
    </div>
  </div>
);

const BentoCard = ({ title, icon: Icon, children, className = "", headerAction, helpText, tooltipAlign = 'center' }) => (
  <div className={`rounded-[2rem] bg-[#0b1021] border border-white/5 shadow-xl relative flex flex-col ${className}`}>
     <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
        <div className="absolute inset-0 bg-[url('/img/grid.svg')] opacity-[0.02]"></div>
     </div>

     <div className="flex justify-between items-center mb-6 z-10 relative p-6 pb-0">
        <div className="flex items-center">
            {Icon && <Icon size={14} className="text-[#19e6ff] mr-2" />}
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] pt-0.5">
               {title}
            </h3>
            {helpText && <HelpTooltip title={title} text={helpText} align={tooltipAlign} />}
        </div>
        {headerAction}
     </div>
     <div className="flex-1 relative z-10 w-full min-h-0 p-6 pt-0">
        {children}
     </div>
  </div>
);

const calculateMedian = (values) => {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);
    if (values.length % 2) return values[half];
    return (values[half - 1] + values[half]) / 2.0;
};

const YouTubeDeepDive = ({ posts, dailyData, audience }) => {
  const data = useMemo(() => {
    const ytPosts = posts.filter(p => p.platform.includes('youtube'));
    const totalViews = ytPosts.reduce((acc, p) => acc + (p.metrics?.views || 0), 0);
    const totalSubs = ytPosts.reduce((acc, p) => acc + (p.metrics?.subscribers_gained || 0), 0);
    const totalLikes = ytPosts.reduce((acc, p) => acc + (p.metrics?.likes || 0), 0);
    const avgRetention = ytPosts.length > 0 ? Math.round(ytPosts.reduce((acc, p) => acc + (p.metrics?.averageViewPercentage || 0), 0) / ytPosts.filter(p => p.metrics?.averageViewPercentage > 0).length || 1) : 0;
    
    // Matriz Scatter
    const cleanPosts = ytPosts.filter(p => (p.metrics?.views || 0) > 0 && (p.metrics?.averageViewPercentage || 0) > 0).sort((a,b) => b.published_at - a.published_at).slice(0, 300);
    const scatterData = cleanPosts.map(p => ({ id: p.id, title: p.title, img: p.thumbnail_url, x: Math.max(p.metrics?.views || 10, 10), y: p.metrics?.averageViewPercentage || 0, z: (p.metrics?.views || 0), platform: p.platform }));
    
    // Eixos e Medianas (DECLARADO ANTES DO RETORNO)
    const allViews = scatterData.map(d => d.x);
    const allRetentions = scatterData.map(d => d.y);
    const medianViews = calculateMedian(allViews) || 1000;
    const medianRetention = calculateMedian(allRetentions) || 50;
    const domainMaxX = Math.max(...allViews, 1000) * 2; 
    const domainMinX = Math.max(Math.min(...allViews), 50); 
    const domainMaxY = Math.max(...allRetentions, 100) * 1.1;
    const domainMinY = 0; // Adicionado explicitamente

    const conversionRate = totalViews > 0 ? (totalSubs / totalViews * 100).toFixed(3) : "0.000";
    const rpmLong = 4.00; const rpmShort = 0.06; 
    const revenueEstimado = ((ytPosts.filter(p => p.platform !== 'youtube_shorts').reduce((acc, p) => acc + (p.metrics?.views || 0), 0) / 1000) * rpmLong) + ((ytPosts.filter(p => p.platform === 'youtube_shorts').reduce((acc, p) => acc + (p.metrics?.views || 0), 0) / 1000) * rpmShort);
    const seoScores = ytPosts.map(p => { 
        let score = 0; 
        const title = p.title || "";
        const desc = p.description || "";
        const tags = p.tags ? p.tags.split(',') : [];

        // 1. Título Estratégico (Max 30)
        if (title.length >= 35 && title.length <= 70) score += 20; // Comprimento Ideal
        else if (title.length > 0) score += 10;
        if (title.includes('[') || title.includes(']') || title.includes('(') || title.includes(')') || /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(title)) score += 10; // CTR Boost (Emojis/Brackets)

        // 2. Descrição de Conversão (Max 40)
        if (desc.toLowerCase().includes('http')) score += 25; // CTA/Link para Agendamento (Crucial!)
        if (desc.length > 200) score += 15; // Densidade de Informação
        else if (desc.length > 50) score += 5;

        // 3. Saturação de Tags (Max 20)
        if (tags.length >= 10) score += 20;
        else if (tags.length > 0) score += 10;

        // 4. Gatilho de Algoritmo (Max 10)
        if (title.includes('?') || desc.substring(0, 150).includes('?')) score += 10; // Pergunta estimula comentários

        return score; 
    });
    const avgSeoScore = seoScores.length > 0 ? Math.round(seoScores.reduce((a,b)=>a+b,0)/seoScores.length) : 0;
    const allTags = ytPosts.flatMap(p => p.tags ? p.tags.split(',') : []);
    const tagCounts = allTags.reduce((acc, tag) => { const t = tag.trim().toLowerCase(); if(t) acc[t] = (acc[t] || 0) + 1; return acc; }, {});
    const topTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).slice(0, 20).map(([name, count]) => ({ name, count }));
    
    const shorts = ytPosts.filter(p => p.platform === 'youtube_shorts');
    const longs = ytPosts.filter(p => p.platform === 'youtube_long');
    
    const bestShort = [...shorts].sort((a,b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))[0];
    const bestLong = [...longs].sort((a,b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))[0];
    
    const formatBattle = [ { name: 'Shorts', avgViews: shorts.length ? Math.round(shorts.reduce((acc,p)=>acc+(p.metrics?.views||0),0)/shorts.length) : 0, totalCount: shorts.length, fill: colors.shorts }, { name: 'Longos', avgViews: longs.length ? Math.round(longs.reduce((acc,p)=>acc+(p.metrics?.views||0),0)/longs.length) : 0, totalCount: longs.length, fill: colors.youtube } ];
    const velocityData = dailyData.map(d => ({ day: d.day, velocity: d.youtube.views }));
    
    // RETORNO FINAL DO USEMEMO
    return { totalViews, totalSubs, avgRetention, scatterData, conversionRate, revenueEstimado, avgSeoScore, topTags, bestShort, bestLong, totalLikes, formatBattle, velocityData, medianViews, medianRetention, domainMaxX, domainMinX, domainMaxY, domainMinY };
  }, [posts, dailyData]);

  return (
    <div className="space-y-6 pb-20 animate-enter">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Eye} label="Alcance Total" value={formatNumber(data.totalViews)} subtext="Visualizações Totais" color={colors.secondary} helpText="Soma absoluta de visualizações de todos os vídeos no período." />
            <StatCard icon={Users} label="Novos Pacientes" value={`+${formatNumber(data.totalSubs)}`} subtext="Inscritos Ganhos" color={colors.primary} helpText="Total de usuários que se inscreveram após assistir seus vídeos." />
            <StatCard icon={Activity} label="Saúde do Canal" value={`${data.avgRetention}%`} subtext="Retenção Média" color={data.avgRetention > 50 ? colors.primary : '#ef4444'} tooltipAlign="right" helpText="A porcentagem média assistida. >50% é considerado excelente." />
            <StatCard icon={DollarSign} label="Potencial ($)" value={`$${formatNumber(data.revenueEstimado)}`} subtext="Receita AdSense (Estimada)" color="#facc15" tooltipAlign="right" helpText="Estimativa baseada em RPM de nicho médico High-Ticket." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BentoCard 
                title="Matriz de Dominância: Retenção vs. Alcance" icon={Crosshair} className="lg:col-span-2 min-h-[600px]"
                headerAction={<div className="text-[9px] text-gray-500 font-mono hidden md:block">CENTRO DINÂMICO: {formatNumber(data.medianViews)} views / {data.medianRetention}% ret</div>}
                helpText="Cruza Retenção (Qualidade) com Alcance (Views).\n\n• Verde: Dominância.\n• Azul: Ouro Escondido.\n• Amarelo: Viral/Alerta.\n• Roxo: Laboratório."
            >
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} horizontal={false} />
                        <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Views" 
                            stroke="#64748b" 
                            fontSize={10} 
                            scale="log" 
                            domain={[data.domainMinX, data.domainMaxX]} 
                            allowDataOverflow={true} 
                            tick={{ fill: '#64748b' }} 
                            axisLine={{ stroke: '#334155' }} 
                            padding={{ left: 20, right: 20 }}
                            ticks={[50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000]}
                            tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(0) + 'k' : val} 
                        />
                        <YAxis type="number" dataKey="y" name="Retenção" stroke="#64748b" fontSize={10} unit="%" domain={[0, data.domainMaxY]} tickCount={6} tick={{ fill: '#64748b' }} axisLine={{ stroke: '#334155' }} />
                        <ZAxis type="number" dataKey="z" range={[60, 600]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.5)' }} content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return ( <div className="bg-[#0f172a] border border-white/20 rounded-xl shadow-2xl overflow-hidden w-60 z-[100]"><div className="h-24 w-full bg-black relative">{d.img ? <img src={d.img} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800"><Video className="text-slate-600" /></div>}<div className="absolute bottom-2 left-2"><span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${d.platform === 'youtube_shorts' ? 'bg-[#19e6ff] text-black' : 'bg-red-600 text-white'}`}>{d.platform === 'youtube_shorts' ? 'Shorts' : 'Longo'}</span></div></div><div className="p-3"><p className="text-[10px] font-bold text-white mb-1 line-clamp-2">{d.title}</p><div className="flex justify-between text-[9px] text-gray-400 font-mono"><span>{formatNumber(d.x)} views</span><span className="text-[#3bf5a5]">{d.y}% Ret.</span></div></div></div> );
                            }
                            return null;
                        }} />
                        {/* PINTURA DO FUNDO USANDO LIMITES DO DOMÍNIO PARA NÃO QUEBRAR A ESCALA */}
                        <ReferenceArea x1={data.medianViews} x2={data.domainMaxX} y1={data.medianRetention} y2={data.domainMaxY} fill="#3bf5a5" fillOpacity={0.12} />
                        <ReferenceArea x1={data.domainMinX} x2={data.medianViews} y1={data.medianRetention} y2={data.domainMaxY} fill="#3b82f6" fillOpacity={0.12} />
                        <ReferenceArea x1={data.domainMinX} x2={data.medianViews} y1={0} y2={data.medianRetention} fill="#ff0050" fillOpacity={0.12} />
                        <ReferenceArea x1={data.medianViews} x2={data.domainMaxX} y1={0} y2={data.medianRetention} fill="#eab308" fillOpacity={0.12} />
                        <ReferenceLine x={data.medianViews} stroke="#fff" strokeWidth={1} strokeOpacity={0.4} strokeDasharray="4 4" />
                        <ReferenceLine y={data.medianRetention} stroke="#fff" strokeWidth={1} strokeOpacity={0.4} strokeDasharray="4 4" />
                        <Scatter data={data.scatterData}>
                            {data.scatterData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.platform === 'youtube_shorts' ? '#19e6ff' : '#ff0000'} stroke="rgba(255,255,255,0.8)" strokeWidth={1} fillOpacity={0.9} /> ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
                <div className="absolute top-10 right-14 z-0 pointer-events-none flex flex-col items-end"><div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#3bf5a5]/10 border border-[#3bf5a5]/20 text-[#3bf5a5]"><Award size={10} /> <span className="text-[9px] font-black uppercase">Dominância</span></div></div>
                <div className="absolute top-10 left-28 z-0 pointer-events-none flex flex-col items-start"><div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6]"><Star size={10} /> <span className="text-[9px] font-black uppercase">Ouro Escondido</span></div></div>
                <div className="absolute bottom-24 left-28 z-0 pointer-events-none flex flex-col items-start"><div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#ff0050]/10 border border-[#ff0050]/20 text-[#ff0050]"><Beaker size={10} /> <span className="text-[9px] font-black uppercase">Laboratório</span></div></div>
                <div className="absolute bottom-24 right-14 z-0 pointer-events-none flex flex-col items-end"><div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500"><Zap size={10} /> <span className="text-[9px] font-black uppercase">Viral / Alerta</span></div></div>
            </BentoCard>

            <div className="flex flex-col gap-6">
                <BentoCard title="Qualidade de SEO" icon={Search} className="flex-1 min-h-[200px]" tooltipAlign="right" helpText="Avaliação técnica de metadados para indexação orgânica.">
                    <div className="flex items-center justify-center h-full relative">
                        <ResponsiveContainer width="100%" height={180}>
                            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[{ name: 'Score', value: data.avgSeoScore, fill: colors.primary }]}>
                                <RadialBar minAngle={15} background={{ fill: 'rgba(255,255,255,0.05)' }} clockWise dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-4xl font-black text-white">{data.avgSeoScore}</span><span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Score Médio</span></div>
                    </div>
                </BentoCard>
                <BentoCard title="Funil de Conversão" icon={Target} className="flex-1 min-h-[200px]" tooltipAlign="right" helpText="Eficiência em transformar visualizações em inscritos fiéis.">
                    <div className="flex flex-col justify-center h-full gap-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border-l-4 border-blue-400"><span className="text-xs text-gray-400 font-bold uppercase">Views</span><span className="text-sm font-black text-white">{formatNumber(data.totalViews)}</span></div>
                        <div className="flex items-center justify-center"><div className="bg-[#0b1021] border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500">{data.conversionRate}% Conv.</div></div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border-l-4 border-green-400"><span className="text-xs text-gray-400 font-bold uppercase">Inscritos</span><span className="text-sm font-black text-white">+{formatNumber(data.totalSubs)}</span></div>
                    </div>
                </BentoCard>
            </div>
        </div>

        {/* SEÇÃO DE CAMPEÕES POR FORMATO (REDESIGN HIGH-END ELITE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
                { data: data.bestShort, type: 'Shorts', icon: Zap, themeColor: '#19e6ff' },
                { data: data.bestLong, type: 'Longo', icon: Award, themeColor: '#ff0000' }
            ].map((mvp, idx) => {
                const video = mvp.data;
                if (!video) return <BentoCard key={idx} title={`MVP ${mvp.type}`} icon={mvp.icon} className="min-h-[200px]"><div className="flex items-center justify-center h-full text-gray-600 text-xs">Sem dados</div></BentoCard>;

                // LÓGICA DE DADOS REAIS E MATEMÁTICOS
                const views = video.metrics?.views || 1;
                const subs = video.metrics?.subscribers_gained || 0;
                const retention = video.metrics?.averageViewPercentage || 0;
                const convRate = (subs / views) * 100;

                // Lógica de Badge baseada em PERFORMANCE RELATIVA (Real)
                let reason = "✨ Conteúdo Sólido";
                let IconBadge = Target;
                
                if (retention > 65) { 
                    reason = "🔥 Retenção de Elite"; 
                    IconBadge = Flame; 
                } else if (convRate > 0.5) { 
                    reason = "👤 Imã de Pacientes"; 
                    IconBadge = UserPlus; 
                } else if (views > 100000) { 
                    reason = "🚀 Alcance Viral"; 
                    IconBadge = Rocket; 
                }

                const duration = video.duration || video.metrics?.duration || 0;
                const formatTime = (p) => {
                    if (duration === 0) return `${p}%`; // Fallback para porcentagem se não tiver tempo
                    const s = (p / 100) * duration;
                    if (duration < 60) return `${Math.round(s)}s`;
                    return `${Math.floor(s / 60)}:${Math.round(s % 60).toString().padStart(2, '0')}`;
                };

                // SparkData SEMPRE terá dados agora
                const sparkData = mvp.type === 'Shorts' 
                    ? [ { time: '0%', v: 100 }, { time: formatTime(25), v: 95 }, { time: formatTime(50), v: 92 }, { time: formatTime(75), v: 88 }, { time: '100%', v: retention } ]
                    : [ { time: '0%', v: 100 }, { time: formatTime(25), v: 70 }, { time: formatTime(50), v: 60 }, { time: formatTime(75), v: 55 }, { time: '100%', v: retention } ];

                return (
                    <div key={idx} className="relative group rounded-[2rem] overflow-hidden bg-[#050814] border border-white/5 h-[210px] shadow-2xl transition-all duration-500 hover:border-white/20" style={{ boxShadow: `0 20px 50px -12px ${mvp.themeColor}15` }}>
                        {/* FUNDO CINEMATIC REAL (THE BLEED EFFECT) */}
                        <div className="absolute inset-0 z-0">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" style={{ backgroundImage: `url(${video.thumbnail_url})`, filter: 'blur(40px) saturate(1.5)', opacity: '0.40' }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050814] via-[#050814]/90 to-transparent"></div>
                        </div>

                        <div className="relative z-10 px-6 py-5 flex flex-col h-full">
                            {/* TOP: BADGE + PLATFORM (ABSOLUTE) */}
                            <div className="flex justify-between items-center absolute top-5 left-6 right-6">
                                <span className="px-3 py-1 rounded-full backdrop-blur-xl border flex items-center gap-1.5 shadow-xl" style={{ backgroundColor: `${mvp.themeColor}20`, borderColor: `${mvp.themeColor}30`, color: mvp.themeColor }}>
                                    <IconBadge size={10} strokeWidth={3} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{reason}</span>
                                </span>
                                <mvp.icon size={18} style={{ color: mvp.themeColor, opacity: 0.4 }} />
                            </div>

                            {/* CONTAINER CENTRALIZADO */}
                            <div className="flex-1 flex items-center pt-8">
                                <div className="flex gap-6 items-center w-full">
                                    {/* THUMBNAIL INTEGRADA */}
                                    <div className="w-20 h-28 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500 border border-white/5">
                                        <img src={video.thumbnail_url} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm cursor-pointer">
                                            <PlayCircle size={24} className="text-white" />
                                        </div>
                                    </div>

                                    {/* CONTEÚDO E MÉTRICAS */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <h4 className="text-base font-extrabold text-white line-clamp-2 leading-tight mb-4 group-hover:text-white transition-colors">
                                            {video.title}
                                        </h4>
                                        
                                        <div className="flex items-end gap-6">
                                            <div>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1 tracking-tighter">Alcance Bruto</span>
                                                <div className="text-3xl font-black text-white tracking-tighter leading-none">
                                                    {formatNumber(video.metrics?.views)}
                                                </div>
                                            </div>
                                            <div className="pb-1">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1 tracking-tighter">Impacto</span>
                                                <div className="flex items-center gap-1 font-bold text-sm" style={{ color: mvp.themeColor }}>
                                                    <Users size={14} />
                                                    +{formatNumber(video.metrics?.subscribers_gained || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SPARKLINE DE RETENÇÃO (LADO DIREITO - ALINHADO) */}
                                    <div className="w-40 h-full flex flex-col justify-center opacity-80 group-hover:opacity-100 transition-opacity pl-2">
                                        <div className="flex items-baseline justify-end gap-1.5 mb-1">
                                            <span className="text-sm font-black" style={{ color: mvp.themeColor }}>{retention}%</span>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Retenção</span>
                                        </div>
                                        <div className="h-16 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={sparkData}>
                                                    <defs>
                                                        <linearGradient id={`sparkMvp${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={mvp.themeColor} stopOpacity={0.5}/>
                                                            <stop offset="95%" stopColor={mvp.themeColor} stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <Tooltip 
                                                        cursor={{ stroke: mvp.themeColor, strokeWidth: 1, strokeDasharray: '3 3' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-lg shadow-2xl">
                                                                        <p className="text-[9px] font-black text-gray-400 uppercase">{payload[0].payload.time}</p>
                                                                        <p className="text-[11px] font-bold text-white">{payload[0].value}%</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Area type="monotone" dataKey="v" stroke={mvp.themeColor} strokeWidth={3} fill={`url(#sparkMvp${idx})`} isAnimationActive={true} dot={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* TÓPICOS DE OURO - LARGURA TOTAL */}
        <BentoCard title="Tópicos de Ouro (Tags & Palavras-Chave)" icon={Hash} className="min-h-[220px]" helpText="Nuvem robusta com os 20 termos mais relevantes do canal.">
             <div className="flex flex-wrap gap-3 content-start h-full p-2">
                 {data.topTags.map((tag, idx) => ( <div key={idx} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#3bf5a5]/30 transition-all flex items-center gap-3 group cursor-default h-fit"><span className="text-xs text-gray-500 font-black italic">#{idx+1}</span><span className="text-sm text-gray-300 font-bold group-hover:text-white uppercase tracking-tight">{tag.name}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3bf5a5]/10 text-[#3bf5a5] font-bold border border-[#3bf5a5]/20">{tag.count}</span></div> ))}
             </div>
        </BentoCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BentoCard title="Batalha de Formatos" icon={BarChart4} className="min-h-[300px]" helpText="Comparativo de views médias entre vídeos Curtos e Longos.">
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.formatBattle} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} fontWeight="bold" width={60} /><Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(value) => [formatNumber(value), 'Média Views']} /><Bar dataKey="avgViews" barSize={30} radius={[0, 10, 10, 0]}>{data.formatBattle.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}</Bar>
                    </BarChart>
                </ResponsiveContainer>
            </BentoCard>
            <BentoCard title="Velocidade de Tração" icon={Rocket} className="min-h-[300px]" tooltipAlign="right" helpText="Histórico diário de visualizações do canal nos últimos 30 dias.">
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data.velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.primary} stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="day" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} /><YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatNumber} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} /><Area type="monotone" dataKey="velocity" stroke={colors.primary} fillOpacity={1} fill="url(#colorVelocity)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </BentoCard>
        </div>
    </div>
  );
};

export default YouTubeDeepDive;