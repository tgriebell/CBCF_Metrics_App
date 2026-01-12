import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  TrendingUp, Users, Target, Zap, Activity,
  Award, BarChart4, Rocket, Eye, ThumbsUp,
  MessageCircle, Share2, Filter, Clock,
  Crosshair, Hash, Play, HelpCircle, X
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  BarChart, Bar, AreaChart, Area, ReferenceLine, ReferenceArea
} from 'recharts';

// --- CORES & TEMA TIKTOK ---
const colors = {
  primary: '#00f2ea',    // TikTok Cyan
  secondary: '#ff0050',  // TikTok Red/Pink
  accent: '#ffffff',     // White
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

    // Fecha ao clicar fora
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
                className={`text-gray-600 hover:text-white transition-colors flex items-center justify-center ${isOpen ? 'text-[#00f2ea]' : ''}`}
                title="Entenda esta métrica"
            >
                <HelpCircle size={13} />
            </button>

            {isOpen && (
                <div className={`absolute bottom-full mb-3 w-64 bg-[#0f172a] border border-white/20 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[100] animate-enter ${containerClasses}`}>
                    <div className="p-4 relative">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-[11px] font-black text-[#00f2ea] uppercase tracking-wider pr-4">{title}</h4>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white"><X size={12}/></button>
                        </div>
                        <p className="text-[11px] text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                            {text}
                        </p>
                        {/* Seta do Balão */}
                        <div className={`absolute -bottom-1.5 w-3 h-3 bg-[#0f172a] border-b border-r border-white/20 rotate-45 ${arrowClasses}`}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- WIDGETS ---

const StatCard = ({ icon: Icon, label, value, subtext, color, trend, helpText, tooltipAlign = 'center', bgOpacity = '0.05' }) => (
  <div className="rounded-3xl bg-[#0b1021] border border-white/5 relative group hover:border-white/10 transition-all shadow-lg">
    {/* Background Icon Container (Overflow Hidden) */}
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className={`absolute -top-6 -right-6 transition-opacity transform rotate-12`} style={{ color, opacity: bgOpacity }}>
           <Icon size={140} />
        </div>
    </div>
    
    <div className="relative z-10 p-5">
       <div className="flex items-center mb-2 h-6"> {/* Altura fixa para alinhamento */}
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
            {Icon && <Icon size={14} className="text-[#00f2ea] mr-2" />} 
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

const TikTokDeepDive = ({ posts, dailyData, audience }) => {
  const [durationFilter, setDurationFilter] = useState('all'); // 'all', 'short' (<60s), 'long' (>60s)
  const [densityFilter, setDensityFilter] = useState('top100'); // 'all', 'top100'
  const [hoveredPointId, setHoveredPointId] = useState(null);

  // --- ENGINE DE CÁLCULO (TikTok 2.0) ---
  const data = useMemo(() => {
    // 1. Filtragem Inicial (Plataforma + Duração)
    let tkPosts = posts.filter(p => p.platform.includes('tiktok'));

    if (durationFilter === 'short') {
        tkPosts = tkPosts.filter(p => (p.metrics?.duration || 0) <= 60);
    } else if (durationFilter === 'long') {
        tkPosts = tkPosts.filter(p => (p.metrics?.duration || 0) > 60);
    }
    
    // 2. Totais Gerais (Calculados ANTES do filtro de densidade para manter KPIs reais)
    const totalViews = tkPosts.reduce((acc, p) => acc + (p.metrics?.views || 0), 0);
    const totalLikes = tkPosts.reduce((acc, p) => acc + (p.metrics?.likes || 0), 0);
    const totalComments = tkPosts.reduce((acc, p) => acc + (p.metrics?.comments || 0), 0);
    const totalShares = tkPosts.reduce((acc, p) => acc + (p.metrics?.shares || 0), 0);
    
    // 3. Scores Avançados
    const viralScore = totalViews > 0 ? ((totalShares / totalViews) * 1000).toFixed(2) : "0.00"; // Shares por 1k views
    const communityIndex = totalViews > 0 ? ((totalComments / totalViews) * 1000).toFixed(2) : "0.00"; // Comments por 1k views
    
    // 4. Preparação para Matriz (Cálculo de Scores Individuais)
    let processedPosts = tkPosts.map(p => {
        const v = p.metrics?.views || 1;
        const l = p.metrics?.likes || 0;
        const c = p.metrics?.comments || 0;
        const s = p.metrics?.shares || 0;
        
        // FÓRMULA PONDERADA: (Likes*1 + Comments*3 + Shares*5) / Views * 100
        // Ajuste: Adicionado +1 no denominador para evitar divisão por zero e suavizar
        const weightedEng = ((l + (c * 3) + (s * 5)) / Math.max(v, 1)) * 100;
        
        // Viral Ratio (Share Density) para Colorização
        const viralRatio = (s / Math.max(v, 1)) * 100;

        return {
            id: p.id,
            title: p.title,
            img: p.thumbnail_url,
            x: v, 
            y: Math.max(weightedEng, 0.1), // Garante valor positivo para log scale
            z: v, // Tamanho da bolinha = Views
            viralRatio, 
            duration: p.metrics?.duration || 0,
            platform: 'tiktok',
            rawScore: weightedEng * Math.log10(v + 1) // Score composto para ranking (Engajamento * Alcance)
        };
    });

    // Filtro de Ruído (Views muito baixos)
    processedPosts = processedPosts.filter(p => p.x > 50);

    // 5. Filtro de Densidade (Top 100)
    if (densityFilter === 'top100') {
        // Ordena por um "Score de Relevância" (Views * Engajamento) para manter os mais importantes
        processedPosts.sort((a, b) => b.rawScore - a.rawScore);
        processedPosts = processedPosts.slice(0, 100);
    }

    const scatterData = processedPosts;

    // 6. Eixos Dinâmicos & Medianas (Recalculados com base nos dados FILTRADOS)
    const allViews = scatterData.map(d => d.x);
    const allEng = scatterData.map(d => d.y);
    
    const medianViews = calculateMedian(allViews) || 1000;
    const medianEng = calculateMedian(allEng) || 5;

    const minViewFound = Math.min(...allViews, 100);
    const domainMinX = minViewFound * 0.8; 
    const maxViewsFound = Math.max(...allViews, 1000);
    const domainMaxX = maxViewsFound * 1.5; 

    // Eixo Y Logarítmico: Precisa de um mínimo > 0
    const minEngFound = Math.min(...allEng, 0.1);
    const domainMinY = Math.max(minEngFound * 0.5, 0.1); // Nunca zero
    const maxEngFound = Math.max(...allEng, 10);
    const domainMaxY = maxEngFound * 1.5; // Espaço extra no topo

    // 7. Melhor Vídeo (MVP)
    const bestVideo = [...tkPosts].sort((a,b) => {
        const scoreA = ((a.metrics?.likes||0) + (a.metrics?.comments||0)*3 + (a.metrics?.shares||0)*5) / (a.metrics?.views||1);
        const scoreB = ((b.metrics?.likes||0) + (b.metrics?.comments||0)*3 + (b.metrics?.shares||0)*5) / (b.metrics?.views||1);
        return scoreB - scoreA;
    })[0];

    // 8. Velocidade
    const velocityData = dailyData.map(d => ({
        day: d.day,
        velocity: d.tiktok.views
    }));

    return {
        totalViews, totalLikes, totalComments, totalShares,
        viralScore, communityIndex,
        scatterData, bestVideo, velocityData,
        medianViews, medianEng, 
        domainMaxX, domainMinX, 
        domainMaxY, domainMinY
    };
  }, [posts, dailyData, durationFilter, densityFilter]);

  return (
    <div className="space-y-6 pb-20 animate-enter"> 
        
        {/* CONTROLES (DURAÇÃO + DENSIDADE) */}
        <div className="flex justify-center mb-2 gap-4">
            {/* Filtro Duração */}
            <div className="bg-[#0b1021] border border-white/10 p-1 rounded-xl flex gap-1 shadow-lg">
                <button 
                   onClick={() => setDurationFilter('all')}
                   className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${durationFilter === 'all' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-white'}`}
                >
                    <Filter size={14} /> Todos
                </button>
                <button 
                   onClick={() => setDurationFilter('short')}
                   className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${durationFilter === 'short' ? 'bg-[#00f2ea]/20 text-[#00f2ea] shadow-inner' : 'text-gray-500 hover:text-white'}`}
                >
                    <Zap size={14} /> Rápidos (&lt;60s)
                </button>
                <button 
                   onClick={() => setDurationFilter('long')}
                   className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${durationFilter === 'long' ? 'bg-[#ff0050]/20 text-[#ff0050] shadow-inner' : 'text-gray-500 hover:text-white'}`}
                >
                    <Clock size={14} /> Densos (&gt;60s)
                </button>
            </div>

            {/* Filtro Densidade */}
            <div className="bg-[#0b1021] border border-white/10 p-1 rounded-xl flex gap-1 shadow-lg">
                 <button 
                   onClick={() => setDensityFilter('top100')}
                   className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${densityFilter === 'top100' ? 'bg-[#facc15]/20 text-[#facc15] shadow-inner' : 'text-gray-500 hover:text-white'}`}
                   title="Mostra apenas os 100 vídeos mais relevantes"
                >
                    <Target size={14} /> Top 100
                </button>
                <button 
                   onClick={() => setDensityFilter('all')}
                   className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${densityFilter === 'all' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-white'}`}
                >
                    <Hash size={14} /> Todos
                </button>
            </div>
        </div>

        {/* 1. KPIs ESTRATÉGICOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                icon={Eye} label="Alcance Total" 
                value={formatNumber(data.totalViews)} 
                subtext="Visualizações no Período" 
                color={colors.primary} 
                helpText="Soma de todas as visualizações dos vídeos filtrados no período.\n\nIndica a escala de distribuição do conteúdo na plataforma."
            />
            <StatCard 
                icon={Share2} label="Viral Score" 
                value={data.viralScore} 
                subtext="Shares por 1k Views" 
                color={colors.secondary} 
                bgOpacity="0.10"
                helpText="Métrica de elite que mede a 'contagiosidade' do conteúdo.\n\nFórmula: (Compartilhamentos / Visualizações) * 1000.\n\nInterpretação: Indica quantos compartilhamentos seu vídeo gera a cada 1.000 visualizações. Um score acima de 5.0 indica alto potencial viral."
            />
            <StatCard 
                icon={MessageCircle} label="Community Index" 
                value={data.communityIndex} 
                subtext="Comentários por 1k Views" 
                color="#8b5cf6" 
                tooltipAlign="right"
                helpText="Mede a capacidade do conteúdo de gerar conversas e debates.\n\nFórmula: (Comentários / Visualizações) * 1000.\n\nInterpretação: Indica quantos comentários são gerados a cada 1.000 visualizações. Alto índice sugere comunidade forte e fiel."
            />
            <StatCard 
                icon={Activity} label="Engajamento" 
                value={data.medianEng.toFixed(1) + '%'} 
                subtext="Média (Mediana) do Grupo" 
                color="#facc15" 
                tooltipAlign="right"
                helpText="A taxa média de engajamento dos vídeos analisados, usando a mediana para ignorar outliers extremos.\n\nO cálculo pondera Shares (x5) e Comentários (x3) mais que Likes (x1), refletindo o algoritmo real do TikTok."
            />
        </div>

        {/* 2. MATRIZ DE DOMINÂNCIA TIKTOK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BentoCard 
                title="Matriz Viral: Engajamento Ponderado vs. Alcance" 
                icon={Crosshair} 
                className="lg:col-span-2 min-h-[600px] relative"
                headerAction={
                    <div className="text-[9px] text-gray-500 font-mono hidden md:block">
                        MEDIANAS DINÂMICAS: {formatNumber(data.medianViews)} views / {data.medianEng.toFixed(1)}% eng
                    </div>
                }
                helpText="Esta ferramenta visual cruza o Alcance (Eixo X) com a Qualidade (Eixo Y).\n\n• Topo Direito (Azul): Vídeos Virais e Engajados (Ouro).\n• Topo Esquerdo (Roxo): Comunidade Fiel (Baixo alcance, alto amor).\n• Fundo Esquerdo (Amarelo): Super Viral (Alta taxa de share, potencial explosivo).\n• Fundo Direito (Vermelho): Polêmica ou Baixa Performance.\n\nUse para identificar padrões de sucesso."
            >
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} horizontal={false} />
                        
                        {/* Eixo X Logarítmico (Views) - TICKS COMPLETOS */}
                        <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Views" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            scale="log" 
                            domain={[data.domainMinX, data.domainMaxX]} 
                            ticks={[100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000]}
                            allowDataOverflow={true}
                            tick={{ fill: '#94a3b8' }}
                            axisLine={{ stroke: '#334155' }}
                            padding={{ left: 10, right: 30 }}
                            tickFormatter={(val) => {
                                if (val >= 1000000) return (val/1000000).toFixed(0) + 'M';
                                if (val >= 1000) return (val/1000).toFixed(0) + 'k';
                                return val.toFixed(0);
                            }}
                            label={{ value: 'Alcance (Views)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        />

                        {/* Eixo Y LOGARÍTMICO (Engajamento Ponderado) */}
                        <YAxis 
                            type="number" 
                            dataKey="y" 
                            name="Score" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            scale="log" 
                            domain={[data.domainMinY, data.domainMaxY]} 
                            allowDataOverflow={true}
                            tickCount={6}
                            tick={{ fill: '#94a3b8' }}
                            axisLine={{ stroke: '#334155' }}
                            tickFormatter={(val) => val >= 10 ? val.toFixed(0) : val.toFixed(1)}
                            label={{ value: 'Qualidade (Engajamento)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        />

                        <ZAxis type="number" dataKey="z" range={[60, 600]} />

                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.5)' }}
                            wrapperStyle={{ pointerEvents: 'none' }} // CORREÇÃO DO PISCA-PISCA: Mouse ignora o tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-[#0f172a] border border-white/20 rounded-xl shadow-2xl overflow-hidden w-64 z-[100]">
                                            <div className="h-32 w-full bg-black relative">
                                                {d.img ? <img src={d.img} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800"><Activity className="text-slate-600" /></div>}
                                                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[8px] font-mono text-white border border-white/10">
                                                    ID: {d.id}
                                                </div>
                                                <div className="absolute bottom-2 left-2"><span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-[#00f2ea] text-black">TikTok</span></div>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-[10px] font-bold text-white mb-2 line-clamp-2 leading-tight">{d.title}</p>
                                                
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    <div className="bg-white/5 rounded p-1.5">
                                                        <span className="text-[8px] text-gray-500 uppercase block">Views</span>
                                                        <span className="text-xs font-mono text-white">{formatNumber(d.x)}</span>
                                                    </div>
                                                    <div className="bg-[#00f2ea]/10 rounded p-1.5">
                                                        <span className="text-[8px] text-[#00f2ea] uppercase block">Score</span>
                                                        <span className="text-xs font-mono text-white">{d.y.toFixed(1)}</span>
                                                    </div>
                                                </div>

                                                <div className="text-[8px] text-gray-500 font-mono border-t border-white/10 pt-2 flex justify-between items-center">
                                                    <span>Viral Score: <span className="text-white">{d.viralRatio.toFixed(2)}</span></span>
                                                    {d.viralRatio > 0.5 && <span className="text-[#facc15] font-bold flex items-center gap-1"><Zap size={8}/> VIRAL</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Quadrantes (Ajustados para Log Scale) - Opacidade Aumentada */}
                        <ReferenceArea x1={data.medianViews} x2={data.domainMaxX} y1={data.medianEng} y2={data.domainMaxY} fill="#00f2ea" fillOpacity={0.12} /> {/* Viral & Engajado */}
                        <ReferenceArea x1={data.domainMinX} x2={data.medianViews} y1={data.medianEng} y2={data.domainMaxY} fill="#8b5cf6" fillOpacity={0.12} /> {/* Comunidade Fiel */}
                        
                        {/*QUADRANTE INFERIOR ESQUERDO AGORA É O AMARELO (Super Viral/High Share potential) */}
                        <ReferenceArea x1={data.domainMinX} x2={data.medianViews} y1={data.domainMinY} y2={data.medianEng} fill="#facc15" fillOpacity={0.12} /> 
                        
                        <ReferenceArea x1={data.medianViews} x2={data.domainMaxX} y1={data.domainMinY} y2={data.medianEng} fill="#ff0050" fillOpacity={0.12} /> {/* Polêmica/Vazio */}

                        <ReferenceLine x={data.medianViews} stroke="#fff" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="4 4" />
                        <ReferenceLine y={data.medianEng} stroke="#fff" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="4 4" />

                        <Scatter 
                            data={data.scatterData}
                            onMouseEnter={(node) => setHoveredPointId(node.id)}
                            onMouseLeave={() => setHoveredPointId(null)}
                        >
                            {data.scatterData.map((entry, index) => {
                                // LÓGICA DE CORES POR QUADRANTE (REFINADA)
                                let fill = '#cbd5e1'; 
                                if (entry.x >= data.medianViews && entry.y >= data.medianEng) fill = '#00f2ea'; // Top Right
                                else if (entry.x < data.medianViews && entry.y >= data.medianEng) fill = '#8b5cf6'; // Top Left
                                else if (entry.x >= data.medianViews && entry.y < data.medianEng) fill = '#ff0050'; // Bottom Right
                                else fill = '#facc15'; // Bottom Left (AMARELO - Alcance e Engajamento baixos)

                                // Super Viral override (Baseado no ratio de shares)
                                if (entry.viralRatio > 1.5) fill = '#facc15'; 

                                const isHovered = hoveredPointId === entry.id;
                                const isOutlier = entry.rawScore > (data.scatterData[0]?.rawScore * 0.8);
                                
                                let opacity = 1; 
                                let stroke = "rgba(0,0,0,0.5)"; // Borda escura para dar profundidade
                                let strokeWidth = 1;

                                if (isHovered) {
                                    stroke = "#fff";
                                    strokeWidth = 3;
                                } else if (isOutlier) {
                                    stroke = "rgba(255,255,255,0.6)";
                                    strokeWidth = 2;
                                }

                                return (
                                    <Cell 
                                        key={`cell-${index}`}
                                        fill={fill} 
                                        stroke={stroke} 
                                        strokeWidth={strokeWidth}
                                        fillOpacity={opacity}
                                        style={{ transition: 'all 0.2s ease-out', cursor: 'pointer' }}
                                    />
                                );
                            })}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>

                {/* Legenda dos Quadrantes - POSICIONAMENTO CORRIGIDO (Mais para cima) */}
                <div className="absolute top-8 right-16 pointer-events-none flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase text-[#00f2ea]">Viral & Engajado</span>
                </div>
                <div className="absolute top-8 left-24 pointer-events-none flex flex-col items-start">
                    <span className="text-[9px] font-black uppercase text-[#8b5cf6]">Comunidade Fiel</span>
                </div>
                <div className="absolute bottom-20 right-16 pointer-events-none flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase text-[#ff0050]">Polêmica / Vazio</span>
                </div>
                <div className="absolute bottom-20 left-24 pointer-events-none flex flex-col items-start">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]"></div>
                        <span className="text-[9px] font-bold text-yellow-400 uppercase">Super Viral (High Share)</span>
                    </div>
                </div>
            </BentoCard>

            {/* Coluna Direita: Métricas Detalhadas */}
            <div className="flex flex-col gap-6">
                
                {/* Distribuição de Interações */}
                <BentoCard 
                    title="Mix de Interações" 
                    icon={BarChart4} 
                    className="flex-1 min-h-[200px]"
                    tooltipAlign="right"
                    helpText="Visualiza a proporção entre Likes, Comentários e Compartilhamentos.\n\nUm perfil saudável não vive só de likes. Se a barra de Shares (Vermelha) ou Comentários (Azul) estiver muito baixa em relação aos Likes, seu conteúdo está sendo consumido passivamente."
                >
                     <div className="h-full flex flex-col justify-center gap-4">
                        <div className="relative pt-6">
                            <div className="flex justify-between text-xs text-gray-400 mb-1 font-bold">
                                <span>Likes (x1)</span>
                                <span>{formatNumber(data.totalLikes)}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div className="bg-white h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex justify-between text-xs text-[#00f2ea] mb-1 font-bold">
                                <span>Comentários (x3)</span>
                                <span>{formatNumber(data.totalComments)}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div className="bg-[#00f2ea] h-2 rounded-full" style={{ width: `${Math.min((data.totalComments/data.totalLikes)*100*5, 100)}%` }}></div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex justify-between text-xs text-[#ff0050] mb-1 font-bold">
                                <span>Shares (x5)</span>
                                <span>{formatNumber(data.totalShares)}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div className="bg-[#ff0050] h-2 rounded-full" style={{ width: `${Math.min((data.totalShares/data.totalLikes)*100*10, 100)}%` }}></div>
                            </div>
                        </div>
                     </div>
                </BentoCard>

                {/* Velocidade */}
                <BentoCard 
                    title="Velocidade de Tração" 
                    icon={Rocket} 
                    className="flex-1 min-h-[200px]"
                    tooltipAlign="right"
                    helpText="Mostra o volume diário de visualizações nos últimos 30 dias.\n\nPicos indicam viralização ou sucesso de um post específico. Quedas constantes sugerem fadiga de conteúdo ou shadowban."
                >
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={data.velocityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTkVel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00f2ea" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#00f2ea" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="day" hide />
                            <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="velocity" stroke="#00f2ea" fillOpacity={1} fill="url(#colorTkVel)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </BentoCard>

            </div>
        </div>

        {/* 3. VÍDEO CAMPEÃO PONDERADO */}
        {data.bestVideo && (
            <BentoCard 
                title="MVP: O Vídeo Mais Valioso (Score Ponderado)" 
                icon={Award} 
                className="min-h-[180px]"
                helpText="O vídeo campeão do período, eleito não apenas por views, mas pelo 'Score Ponderado'.\n\nIsso significa que este vídeo equilibrou perfeitamente Alcance massivo com alta qualidade de Engajamento (Likes, Comentários e Shares). É o seu modelo a ser replicado."
            >
                <div className="flex gap-6 items-center h-full">
                        <div className="w-24 h-32 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 relative group">
                            {data.bestVideo.thumbnail_url ? (
                                <img src={data.bestVideo.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Activity className="text-slate-600"/></div>
                            )}
                            <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-[9px] font-black px-2 py-0.5 rounded shadow-lg">TOP 1</div>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-white mb-3 line-clamp-2">{data.bestVideo.title}</h4>
                            <div className="flex flex-wrap gap-4">
                                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Views</span>
                                    <span className="text-sm font-mono text-white">{formatNumber(data.bestVideo.metrics?.views)}</span>
                                </div>
                                <div className="px-3 py-2 rounded-lg bg-[#00f2ea]/10 border border-[#00f2ea]/20">
                                    <span className="text-[10px] text-[#00f2ea] font-bold uppercase block">Score</span>
                                    <span className="text-sm font-mono text-white">
                                        {(((data.bestVideo.metrics?.likes||0) + (data.bestVideo.metrics?.comments||0)*3 + (data.bestVideo.metrics?.shares||0)*5) / (data.bestVideo.metrics?.views||1) * 100).toFixed(1)} pts
                                    </span>
                                </div>
                                <div className="px-3 py-2 rounded-lg bg-[#ff0050]/10 border border-[#ff0050]/20">
                                    <span className="text-[10px] text-[#ff0050] font-bold uppercase block">Shares</span>
                                    <span className="text-sm font-mono text-white">{formatNumber(data.bestVideo.metrics?.shares)}</span>
                                </div>
                            </div>
                        </div>
                </div>
            </BentoCard>
        )}

    </div>
  );
};

export default TikTokDeepDive;
