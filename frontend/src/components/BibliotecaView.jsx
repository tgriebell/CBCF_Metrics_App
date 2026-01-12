import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import PostDetailsDrawer from './PostDetailsDrawer';
import RankingAnalysisModal from './RankingAnalysisModal'; // IMPORT ATUALIZADO
import { 
  BookOpen, Loader, AlertTriangle, Layers, 
  TrendingUp, Heart, MessageCircle, Share2, Clock, 
  Trophy, Medal, Star, Sparkles, BrainCircuit
} from 'lucide-react';

const API_BASE_URL = 'https://127.0.0.1:8000';

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', img: '/img/youtube.png', color: '#ff0000' },
  { id: 'shorts', label: 'Shorts', img: '/img/youtubeshorts.png', color: '#ff0000' },
  { id: 'tiktok', label: 'TikTok', img: '/img/tiktok.png', color: '#00f2ea' }, // TikTok Cyan
  { id: 'instagram', label: 'Instagram', img: '/img/instagram.png', color: '#E1306C' }
];

const ELITE_FILTERS = [
  { id: 'recent', label: 'Cronologia', icon: Clock, color: '#94a3b8' },
  { id: 'views', label: 'Viral Hall of Fame', icon: TrendingUp, color: '#FFD700' }, // Gold
  { id: 'likes', label: 'Máxima Conexão', icon: Heart, color: '#ff0055' },
  { id: 'comments', label: 'Geradores de Debate', icon: MessageCircle, color: '#19e6ff' },
  { id: 'shares', label: 'Alto Compartilhamento', icon: Share2, color: '#3bf5a5' }
];

const BibliotecaView = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  const [activeEliteFilter, setActiveEliteFilter] = useState('recent');
  
  // Drawer State
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // AI Analysis State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (!response.ok) {
          throw new Error('Falha ao buscar os dados da biblioteca.');
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => setIsDrawerOpen(false);

  // --- FILTER & SORT LOGIC ---
  let processedPosts = posts.filter(post => {
    const p = post.platform ? post.platform.toLowerCase() : '';
    if (selectedPlatform === 'youtube') return p === 'youtube' || p === 'youtube_long';
    if (selectedPlatform === 'shorts') return p.includes('shorts');
    if (selectedPlatform === 'tiktok') return p.includes('tiktok');
    if (selectedPlatform === 'instagram') return p.includes('instagram');
    return false;
  });

  // Sorting
  if (activeEliteFilter === 'recent') {
      processedPosts.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  } else {
      // Metric Sorting
      processedPosts.sort((a, b) => {
          const valA = a.metrics?.[activeEliteFilter] || 0;
          const valB = b.metrics?.[activeEliteFilter] || 0;
          return valB - valA;
      });
      // Top 10 Cut
      processedPosts = processedPosts.slice(0, 10);
  }

  // --- AI ANALYSIS HANDLER ---
  const handleAnalyzeRanking = async () => {
      setIsAiModalOpen(true);
      setIsAiLoading(true);
      setAiData(null);

      // Prepare data context
      const topPostsContext = processedPosts.map((p, i) => 
          `${i+1}. [${p.platform}] "${p.title}" - Views: ${p.metrics.views}, Likes: ${p.metrics.likes}`
      ).join('\n');

      const prompt = `
      ATUE COMO UM ESTRATEGISTA DE ELITE.
      
      Analise este TOP 10 RANKING (Filtro: ${activeEliteFilter.toUpperCase()}):
      ${topPostsContext}

      Sua missão: Gerar 8 CARDS DE DIAGNÓSTICO PROFUNDOS.
      NÃO escreva introduções, nem conclusões, nem texto corrido.
      
      Estrutura do JSON obrigatória:
      {
        "diagnostic_cards": [
           { "title": "TÍTULO DE IMPACTO", "content": "Análise técnica curta e direta.", "type": "positive", "metric": "+40% Retenção" },
           ... (total 8 cards)
        ]
      }

      FOCO: Engenharia reversa do sucesso, padrões de hook, psicologia do público e gatilhos de viralização encontrados nestes vídeos específicos.
      `;

      try {
          const response = await fetch(`${API_BASE_URL}/api/ai/data_analytics`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt }),
          });

          if (!response.ok) throw new Error("Erro na análise AI");
          const data = await response.json();
          setAiData(data);
      } catch (error) {
          console.error(error);
          setAiData({
              diagnostic_cards: [{ title: "Erro de Conexão", content: "Não foi possível conectar ao cérebro digital.", type: "warning", metric: "Erro 500" }]
          });
      } finally {
          setIsAiLoading(false);
      }
  };

  const isRankingMode = activeEliteFilter !== 'recent';

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll animate-enter">
        <header>
          <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-3">
             <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
               <BookOpen className="text-[#3bf5a5]" />
               Biblioteca de Conteúdo
             </h2>
             {/* Simple Post Counter */}
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {processedPosts.length} {isRankingMode ? 'Vídeos de Elite' : 'Vídeos Total'}
             </div>
          </div>

          {/* 1. PLATFORM FILTERS */}
          <div className="flex flex-wrap gap-4 mb-8">
            {PLATFORMS.map((platform) => {
              const isActive = selectedPlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`
                    relative group flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 overflow-hidden
                    ${isActive 
                      ? 'bg-slate-800/80 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-105' 
                      : 'bg-slate-900/40 border-slate-800/50 text-slate-500 hover:bg-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }
                  `}
                  style={{
                    borderColor: isActive ? platform.color : '',
                    boxShadow: isActive ? `0 0 15px ${platform.color}40` : ''
                  }}
                >
                  {isActive && <div className="absolute inset-0 opacity-10" style={{ backgroundColor: platform.color }} />}
                  <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 grayscale group-hover:grayscale-0'}`}>
                    {platform.img ? <img src={platform.img} alt={platform.label} className="w-6 h-6 object-contain" /> : <Layers size={24} style={{ color: isActive ? platform.color : 'currentColor' }} />}
                  </div>
                  <span className={`text-sm font-bold uppercase tracking-wider relative z-10 ${isActive ? 'text-white' : ''}`}>{platform.label}</span>
                  {isActive && <span className="absolute bottom-1 right-1/2 translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_5px_white]" />}
                </button>
              );
            })}
          </div>

          {/* 2. ELITE RANKING FILTERS (NEW) */}
          <div className="flex items-center gap-2 mb-8 p-2 bg-black/20 rounded-2xl border border-white/5 w-fit">
              {ELITE_FILTERS.map((filter) => {
                  const isActive = activeEliteFilter === filter.id;
                  const Icon = filter.icon;
                  return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveEliteFilter(filter.id)}
                        className={`
                           flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                           ${isActive ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}
                        `}
                        style={{ 
                            color: isActive ? filter.color : undefined,
                            borderColor: isActive ? filter.color : 'transparent'
                        }}
                        onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.color = filter.color }}
                        onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.color = '' }}
                      >
                          <Icon size={14} />
                          {filter.label}
                      </button>
                  )
              })}
          </div>
        </header>
        
        {loading && (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Loader className="animate-spin text-[#3bf5a5] mb-4" size={48} />
            <p className="text-lg font-semibold text-white">Carregando biblioteca...</p>
          </div>
        )}

        {error && (
           <div className="flex flex-col items-center justify-center text-center py-16 bg-red-500/5 rounded-2xl border border-red-500/10">
            <AlertTriangle className="text-red-400 mb-4" size={48} />
            <p className="text-lg font-semibold text-red-300">Erro de Conexão</p>
            <p className="text-sm text-red-400/80 max-w-md">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {isRankingMode && processedPosts.length > 0 && (
                 <div className="mb-8 p-6 bg-gradient-to-r from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-2xl flex justify-between items-center animate-fade-in-up">
                     <div>
                         <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                             <Trophy className="text-[#FFD700]" /> Hall da Fama: Top 10
                         </h3>
                         <p className="text-gray-400 text-xs font-bold mt-1">Os vídeos de maior performance absoluta nesta categoria.</p>
                     </div>
                     <button 
                        onClick={handleAnalyzeRanking}
                        className="bg-[#19e6ff] hover:bg-[#19e6ff]/80 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(25,230,255,0.4)] flex items-center gap-2 hover:scale-105 transition-transform"
                     >
                         <BrainCircuit size={18} /> Decodificar Padrões IA
                     </button>
                 </div>
            )}

            <section className={`grid gap-6 animate-fade-in-up ${isRankingMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {processedPosts.length > 0 ? (
                processedPosts.map((post, index) => {
                    // RANKING VISUALS
                    if (isRankingMode) {
                        let rankColor = 'border-white/10';
                        let rankIcon = null;
                        let scaleClass = '';
                        
                        if (index === 0) { rankColor = 'border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.15)]'; rankIcon = <Trophy size={32} className="text-[#FFD700]" />; scaleClass='scale-[1.02]'; }
                        else if (index === 1) { rankColor = 'border-gray-300 shadow-[0_0_20px_rgba(200,200,200,0.1)]'; rankIcon = <Medal size={28} className="text-gray-300" />; }
                        else if (index === 2) { rankColor = 'border-orange-700 shadow-[0_0_20px_rgba(180,80,0,0.1)]'; rankIcon = <Medal size={24} className="text-orange-700" />; }

                        return (
                            <div key={post.id} className={`flex items-center gap-6 p-4 rounded-2xl glass-panel border ${rankColor} ${scaleClass} transition-all hover:bg-white/5`}>
                                <div className="flex-shrink-0 w-16 text-center">
                                    {rankIcon || <span className="text-2xl font-black text-gray-600">#{index + 1}</span>}
                                </div>
                                <div className="flex-grow">
                                    <PostCard post={post} onClick={() => handlePostClick(post)} />
                                </div>
                                <div className="flex-shrink-0 w-32 text-right pr-4 hidden md:block">
                                     <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Performance</div>
                                     <div className="text-2xl font-black text-white">
                                         {activeEliteFilter === 'views' && (post.metrics?.views || 0).toLocaleString()}
                                         {activeEliteFilter === 'likes' && (post.metrics?.likes || 0).toLocaleString()}
                                         {activeEliteFilter === 'comments' && (post.metrics?.comments || 0).toLocaleString()}
                                         {activeEliteFilter === 'shares' && (post.metrics?.shares || 0).toLocaleString()}
                                     </div>
                                     <div className="text-[10px] text-[#19e6ff] font-bold uppercase">{activeEliteFilter}</div>
                                </div>
                            </div>
                        );
                    }

                    // STANDARD GRID VIEW
                    return (
                        <PostCard 
                        key={post.id} 
                        post={post} 
                        onClick={() => handlePostClick(post)}
                        />
                    );
                })
                ) : (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                    <p className="text-xl font-bold text-slate-400">Nenhum conteúdo encontrado</p>
                </div>
                )}
            </section>
          </>
        )}
      </div>

      <PostDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer} 
        post={selectedPost} 
      />

      <RankingAnalysisModal 
          isOpen={isAiModalOpen} 
          onClose={() => setIsAiModalOpen(false)} 
          data={aiData} 
          loading={isAiLoading} 
          allPosts={posts}
      />
    </>
  );
};

export default BibliotecaView;
