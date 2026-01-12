import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, TrendingUp, Zap, Sparkles, BrainCircuit, Play, Bot, Eye, ThumbsUp, MessageSquare } from 'lucide-react';

// --- UTILITÁRIOS ---
const formatMetricString = (str) => {
    if (!str) return '';
    return str
        .replace(/views/gi, 'vis.')
        .replace(/avg/gi, 'médio')
        .replace(/followers/gi, 'seguidores')
        .replace(/subs\/dia/gi, 'inscritos/dia')
        .replace(/shares/gi, 'compart.')
        .replace(/YoY/gi, 'Anual')
        .replace(/efficiency/gi, 'eficiência');
};

// --- COMPONENTE DE PREVIEW DE POST (Interativo) ---
const PostTag = ({ id, allPosts }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Busca flexível: Remove tudo que não é dígito e compara, OU busca pelo ID da plataforma
    const cleanId = String(id).replace(/\D/g, '');
    const post = allPosts.find(p => 
        String(p.id) === cleanId || 
        String(p.platform_content_id) === String(id) ||
        (p.title && p.title.includes(id))
    );

    if (!post) return <span className="text-[#19e6ff] font-bold text-[10px]">#{id}</span>;

    const isTikTok = post.platform.toLowerCase().includes('tiktok');
    const badgeColor = isTikTok ? 'bg-white text-black' : 'bg-red-600 text-white';
    
    // Ícone correto
    const PlatformIcon = isTikTok ? (
        <img src="/img/tiktok.png" className="w-3 h-3 invert" alt="TK" />
    ) : (
        <img src="/img/youtube.png" className="w-3 h-3" alt="YT" />
    );

    return (
        <span className="relative inline-block mx-1 align-baseline z-[50]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}>
            <button 
                className={`inline-flex items-center gap-1.5 ${badgeColor} px-2 py-0.5 rounded-md transition-all font-black text-[9px] shadow-lg hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider`}
            >
                {PlatformIcon}
                ID: {post.id}
            </button>

            {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-60 bg-[#0b1021] border border-white/20 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden animate-scale-in origin-bottom backdrop-blur-3xl z-[10005]">
                    <div className="aspect-video relative bg-slate-900">
                        {post.thumbnail_url ? (
                            <img src={post.thumbnail_url} className="w-full h-full object-cover" alt="Thumb" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-600 uppercase tracking-widest">Sem Capa</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1021] via-transparent to-transparent"></div>
                        <div className={`absolute top-3 right-3 ${badgeColor} px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-lg`}>
                            {isTikTok ? 'TikTok' : 'YouTube'}
                        </div>
                    </div>
                    <div className="p-4 text-left relative -mt-6">
                        <h4 className="text-white text-xs font-bold leading-tight line-clamp-2 mb-3">{post.title}</h4>
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                            <div className="text-center">
                                <Eye size={12} className="mx-auto text-[#19e6ff] mb-1" />
                                <p className="text-[9px] font-black text-white">{(post.metrics?.views || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <ThumbsUp size={12} className="mx-auto text-[#3bf5a5] mb-1" />
                                <p className="text-[9px] font-black text-white">{(post.metrics?.likes || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <MessageSquare size={12} className="mx-auto text-yellow-400 mb-1" />
                                <p className="text-[9px] font-black text-white">{(post.metrics?.comments || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </span>
    );
};

// --- PROCESSADOR DE TEXTO INTELIGENTE ---
const SmartText = ({ text, allPosts }) => {
    if (!text) return null;
    
    // Regex simplificada e segura
    const regex = /(\[ID:[^\]]+\]|TKID:\s*\d+|YTID:\s*\d+|#\d+|id=\d+)/gi;
    const parts = text.split(regex);
    
    return (
        <span>
            {parts.map((part, i) => {
                // Verifica se a parte é um ID
                if (regex.test(part)) {
                     const cleanId = part.replace(/[^\w]/g, ''); 
                     if (cleanId) {
                        return <PostTag key={i} id={cleanId} allPosts={allPosts} />;
                     }
                }
                // Reseta o lastIndex da regex para o próximo teste (importante para test() com flag g)
                regex.lastIndex = 0;

                // Renderiza texto normal com suporte a negrito (**texto**)
                return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff; font-weight:900;">$1</strong>') }} />;
            })}
        </span>
    );
};

const RankingAnalysisModal = ({ isOpen, onClose, data, loading, allPosts = [] }) => {
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingPhrases = [
    "Extraindo DNA Viral dos Vídeos...",
    "Mapeando Padrões de Retenção...",
    "Identificando Gatilhos Emocionais...",
    "Gerando Insights de Elite..."
  ];

  useEffect(() => {
    if (isOpen && loading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingPhrases.length);
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [isOpen, loading]);

  if (!isOpen) return null;

  // Garante que pegamos os cards, mesmo que venham misturados
  let cards = data?.diagnostic_cards || [];
  
  // Fallback se a IA retornar texto corrido no lugar dos cards
  if (cards.length === 0 && data?.summary_text) {
      cards = data.summary_text.split('\n\n').slice(0, 8).map((t, i) => ({
          title: `Insight #${i+1}`,
          content: t,
          type: 'neutral',
          metric: 'Análise'
      }));
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/98 backdrop-blur-3xl animate-enter p-4 md:p-8">
      <div className="w-full max-w-6xl h-full max-h-[90vh] bg-[#02040a] rounded-[3rem] border border-[#19e6ff]/20 shadow-[0_0_100px_rgba(25,230,255,0.1)] flex flex-col overflow-hidden relative">
        
        {/* Fundo Cibernético */}
        <div className="absolute inset-0 bg-[url('/img/grid.svg')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#19e6ff] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

        {/* Header */}
        <div className="px-12 py-10 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md relative z-10">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-[#19e6ff]/10 rounded-2xl border border-[#19e6ff]/30 text-[#19e6ff]">
                <Zap size={32} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none flex items-center gap-3">
                    Decodificação de Padrões <span className="text-[#19e6ff] text-sm not-italic font-bold bg-[#19e6ff]/10 px-3 py-1 rounded-full border border-[#19e6ff]/20 tracking-widest">TOP 10</span>
                </h2>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">Engenharia Reversa de Viralização</p>
              </div>
           </div>
           <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-full text-gray-400 transition-all hover:rotate-90 border border-white/5"><X size={24}/></button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto custom-scroll p-12 relative z-10">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-12">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#19e6ff] animate-spin"></div>
                        <BrainCircuit size={64} className="text-white animate-pulse" />
                    </div>
                    <p className="text-2xl font-black text-white uppercase tracking-[0.4em] animate-pulse text-center">{loadingPhrases[loadingStep]}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, idx) => {
                         const isPositive = card.type === 'positive';
                         const isWarning = card.type === 'warning';
                         const iconColor = isPositive ? 'text-[#3bf5a5]' : isWarning ? 'text-orange-500' : 'text-blue-400';
                         const borderColor = isPositive ? 'border-[#3bf5a5]' : isWarning ? 'border-orange-500' : 'border-blue-400';
                         const shadowColor = isPositive ? 'shadow-[#3bf5a5]/20' : isWarning ? 'shadow-orange-500/20' : 'shadow-blue-400/20';
                         const glowGradient = isPositive ? 'from-[#3bf5a5]/10' : isWarning ? 'from-orange-500/10' : 'from-blue-400/10';

                         let IconComponent = Sparkles;
                         let label = "Insight";
                         
                         if (isPositive) { IconComponent = CheckCircle2; label = "Validação"; }
                         else if (isWarning) { IconComponent = AlertTriangle; label = "Alerta"; }
                         else { IconComponent = TrendingUp; label = "Tendência"; }

                         return (
                             <div key={idx} className={`
                                bg-[#0b1021] border border-white/5 rounded-[2.5rem] p-8 relative group hover:-translate-y-2 transition-all duration-500
                                hover:border-opacity-50 hover:shadow-2xl ${shadowColor}
                             `}>
                                 {/* Glow Effect on Hover */}
                                 <div className={`absolute inset-0 bg-gradient-to-br ${glowGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                                 
                                 {/* Top Badge */}
                                 <div className="flex justify-between items-start mb-6 relative z-10">
                                     <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md`}>
                                         <IconComponent size={14} className={iconColor} />
                                         <span className={`text-[9px] font-black uppercase tracking-widest ${iconColor}`}>{label}</span>
                                     </div>
                                     {card.metric && (
                                        <div className="text-[9px] font-black text-gray-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5 uppercase tracking-wider">
                                            {formatMetricString(card.metric)}
                                        </div>
                                     )}
                                 </div>

                                 <h4 className={`text-lg font-black text-white mb-4 leading-tight group-hover:${iconColor.replace('text-', 'text-')} transition-colors relative z-10`}>
                                     {card.title}
                                 </h4>
                                 
                                 <p className="text-gray-400 text-xs font-medium leading-relaxed border-t border-white/5 pt-4 relative z-10 group-hover:text-gray-300 transition-colors">
                                     {/* Passando allPosts para o SmartText para que o PostTag funcione */}
                                     <SmartText text={card.content} allPosts={allPosts} />
                                 </p>

                                 {/* Decorative Line */}
                                 <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${borderColor.replace('border-', 'from-')} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                             </div>
                         )
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RankingAnalysisModal;