import React from 'react';
import { X, Info } from 'lucide-react';

const InfoHelpModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Compacto */}
        <div className="bg-[#1e293b] px-4 py-3 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-[#19e6ff]/10 text-[#19e6ff]">
                    <Info size={14} />
                </div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
            </button>
        </div>

        {/* Content - Texto Menor */}
        <div className="p-5">
            <div className="text-[12px] text-gray-400 leading-relaxed whitespace-pre-line font-medium">
                {content}
            </div>
        </div>

        {/* Footer Decorativo Fino */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#19e6ff] to-transparent opacity-50"></div>
      </div>
    </div>
  );
};

export default InfoHelpModal;