import React from 'react';
import { Eye, Heart, MessageCircle, Video, Link, Copy, Clock, UserPlus, Share2 } from 'lucide-react';

// --- Colors (for consistency) ---
const colors = {
  bg: '#050814',
  primary: '#3bf5a5', 
  secondary: '#19e6ff',
  tiktok: '#ffffff',
  youtube: '#ff0000',
  shorts: '#19e6ff',
  instagram: '#E1306C',
};

// --- Helper Functions ---
const formatLargeNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toLocaleString('pt-BR');
};

const formatDuration = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds === 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return [m, s].map(v => v.toString().padStart(2, '0')).join(':');
};

// --- PostCard Component ---
const PostCard = ({ post, onClick, isPatternCard }) => {
  if (!post) {
    return <div className="p-4 border border-red-500 text-red-400">Erro: Post nulo.</div>;
  }

  const platform = post.platform ?? '';
  let badgeColor = '#888';
  let platformLabel = 'Vídeo';
  let platformImgSrc = '';

  if (platform.includes('youtube_shorts')) {
    badgeColor = colors.shorts;
    platformImgSrc = "/img/youtubeshorts.png";
    platformLabel = 'Shorts';
  } else if (platform.includes('youtube_long')) {
    badgeColor = colors.youtube;
    platformImgSrc = "/img/youtube.png";
    platformLabel = 'Longo';
  } else if (platform.includes('tiktok')) {
    badgeColor = colors.tiktok;
    platformImgSrc = "/img/tiktok.png";
    platformLabel = 'TikTok';
  } else if (platform.includes('instagram')) {
    badgeColor = colors.instagram;
    platformImgSrc = "/img/instagram.png";
    platformLabel = 'Reels';
  }

  const PlatformIcon = <img src={platformImgSrc} className="w-4 h-4" alt={platformLabel} />;

  // Logic for Title Display (TikTok uses description usually)
  const displayTitle = post.title || post.description || 'Vídeo sem Título';

  // Copy URL to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div 
      className={`w-full relative glass-panel rounded-2xl overflow-hidden group transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-2xl hover:border-primary/50 cursor-pointer ${isPatternCard ? 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : ''}`}
      onClick={onClick}
    >
        <div className="flex items-center min-h-[120px]">
          {/* Square Image (1x1) */}
          <div className="relative w-36 h-36 flex-shrink-0 bg-[#0a0f1f]">
            {post.thumbnail_url ? (
              <img 
                src={post.thumbnail_url} 
                alt={displayTitle} 
                className="w-full h-full object-cover rounded-l-2xl" 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "https://placehold.co/400x400/050814/FFF?text=Sem+Capa"; 
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center rounded-l-2xl">
                <Video size={40} className="text-gray-700" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
                {PlatformIcon}
                <span className="text-[10px] font-bold text-white uppercase tracking-wider" style={{ color: badgeColor }}>
                {platformLabel}
                </span>
            </div>
          </div>

          {/* Details (Title, Date, Link, Basic Metrics) */}
          <div className="flex-1 p-4 pr-3 min-w-0 flex flex-col justify-between">
            <div>
                <h3 className="text-base font-bold text-white line-clamp-2 group-hover:text-primary transition-colors" title={displayTitle}>
                {displayTitle}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-500 font-medium">
                    {post.published_at 
                        ? new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Data não disponível'
                    }
                    </p>
                </div>
            </div>
            
            {/* O "QUARTETO FANTÁSTICO" DE MÉTRICAS */}
            <div className="mt-4 grid grid-cols-4 gap-2 border-t border-white/5 pt-3">
                <div className="flex flex-col items-center gap-0.5" title="Visualizações">
                    <Eye size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-white">{formatLargeNumber(post.metrics?.views)}</span>
                </div>
                <div className="flex flex-col items-center gap-0.5" title="Curtidas">
                    <Heart size={14} className="text-red-500/70" />
                    <span className="text-xs font-bold text-white">{formatLargeNumber(post.metrics?.likes)}</span>
                </div>
                <div className="flex flex-col items-center gap-0.5" title="Comentários">
                    <MessageCircle size={14} className="text-purple-400/70" />
                    <span className="text-xs font-bold text-white">{formatLargeNumber(post.metrics?.comments)}</span>
                </div>
                <div className="flex flex-col items-center gap-0.5" title="Compartilhamentos">
                    <Share2 size={14} className="text-blue-400/70" />
                    <span className="text-xs font-bold text-white">{formatLargeNumber(post.metrics?.shares || 0)}</span>
                </div>
            </div>

            {post.url && (
                <div className="mt-3 flex items-center gap-1 text-gray-600 hover:text-primary transition-colors">
                    <Link size={12} />
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-[10px] truncate min-w-0 font-mono" onClick={(e) => e.stopPropagation()}>
                        {post.url}
                    </a>
                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(post.url); }} className="p-1 rounded hover:bg-white/10 ml-auto">
                        <Copy size={12} />
                    </button>
                </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default PostCard;