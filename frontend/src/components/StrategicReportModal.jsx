import React from 'react';
import { 
  X, BrainCircuit, Target, Sparkles, TrendingUp, 
  Quote, Zap, Activity, AlertTriangle, CheckCircle, Lock,
  Thermometer, BarChart3, ArrowDown, Users, Eye, MousePointerClick,
  ShieldAlert, Lightbulb, AlertCircle, ThumbsUp, ThumbsDown, Star, RefreshCw,
  Search, BarChart, FileText, Share2, Layers, MessageSquare, MessageCircle, Play, Youtube,
  Megaphone, Compass
} from 'lucide-react';

const StrategicReportModal = ({ isOpen, onClose, insight, post, isLoading }) => {
  if (!isOpen || !insight) return null;

  // --- CONFIGURAÇÃO VISUAL v11.0 ---
  const score = insight.score || 0;
  
  let themeColor = "#ef4444"; // Vermelho
  if (score >= 50) themeColor = "#eab308"; // Amarelo
  if (score >= 80) themeColor = "#3bf5a5"; // Verde Neon

  // Cores do Funil
  const funnelColors = {
      top: 'bg-green-500/10 border-green-500/20 text-green-400', 
      middle: score > 50 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500',
      bottom: score > 80 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-500 pulsate-red'
  };

  // --- LÓGICA DE CONTEÚDO ---
  let diagnosisPoints = [];
  if (insight.diagnosis_points && Array.isArray(insight.diagnosis_points) && insight.diagnosis_points.length > 1) {
      diagnosisPoints = insight.diagnosis_points;
  } else {
      const fullText = insight.funnel_diagnosis || "Análise em processamento.";
      const sentences = fullText.split('. ').filter(s => s.length > 5);
      diagnosisPoints = [
          { title: "Atração & Tráfego", content: sentences[0] || fullText, sentiment: "neutral", level: 80 },
          { title: "Barreira de Retenção", content: sentences[1] || "Queda identificada nos primeiros segundos.", sentiment: "negative", level: 40 },
          { title: "Engajamento Real", content: sentences[2] || "Interação abaixo do esperado.", sentiment: "negative", level: 30 },
          { title: "Oportunidade Viral", content: "Otimizar thumbnail para CTR.", sentiment: "positive", level: 90 }
      ];
  }

  const baseActions = insight.actionable_steps || (insight.actionable_step ? [insight.actionable_step] : []);
  const fillerActions = [
      "Otimizar Miniatura (Thumbnail) para aumentar a Taxa de Clique (CTR).",
      "Revisar Título focando em Curiosidade em vez de apenas SEO.",
      "Adicionar Capítulos (Timestamps) para melhorar a experiência.",
      "Criar um comentário fixado com uma pergunta para gerar debate.",
      "Compartilhar o link em comunidades nichadas.",
      "Revisar os primeiros 30 segundos para remover silêncios.",
      "Aplicar 'End Screens' direcionando para vídeo complementar.",
      "Analisar o gráfico de retenção para identificar a queda exata."
  ];

  let finalActions = [...baseActions];
  fillerActions.forEach(action => {
      if (finalActions.length < 8 && !finalActions.some(a => a.substring(0, 10) === action.substring(0, 10))) {
          finalActions.push(action);
      }
  });

  // Helpers
  const getFixedIcon = (index) => {
      const icons = [Search, AlertTriangle, Users, Star];
      return icons[index] || Activity;
  };

  const getSentimentStyle = (sentiment) => {
      if (sentiment === 'positive') return 'bg-green-500/5 border-green-500/20 text-green-400';
      if (sentiment === 'negative') return 'bg-red-500/5 border-red-500/20 text-red-400';
      return 'bg-blue-500/5 border-blue-500/20 text-blue-400';
  };

  return (
    <div className="fixed inset-0 bg-[#02040a]/98 backdrop-blur-xl z-[90] flex items-center justify-center p-4 animate-fade-in font-sans">
      <style>
        {`
          .pulsate-red { animation: pulsate-red 2s infinite; }
          @keyframes pulsate-red {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            50% { box-shadow: 0 0 20px 5px rgba(239, 68, 68, 0); }
          }
        `}
      </style>
      
      <div 
        className="w-full max-w-6xl bg-[#050814] border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] animate-scale-in relative overflow-hidden transition-all"
      >
        {/* Top Glow Line */}
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}` }} />

        {/* --- HEADER --- */}
        <div className="flex flex-shrink-0 items-center justify-between px-8 py-6 border-b border-slate-800/60 bg-[#0a0f1f]/80">
           
           <div className="flex items-center gap-6">
               {/* Score Circular CORRIGIDO (Div redonda com sombra, sem filtro SVG) */}
               <div 
                    className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ boxShadow: `0 0 25px ${themeColor}40`, border: `2px solid ${themeColor}20` }}
               >
                    <svg className="w-full h-full rotate-[-90deg] absolute inset-0" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="text-slate-800" stroke="currentColor" strokeWidth="2.5" />
                        <circle 
                            cx="18" cy="18" r="16" fill="none" 
                            className="transition-all duration-1000 ease-out"
                            style={{ color: themeColor }} // Removido drop-shadow do SVG
                            stroke="currentColor" strokeWidth="2.5"
                            strokeDasharray={`${score}, 100`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="relative text-2xl font-black text-white italic tracking-tighter leading-none">{score}</span>
                </div>

                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Autópsia Estratégica
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-slate-900 px-2 py-1 rounded border border-slate-800">
                             {post?.platform?.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border shadow-sm" 
                              style={{ color: themeColor, borderColor: `${themeColor}40`, backgroundColor: `${themeColor}10` }}>
                             STATUS: {insight.verdict_badge}
                        </span>
                    </div>
                </div>
           </div>
           
           <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all hover:rotate-90">
              <X size={24} />
           </button>
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="flex-1 overflow-y-auto custom-scroll p-8 space-y-8">
           
           {/* BLOCO 1: FUNDAMENTOS */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> 
               
               {/* Psicologia */}
               <div className="bg-[#0f1422] border border-slate-800/60 p-6 rounded-[2rem] relative overflow-hidden flex flex-col hover:border-purple-500/30 transition-all h-full group shadow-lg">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Zap size={80} className="text-purple-500" />
                   </div>
                   <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <Lock size={12} /> Psicologia do Vídeo
                   </h3>
                   <div className="flex-grow flex flex-col justify-center">
                       <h2 className="text-xl font-black text-white uppercase italic tracking-tight leading-tight">
                           "{insight.psychological_trigger}"
                       </h2>
                   </div>
               </div>

               {/* Hook Analysis */}
               <div className="bg-[#0f1422] border border-slate-800/60 p-6 rounded-[2rem] relative overflow-hidden flex flex-col hover:border-blue-500/30 transition-all h-full group shadow-lg">
                   <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <MousePointerClick size={12} /> Retenção no Hook
                   </h3>
                   <div className="flex-grow flex items-center">
                        <p className="text-sm text-slate-200 font-medium leading-relaxed italic border-l-2 border-blue-500/30 pl-4">
                           {insight.hook_analysis}
                        </p>
                   </div>
                   <div className="mt-4 pt-4 border-t border-slate-800/50">
                       <div className="flex justify-between mb-1">
                           <span className="text-[9px] font-bold text-slate-600 uppercase">Impacto</span>
                           <span className="text-[9px] font-bold text-blue-400 uppercase">{Math.min(score + 12, 99)}%</span>
                       </div>
                       <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(score + 12, 100)}%` }} />
                       </div>
                   </div>
               </div>

                {/* Funil Visual Compacto */}
               <div className="bg-[#0f1422] border border-slate-800/60 p-6 rounded-[2rem] flex flex-col justify-between h-full gap-2 shadow-lg">
                   <div className={`flex items-center justify-between p-3 rounded-xl border ${funnelColors.top}`}>
                       <div className="flex items-center gap-3">
                            <Eye size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Atração</span>
                       </div>
                       <div className="w-1.5 h-1.5 rounded-full bg-current" />
                   </div>
                   <div className="flex justify-center"><ArrowDown size={12} className="text-slate-800" /></div>
                   <div className={`flex items-center justify-between p-3 rounded-xl border ${funnelColors.middle}`}>
                       <div className="flex items-center gap-3">
                            <Thermometer size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Retenção</span>
                       </div>
                   </div>
                   <div className="flex justify-center"><ArrowDown size={12} className="text-slate-800" /></div>
                   <div className={`flex items-center justify-between p-3 rounded-xl border ${funnelColors.bottom}`}>
                       <div className="flex items-center gap-3">
                            <Users size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Conversão</span>
                       </div>
                   </div>
               </div>

           </div>

           {/* BLOCO 2: AUTÓPSIA TÉCNICA (Grid 4) */}
           <div className="space-y-4">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                  <BarChart3 size={14} /> Diagnóstico Técnico
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   {diagnosisPoints.map((point, idx) => {
                       // FORÇA ÍCONES DIFERENTES BASEADO NO INDEX (Para garantir variedade)
                       const Icon = getFixedIcon(idx);
                       return (
                           <div key={idx} className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 flex flex-col justify-between gap-3 ${getSentimentStyle(point.sentiment)}`}>
                               <div className="flex items-center justify-between">
                                   <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 line-clamp-1" title={point.title}>
                                       {point.title}
                                   </h4>
                                   <Icon size={16} className="opacity-70" />
                               </div>
                               <p className="text-xs font-bold leading-relaxed opacity-95">
                                   {point.content}
                               </p>
                               {/* Barra de Intensidade */}
                               <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden mt-1">
                                   <div className={`h-full ${point.sentiment === 'negative' ? 'bg-red-500' : point.sentiment === 'positive' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${point.level || 60}%` }} />
                               </div>
                           </div>
                       );
                   })}
               </div>
           </div>
           
           {/* BLOCO 3: PLANO DE ATAQUE (Grid 4x2) */}
           <div className="space-y-6 pt-6 border-t border-slate-800/50">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-1 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      Plano de Ataque ({finalActions.length} Passos)
                  </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {finalActions.map((action, index) => {
                      // Configuração de Cores e Ícones por Índice
                      const configs = [
                          { color: '#22c55e', icon: Star, label: "Prioridade #1" },      // Green
                          { color: '#19e6ff', icon: TrendingUp, label: "Tático" },       // Cyan
                          { color: '#a855f7', icon: Zap, label: "Engajamento" },         // Purple
                          { color: '#f97316', icon: Eye, label: "Visibilidade" },        // Orange
                          { color: '#3b82f6', icon: MessageCircle, label: "Comunidade" }, // Blue
                          { color: '#ec4899', icon: Share2, label: "Distribuição" },     // Pink
                          { color: '#eab308', icon: Layers, label: "Estrutura" },        // Yellow
                          { color: '#f43f5e', icon: RefreshCw, label: "Refinamento" }     // Rose/Red
                      ];
                      
                      const config = configs[index] || configs[7];
                      const Icon = config.icon || Activity; // Fallback Icon
                      
                      return (
                          <div 
                            key={index} 
                            className="p-5 rounded-3xl border border-slate-800 bg-[#0f1422] flex flex-col justify-between h-44 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900 hover:border-slate-700 shadow-lg"
                            style={{ 
                                boxShadow: index === 0 ? `0 0 20px ${config.color}20` : 'none',
                                borderColor: index === 0 ? `${config.color}50` : undefined
                            }}
                          >
                              {/* Glow de Fundo no Hover */}
                              <div 
                                className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-2xl"
                                style={{ backgroundColor: config.color }}
                              />

                              {/* Número de Fundo Estilizado - Recuado para ficar totalmente dentro do card */}
                              <span 
                                className="absolute right-4 bottom-2 text-4xl font-black select-none italic pointer-events-none transition-colors opacity-[0.07]"
                                style={{ color: config.color }}
                              >
                                  {index + 1}
                              </span>

                              <div className="relative z-10">
                                  <div className="flex items-center justify-between mb-4">
                                      <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner transition-colors"
                                        style={{ 
                                            backgroundColor: `${config.color}15`, 
                                            borderColor: `${config.color}30`,
                                            color: config.color
                                        }}
                                      >
                                          <Icon size={18} className={index === 0 ? "fill-current" : ""} />
                                      </div>
                                      
                                      {/* Rótulo Pequeno */}
                                      <span 
                                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border"
                                        style={{ 
                                            color: config.color,
                                            borderColor: `${config.color}30`,
                                            backgroundColor: `${config.color}05`
                                        }}
                                      >
                                          {config.label}
                                      </span>
                                  </div>
                                  
                                  <p className="text-xs font-bold leading-snug text-slate-200 group-hover:text-white transition-colors line-clamp-4">
                                      {action}
                                  </p>
                              </div>
                              
                              {/* Barra Inferior Decorativa */}
                              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800 group-hover:bg-slate-700 transition-colors">
                                  <div 
                                    className="h-full transition-all duration-700 w-0 group-hover:w-full" 
                                    style={{ backgroundColor: config.color }} 
                                  />
                              </div>
                          </div>
                      );
                  })}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default StrategicReportModal;
