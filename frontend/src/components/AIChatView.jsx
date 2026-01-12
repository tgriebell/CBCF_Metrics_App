import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Bot, Sparkles, User, Copy, CheckCircle, 
  Lightbulb, Loader2, StopCircle, X, History, 
  MessageSquare, Plus, PanelLeftClose, PanelLeft, Activity,
  ChevronRight, Calendar, FileText, Zap, Target, Users, Layers,
  Trash2, Edit2, TrendingUp, AlertCircle, Video, RefreshCw, Eye, ThumbsUp, Rocket
} from 'lucide-react';
import { analyticsQuestions } from '../data/analytics_questions.js';

// --- CONFIGURAÇÃO DE TEMAS ---
const THEMES = {
  general: {
    id: 'general',
    primary: '#3bf5a5', 
    accent: 'rgba(59, 245, 165, 0.1)',
    icon: Sparkles,
    title: "Assistente Criativo",
    subtitle: "Ideias, Roteiros e Estratégia de Conteúdo",
    welcomeTitle: "O que vamos criar hoje?",
    welcomeDesc: "O braço direito para seus roteiros, direções de cena e estratégias virais.",
    placeholder: "Envie sua mensagem ao cérebro digital..."
  },
  analytics: {
    id: 'analytics',
    primary: '#19e6ff', 
    accent: 'rgba(25, 230, 255, 0.1)',
    icon: Activity, 
    title: "Analista de Dados",
    subtitle: "Inteligência de Métricas e Padrões",
    welcomeTitle: "Inteligência de Dados",
    welcomeDesc: "Acesso total às métricas para validar sua estratégia e ditar o próximo passo.",
    placeholder: "Solicite inteligência ao analista de dados..."
  }
};

const AIChatView = ({ mode = 'general', apiBaseUrl, openReportOnLoad = false, setOpenReportOnLoad, posts = [] }) => {
  const theme = THEMES[mode] || THEMES.general;
  
  // --- STATES FALTANTES ADICIONADOS ---
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [randomSuggestions, setRandomSuggestions] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [reportDates, setReportDates] = useState({ start: '', end: '' });
  const [showReportModal, setShowReportModal] = useState(false);
  const [conversationId, setConversationId] = useState(null); // Novo state para ID da conversa ativa

  // States de Edição e UI
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  // Sorteia sugestões ao mudar de modo
  useEffect(() => {
    // Limpa ID ao mudar de modo para não misturar conversas
    setConversationId(null);
    if (mode === 'analytics') {
        const analyticsSuggestions = [
            "Qual o melhor horário para postar do Dr. Rafael?",
            "Analise a retenção dos vídeos de Papada este mês",
            "Quais temas geraram mais inscritos recentemente?",
            "Comparativo de performance: YouTube vs TikTok",
            "Qual o gancho mais eficiente nos últimos 30 dias?",
            "Identifique o vídeo com maior taxa de conversão"
        ];
        const shuffled = [...analyticsSuggestions].sort(() => 0.5 - Math.random());
        setRandomSuggestions(shuffled.slice(0, 3));
    } else {
        const videomakerSuggestions = [
            "Roteiro de Deep Plane com foco em B-Roll luxuoso",
            "Sugestão de transição e sound design para Nanolifting",
            "Gancho de 3 segundos para prender atenção em cirurgia",
            "Como estruturar um depoimento High-Ticket?",
            "Ideia de storytelling para o Reels do Dr. Rafael",
            "Script de CTA para converter seguidores em pacientes",
            "Dicas de color grading para vídeos de consultório",
            "Como usar Speed Ramp para enfatizar precisão técnica"
        ];
        const shuffled = [...videomakerSuggestions].sort(() => 0.5 - Math.random());
        setRandomSuggestions(shuffled.slice(0, 3));
    }
  }, [mode]);

  // Busca Histórico Real do Backend
  const fetchHistory = async () => {
      try {
          const res = await fetch(`${apiBaseUrl}/api/conversations`);
          if (res.ok) {
              const data = await res.json();
              setHistory(data);
          }
      } catch (e) { console.error("Erro ao buscar histórico", e); }
  };

  const requestDelete = (e, id) => {
      e.stopPropagation();
      setDeleteId(id);
  };

  const confirmDelete = async () => {
      if (!deleteId) return;
      try {
          await fetch(`${apiBaseUrl}/api/conversations/${deleteId}`, { method: 'DELETE' });
          setHistory(prev => prev.filter(h => h.id !== deleteId));
          if (messages.length > 0 && messages[0].id === deleteId) setMessages([]);
      } catch (e) { console.error("Erro ao deletar", e); }
      setDeleteId(null);
  };

  const startEditing = (e, conv) => {
      e.stopPropagation();
      setEditingId(conv.id);
      setEditValue(conv.title || conv.prompt);
  };

  const saveTitle = async (id) => {
      if (!editValue.trim()) return setEditingId(null);
      try {
          await fetch(`${apiBaseUrl}/api/conversations/${id}/rename`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ new_title: editValue })
          });
          setHistory(prev => prev.map(h => h.id === id ? { ...h, title: editValue } : h));
      } catch (e) { console.error("Erro ao renomear", e); }
      setEditingId(null);
  };

  const handleEditKeyDown = (e, id) => {
      if (e.key === 'Enter') saveTitle(id);
      if (e.key === 'Escape') setEditingId(null);
  };

  const loadConversation = (conv) => {
      if (editingId) return;
      setConversationId(conv.id); // Define o ID ativo
      
      // Lógica Híbrida: Usa 'messages' se existir (V2), senão usa fallback (V1)
      if (conv.messages && conv.messages.length > 0) {
          // Mapeia o formato do banco para o formato da UI
          const uiMessages = conv.messages.map((m, idx) => ({
              id: conv.id + '_' + idx, // ID único virtual
              role: m.role,
              content: m.content,
              analytics_data: m.analytics_data || null, // Recupera dados ricos se houver
              timestamp: new Date(m.timestamp || conv.timestamp)
          }));
          setMessages(uiMessages);
      } else {
          // --- MODO LEGADO (Para conversas antigas) ---
          let content = conv.response;
          let analyticsData = null;
          if (conv.type === 'analytics') {
              try {
                  analyticsData = JSON.parse(conv.response);
                  // Prioridade: Resposta Conversacional > Resposta Master > Fallback
                  content = analyticsData.conversational_response || analyticsData.insights_hierarchy?.master || "Relatório Analítico Recarregado";
              } catch (e) { console.warn("Erro ao parsear histórico analytics", e); }
          }
          setMessages([
              { id: conv.id, role: 'user', content: conv.prompt, timestamp: new Date(conv.timestamp) },
              { id: conv.id + 1, role: 'assistant', content: content, analytics_data: analyticsData, timestamp: new Date(conv.timestamp) }
          ]);
      }
      
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  useEffect(() => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setReportDates({
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
      });
      fetchHistory();
  }, []);

  useEffect(() => {
      if (editingId && editInputRef.current) {
          editInputRef.current.focus();
      }
  }, [editingId]);

  useEffect(() => {
      if (openReportOnLoad) {
          setShowReportModal(true);
          if (setOpenReportOnLoad) setOpenReportOnLoad(false);
      }
  }, [openReportOnLoad, setOpenReportOnLoad]);

  const fetchAiStatus = async () => {
      try {
          const res = await fetch(`${apiBaseUrl}/api/ai/status`, {
            headers: { 'Authorization': 'Bearer test-token' } 
          });
          if (res.ok) {
              const data = await res.json();
              setAiStatus(data);
          }
      } catch (e) { console.error("Erro status IA", e); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    inputRef.current?.focus();
    setMessages([]); 
    fetchAiStatus(); 
    const interval = setInterval(fetchAiStatus, 30000); 
    return () => clearInterval(interval);
  }, [mode]);

  // --- COMPONENTES VISUAIS ---
  
      // --- NOVO MINI VIDEO CARD (ESTILO PREMIUM - VERSÃO FINAL BLINDADA) ---
      const MiniVideoCard = ({ postId }) => {
          const [isHovered, setIsHovered] = useState(false);
          const buttonRef = useRef(null);
          const [coords, setCoords] = useState({ top: 0, left: 0 });
    
          const post = posts.find(p => p.id === parseInt(postId) || p.platform_content_id === postId);
          if (!post) return <span className="text-[#19e6ff] font-bold text-xs mx-1">#{postId}</span>;
    
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
    
          const p = (post.platform || '').toLowerCase();
          const isTikTok = p.includes('tiktok');
          const badgeColor = isTikTok ? 'bg-white text-black' : 'bg-red-600 text-white';
          
          // Ícones como componentes reais para evitar erro de tipo
          const PlatformIcon = () => {
              if (p.includes('youtube')) return <img src="/img/youtube.png" className="w-3 h-3" alt="YT" />;
              if (p.includes('tiktok')) return <img src="/img/tiktok.png" className="w-3 h-3 invert" alt="TK" />;
              if (p.includes('instagram')) return <img src="/img/instagram.png" className="w-3 h-3" alt="IG" />;
              return <Video size={12} />;
          };
    
          return (
              <span className="relative inline-flex items-center mx-1 align-middle z-10 h-5">
                  <button 
                      ref={buttonRef}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={() => setIsHovered(false)}
                      className={`inline-flex items-center gap-1.5 ${isTikTok ? 'bg-white/10' : 'bg-red-500/10'} border border-white/10 px-2 py-0 rounded-md transition-all font-black text-[10px] shadow-lg hover:scale-110 active:scale-95 cursor-pointer h-5`}
                  >
                      <PlatformIcon />
                      <span className="text-[#19e6ff] font-mono leading-none">#{post.id}</span>
                  </button>
    
                  {isHovered && createPortal(
                      <div 
                          className="fixed w-64 bg-[#0b1021] border border-white/20 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden animate-fade-in origin-bottom backdrop-blur-3xl z-[9999999]"
                          style={{ 
                              top: coords.top, 
                              left: coords.left, 
                              transform: 'translate(-50%, -100%)'
                          }}
                      >
                          <div className="aspect-video relative bg-slate-800">
                              {post.thumbnail_url ? (
                                  <img src={post.thumbnail_url} className="w-full h-full object-cover" alt="Thumb" onError={(e) => e.target.style.display = 'none'} />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-800"><Video size={24} className="text-slate-600"/></div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1021] via-transparent to-transparent"></div>
                              <div className={`absolute top-2 right-2 ${badgeColor} px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-lg`}>
                                  {post.platform}
                              </div>
                          </div>
                          <div className="p-3 text-left relative -mt-4">
                              <h4 className="text-white text-[11px] font-bold leading-tight line-clamp-2 mb-2">{post.title}</h4>
                              <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-white/10">
                                  <div className="text-center">
                                      <Eye size={10} className="mx-auto text-[#19e6ff] mb-0.5" />
                                      <p className="text-[9px] font-black text-white">{(post.metrics?.views || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="text-center">
                                      <ThumbsUp size={10} className="mx-auto text-[#3bf5a5] mb-0.5" />
                                      <p className="text-[9px] font-black text-white">{(post.metrics?.likes || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="text-center">
                                      <MessageSquare size={10} className="mx-auto text-yellow-400 mb-0.5" />
                                      <p className="text-[9px] font-black text-white">{(post.metrics?.comments || 0).toLocaleString()}</p>
                                  </div>
                              </div>
                          </div>
                      </div>,
                      document.body
                  )}
              </span>
          );
      };  const SmartTextRenderer = ({ content }) => {
      if (!content) return null;
      // Regex aprimorado: Aceita "#123", "#ID 123", "#ID: 123", "# id 123" (case insensitive)
      const parts = content.split(/((?:#\s*ID:?\s*|#)\d+)/gi);
      
      return (
          <div className="prose prose-invert max-w-none 
            prose-p:leading-relaxed prose-p:mb-6 
            prose-li:mb-2 
            prose-headings:mb-4 prose-headings:text-white
            prose-blockquote:border-l-4 prose-blockquote:border-[#3bf5a5] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:rounded-r-lg">
              {parts.map((part, i) => {
                  // Verifica se é um padrão de ID
                  if (part.match(/^(?:#\s*ID:?\s*|#)\d+$/i)) {
                      // Limpa tudo que não for dígito para passar ao componente
                      const id = part.replace(/\D/g, '');
                      return <MiniVideoCard key={i} postId={id} />;
                  }
                  // Forçamos o ReactMarkdown a usar 'span' em vez de 'p' para não quebrar a linha
                  return <ReactMarkdown key={i} components={{ p: 'span' }}>{part}</ReactMarkdown>;
              })}
          </div>
      );
  };

  const MessageItem = ({ msg }) => {
    const isUser = msg.role === 'user';
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(msg.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const iconMap = {
      'rocket': Zap, 'zap': Zap, 'target': Target, 'activity': Activity, 
      'users': Users, 'layers': Layers, 'check': CheckCircle, 'sparkles': Sparkles
    };

    const AnalyticsPanel = ({ data }) => {
      if (!data) return null;
      
      // Se for apenas uma conversa, não mostra painéis vazios
      const hasCards = data.diagnostic_cards && data.diagnostic_cards.length > 0;
      const hasDecisions = data.executive_decisions && data.executive_decisions.length > 0;
      
      if (!hasCards && !hasDecisions && !data.money_equivalence) return null;

      return (
        <div className="mt-6 space-y-6 animate-fade-in-up">
          {hasCards && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.diagnostic_cards?.map((card, idx) => {
                let borderColor = 'border-white/10';
                let iconColor = 'text-slate-400';
                let Icon = Activity;
                
                // Lógica de Cores Semânticas
                if (card.title.toLowerCase().includes('retenção') || card.title.toLowerCase().includes('viral') || card.type === 'positive' || card.title.toLowerCase().includes('vencedor') || card.title.toLowerCase().includes('destaque')) {
                    borderColor = 'border-green-500/30'; iconColor = 'text-green-400'; Icon = TrendingUp;
                } else if (card.title.toLowerCase().includes('baixa') || card.title.toLowerCase().includes('saturação') || card.type === 'negative' || card.type === 'warning') {
                    borderColor = 'border-red-500/30'; iconColor = 'text-red-400'; Icon = AlertCircle;
                } else if (card.title.toLowerCase().includes('potencial') || card.title.toLowerCase().includes('oportunidade')) {
                    borderColor = 'border-yellow-500/30'; iconColor = 'text-yellow-400'; Icon = Lightbulb;
                }

                // Lógica HERO CARD (Destaque para o primeiro card se for importante)
                const isHero = idx === 0 && (card.title.toLowerCase().includes('vencedor') || card.title.toLowerCase().includes('top') || card.title.toLowerCase().includes('destaque'));
                const heroClass = isHero ? 'md:col-span-2 bg-gradient-to-r from-[#0b1021] to-[#0f172a] border-[#3bf5a5]/50 shadow-[0_0_20px_rgba(59,245,165,0.1)]' : 'bg-[#0b1021]';
                const metricSize = isHero ? 'text-2xl' : 'text-xs';

                return (
                  <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden group transition-colors ${borderColor} ${heroClass}`}>
                    <div className="flex justify-between items-start z-10 relative">
                      <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-white/5 ${iconColor}`}><Icon size={isHero ? 18 : 14} /></div>
                          <span className={`${isHero ? 'text-xs text-[#3bf5a5]' : 'text-[10px] text-slate-400'} font-bold uppercase tracking-widest`}>{card.title}</span>
                      </div>
                      
                      {/* Reference Chip (Separado do Texto) */}
                      {card.reference_id && (
                          <div className="absolute top-4 right-4">
                              <MiniVideoCard postId={card.reference_id.replace('#', '')} />
                          </div>
                      )}
                    </div>

                    {card.metric && <span className={`${metricSize} font-mono font-bold ${iconColor} mt-1 block`}>{card.metric}</span>}
                    
                    <div className={`${isHero ? 'text-sm text-slate-200' : 'text-xs text-slate-300'} leading-relaxed font-medium z-10 relative mt-1`}>
                        <SmartTextRenderer content={card.content} />
                    </div>
                    <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-current opacity-5 blur-2xl rounded-full pointer-events-none ${iconColor}`}></div>
                  </div>
                );
            })}
          </div>
          )}

          {hasDecisions && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#19e6ff] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                 <Rocket size={14} className="animate-pulse" /> Direções de Elite
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.executive_decisions.map((dec, idx) => {
                  const Icon = iconMap[dec.icon] || Zap;
                  
                  // Lógica para separar Gancho de Estratégia (se a IA seguir o padrão)
                  const parts = dec.desc.split(/(?:GANCHO:|ESTRATÉGIA:)/i);
                  const gancho = parts[1]?.split('ESTRATÉGIA:')[0]?.trim();
                  const estrategia = parts[2]?.trim() || parts[0]?.trim();

                  return (
                    <div key={idx} className="group relative bg-[#0b1021] border border-white/5 rounded-[1.5rem] overflow-hidden hover:border-[#8b5cf6]/50 transition-all duration-500 shadow-2xl flex flex-col">
                      {/* EFEITO DE GLOW LATERAL */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#8b5cf6]/5 blur-[40px] rounded-full pointer-events-none"></div>
                      
                      {/* HEADER DO CARD */}
                      <div className="p-5 pb-3 relative z-10 flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[8px] font-black text-[#a78bfa] uppercase tracking-widest">Sugestão Elite</span>
                             {dec.reference_id && <MiniVideoCard postId={dec.reference_id.replace('#', '')} />}
                           </div>
                           <h5 className="text-sm font-black text-white leading-tight uppercase italic group-hover:text-[#19e6ff] transition-colors">{dec.title}</h5>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#19e6ff]/20 flex items-center justify-center text-[#19e6ff] shadow-lg group-hover:scale-110 transition-transform">
                          <Icon size={20} />
                        </div>
                      </div>

                      {/* AREA DO GANCHO (HOOK) */}
                      {gancho && (
                        <div className="mx-4 mb-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl relative group-hover:bg-[#19e6ff]/5 transition-colors">
                           <div className="flex items-center gap-1.5 mb-1.5">
                              <Zap size={10} className="text-[#19e6ff]" />
                              <span className="text-[9px] font-black text-[#19e6ff] uppercase tracking-tighter">Hook Viral (Gancho)</span>
                           </div>
                           <p className="text-[11px] font-bold text-slate-200 leading-snug italic">"{gancho}"</p>
                        </div>
                      )}

                      {/* AREA DA ESTRATÉGIA */}
                      <div className="px-5 pb-5 flex-1 relative z-10">
                         {!gancho && <div className="h-[1px] w-12 bg-[#8b5cf6]/50 mb-4"></div>}
                         <div className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            <SmartTextRenderer content={estrategia} />
                         </div>
                      </div>

                      {/* FOOTER DECORATIVO */}
                      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#8b5cf6]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {data.money_equivalence && data.money_equivalence.explanation && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20 flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Activity size={20} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Equivalência de ROI</p>
                  <p className="text-xs text-white font-medium">{data.money_equivalence.explanation}</p>
               </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={`flex w-full mb-8 animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-4 max-w-4xl w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${isUser ? 'bg-slate-700 text-slate-300' : 'bg-slate-900 border border-white/10'}`} style={{ color: !isUser ? theme.primary : undefined }}>
            {isUser ? <User size={20} /> : <theme.icon size={20} />}
          </div>
          <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
             <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isUser ? 'Você' : theme.title}</span>
                 <span className="text-[10px] text-slate-600">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             </div>
             <div className={`relative text-sm leading-relaxed ${isUser ? 'bg-[#1e293b] text-slate-200 py-3 px-5 rounded-2xl rounded-tr-none inline-block border border-slate-700' : 'text-slate-300'}`}>
                 <SmartTextRenderer content={msg.content} />
                 {!isUser && msg.analytics_data && <AnalyticsPanel data={msg.analytics_data} />}
                 {!isUser && (
                     <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                         <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors">
                             {copied ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                             {copied ? 'Copiado' : 'Copiar'}
                         </button>
                     </div>
                 )}
             </div>
             {msg.referenced_post && (
                 <div className="mt-4 p-4 bg-[#0b1021] rounded-xl border border-white/10 flex items-center gap-4 max-w-md shadow-lg group hover:border-[#19e6ff]/30 transition-all">
                     {msg.referenced_post.thumbnail_url && <img src={msg.referenced_post.thumbnail_url} alt="Thumb" className="w-20 h-20 object-cover rounded-lg bg-slate-800" />}
                     <div className="flex-1 min-w-0">
                         <p className="text-[10px] text-[#19e6ff] font-bold uppercase mb-1">Vídeo Analisado</p>
                         <p className="text-sm font-bold text-white truncate group-hover:text-[#19e6ff] transition-colors">{msg.referenced_post.title}</p>
                         <p className="text-xs text-slate-500 mt-1">{new Date(msg.referenced_post.published_at).toLocaleDateString()}</p>
                     </div>
                 </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  const handleSendMessage = async (customPrompt = null) => {
    const promptToSend = customPrompt || inputValue;
    if (!promptToSend.trim() || isLoading) return;
    
    // Adiciona mensagem do usuário na UI instantaneamente
    const tempUserId = Date.now();
    const userMessage = { id: tempUserId, role: 'user', content: promptToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');
    
    try {
      const payload = { 
          prompt: userMessage.content,
          conversation_id: conversationId // Envia o ID se existir
      };

      if (mode === 'general') {
        const response = await fetch(`${apiBaseUrl}/api/ai/general`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Erro na conexão com a IA");
        const data = await response.json();
        
        // Atualiza o conversationId se for uma nova conversa
        if (data.conversation_id) setConversationId(data.conversation_id);
        
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.response, timestamp: new Date() }]);
        fetchHistory();
      } else {
        const response = await fetch(`${apiBaseUrl}/api/ai/data_analytics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Erro na análise de dados");
        const data = await response.json();
        
        // Atualiza o conversationId se for uma nova conversa
        if (data.conversation_id) setConversationId(data.conversation_id);
        
        // Lógica Inteligente de Exibição: Conversa vs Relatório
        const displayContent = data.conversational_response || data.insights_hierarchy?.master || "Relatório Gerado";
        
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: displayContent, analytics_data: data, timestamp: new Date() }]);
        
        // Delay para garantir que o BD salvou
        setTimeout(fetchHistory, 500);
      }
      fetchAiStatus();
    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `**Erro:** ${error.message}`, isError: true, timestamp: new Date() }]);
    } finally {
        setIsLoading(false);
        setStreamingContent('');
    }
  };

  const handleGenerateReport = () => {
      setShowReportModal(false);
      handleSendMessage(`Faça uma análise completa de ${reportDates.start} até ${reportDates.end}.`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const WelcomeScreen = () => (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in transition-all duration-500">
          <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-10 relative bg-black/40 border border-white/5 shadow-2xl">
              <div className="absolute inset-0 rounded-[2rem] animate-pulse" style={{ boxShadow: `0 0 50px ${theme.primary}15` }}></div>
              <theme.icon size={44} style={{ color: theme.primary }} className="relative z-10" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight uppercase italic">{theme.welcomeTitle}</h2>
          <p className="text-slate-400 max-w-lg leading-relaxed font-medium text-sm">{theme.welcomeDesc}</p>
          
          <div className="flex flex-wrap justify-center gap-3 mt-12 max-w-2xl">
              {randomSuggestions.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSendMessage(q)} 
                    className="px-5 py-2.5 bg-[#0b1021] hover:bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all hover:scale-105 hover:border-white/20 shadow-lg flex items-center gap-2 group"
                  >
                      <Plus size={12} className="text-slate-500 group-hover:text-white transition-colors" />
                      {q}
                  </button>
              ))}
          </div>
      </div>
  );

  return (
    <div className="flex h-full bg-[#050814] text-slate-200 overflow-hidden relative">
        {showReportModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-[#0b1021] border border-white/10 rounded-2xl p-6 w-96 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileText size={20} className="text-[#19e6ff]" /> Novo Relatório</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Data Inicial</label>
                            <input type="date" value={reportDates.start} onChange={e => setReportDates({...reportDates, start: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-[#19e6ff] outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Data Final</label>
                            <input type="date" value={reportDates.end} onChange={e => setReportDates({...reportDates, end: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-[#19e6ff] outline-none" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setShowReportModal(false)} className="text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                        <button onClick={handleGenerateReport} className="bg-[#19e6ff] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#19e6ff]/90 transition-all">Gerar Análise</button>
                    </div>
                </div>
            </div>
        )}

        <div className={`bg-[#02040a] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out absolute md:relative z-30 h-full ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}`}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Histórico</span>
                    <button onClick={fetchHistory} className="p-1 text-slate-600 hover:text-[#19e6ff] transition-colors" title="Atualizar Lista"><RefreshCw size={12} /></button>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400"><X size={18}/></button>
            </div>
            <div className="p-3">
                <button onClick={() => { setMessages([]); setConversationId(null); }} className="w-full flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-300 text-white group" style={{ borderColor: `${theme.primary}30`, backgroundColor: `${theme.primary}05` }}>
                    <Plus size={16} style={{ color: theme.primary }} className="group-hover:rotate-90 transition-transform duration-300" /> Nova Conversa
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-1">
                {history.filter(h => h.type === mode).map(h => (
                    <div key={h.id} onClick={() => loadConversation(h)} className={`w-full text-left p-3 rounded-lg hover:bg-white/5 transition-all group flex items-center gap-3 cursor-pointer relative ${editingId === h.id ? 'bg-white/5 ring-1 ring-[#19e6ff]/30' : ''}`}>
                        <div className="flex-shrink-0">{h.type === 'analytics' ? <Activity size={14} className="text-[#19e6ff]" /> : <Sparkles size={14} className="text-[#3bf5a5]" />}</div>
                        <div className="flex-1 min-w-0">
                            {editingId === h.id ? (
                                <input ref={editInputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveTitle(h.id)} onKeyDown={(e) => handleEditKeyDown(e, h.id)} className="w-full bg-transparent border-none outline-none text-[11px] text-white font-bold p-0" onClick={(e) => e.stopPropagation()} />
                            ) : (
                                <><p className="text-[11px] text-white truncate font-medium">{h.title || h.prompt}</p><p className="text-[9px] text-slate-600 mt-0.5">{new Date(h.timestamp).toLocaleDateString()}</p></>
                            )}
                        </div>
                        {editingId !== h.id && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-transparent pl-4 bg-gradient-to-l from-[#02040a] via-[#02040a]/80 to-transparent">
                                <button 
                                    onClick={(e) => startEditing(e, h)} 
                                    className="p-1.5 rounded-md text-slate-500 hover:text-[#19e6ff] hover:bg-[#19e6ff]/10 transition-all active:scale-90"
                                    title="Renomear"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    onClick={(e) => requestDelete(e, h.id)} 
                                    className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-90"
                                    title="Excluir"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-[#050814] relative overflow-hidden">
            <header className="h-20 flex items-center justify-between px-8 bg-[#02040a]/95 backdrop-blur-xl sticky top-0 z-20 shadow-2xl" style={{ borderBottom: `1px solid ${theme.primary}15` }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors">{isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}</button>
                    <div className="h-8 w-[1px] bg-white/10"></div>
                    <div><h2 className="text-base font-bold text-white flex items-center gap-2">{theme.title}</h2><p className="text-[11px] text-slate-500 font-medium hidden md:block">{theme.subtitle}</p></div>
                </div>
                {messages.length > 0 && <button onClick={() => { setMessages([]); setConversationId(null); }} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2"><Trash2 size={14} /> Limpar Chat</button>}
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scroll relative">
                {messages.length === 0 ? <WelcomeScreen /> : (
                    <>{messages.map((msg) => <MessageItem key={msg.id} msg={msg} />)}<div ref={messagesEndRef} /></>
                )}
                {isLoading && (
                    <div className="flex gap-4 p-8">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 border border-white/10"><Loader2 size={20} className="animate-spin" style={{ color: theme.primary }} /></div>
                        <div className="flex items-center text-xs text-slate-500 italic">Pensando...</div>
                    </div>
                )}
            </div>

            <div className="p-6 pt-2 bg-gradient-to-t from-[#050814] to-transparent">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="relative bg-[#0b1021] border border-white/10 rounded-2xl flex items-end p-2 shadow-2xl transition-colors group-focus-within:border-white/20">
                        <textarea ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={theme.placeholder} className="w-full bg-transparent text-white p-3 min-h-[50px] max-h-[200px] resize-none focus:outline-none text-sm leading-relaxed custom-scroll" rows={1} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                        <div className="pb-1 pr-1 flex items-center gap-2">
                            {mode === 'analytics' && <button onClick={() => setShowSuggestionModal(!showSuggestionModal)} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"><Lightbulb size={18} /></button>}
                            <button onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()} className="p-2.5 rounded-xl text-black font-bold transition-all disabled:opacity-50" style={{ backgroundColor: theme.primary }}>{isLoading ? <StopCircle size={18} /> : <Send size={18} />}</button>
                        </div>
                    </div>
                    {showSuggestionModal && mode === 'analytics' && (
                        <div className="absolute bottom-full right-0 mb-4 w-80 max-h-96 bg-[#0b1021] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
                            <div className="p-3 border-b border-white/5 bg-[#0f172a] flex justify-between items-center"><span className="text-xs font-bold text-slate-300">Sugestões de Análise</span><button onClick={() => setShowSuggestionModal(false)}><X size={14}/></button></div>
                            <div className="overflow-y-auto custom-scroll p-2">
                                {analyticsQuestions.map((cat, i) => (
                                    <div key={i} className="mb-3">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase px-2 mb-1">{cat.category}</p>
                                        {cat.questions.map((q, j) => <button key={j} onClick={() => { setInputValue(q); setShowSuggestionModal(false); inputRef.current?.focus(); }} className="w-full text-left text-xs text-slate-300 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors whitespace-normal">{q}</button>)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {deleteId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
                <div className="bg-[#0b1021] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
                    
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">Excluir Conversa?</h3>
                    <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                        Esta ação é irreversível. O histórico e os insights gerados serão perdidos permanentemente.
                    </p>
                    
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setDeleteId(null)} 
                            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete} 
                            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                        >
                            Confirmar Exclusão
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AIChatView;