import React from 'react';
import type { ChatSentiment, AvatarEmotion } from '../types';
import { Heart, Activity, Smile, Frown, Sparkles, Zap } from 'lucide-react';

interface SentimentHUDProps {
  currentSentiment?: ChatSentiment;
  avatarEmotion: AvatarEmotion;
  isTypingSentiment?: { score: number; label: string; mood: string };
}

export const SentimentHUD: React.FC<SentimentHUDProps> = ({
  currentSentiment,
  avatarEmotion,
  isTypingSentiment,
}) => {
  const activeScore = isTypingSentiment ? isTypingSentiment.score : currentSentiment?.score ?? 0.6;
  const activeLabel = isTypingSentiment ? isTypingSentiment.label : currentSentiment?.label ?? 'Ceria & Asik';
  const activeEmotion = currentSentiment?.userEmotion ?? 'Semangat';

  // Map score from -1.0..1.0 to percentage 0%..100%
  const percentage = Math.round(((activeScore + 1) / 2) * 100);

  const getVibeColor = (score: number) => {
    if (score > 0.4) return 'from-emerald-400 to-amber-400 text-amber-300';
    if (score < -0.2) return 'from-rose-400 to-indigo-400 text-rose-300';
    return 'from-sky-400 to-amber-300 text-sky-300';
  };

  return (
    <div className="p-3.5 rounded-2xl bg-[#0d131f]/90 border border-slate-800/80 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">Analisis Sentimen Real-Time</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/60 text-[11px] font-medium text-slate-300">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>{activeLabel}</span>
        </div>
      </div>

      {/* Meter Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Frown className="w-3 h-3 text-rose-400" /> Galau
          </span>
          <span className="text-amber-300 font-mono font-bold">
            {activeScore >= 0 ? `+${(activeScore * 100).toFixed(0)}%` : `${(activeScore * 100).toFixed(0)}%`}
          </span>
          <span className="flex items-center gap-1">
            Ceria <Smile className="w-3 h-3 text-emerald-400" />
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-950 p-0.5 overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${getVibeColor(activeScore)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Dynamic SIBEBEB Emotional Adaptation Note */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-start gap-2 text-[11px] text-slate-400 leading-tight">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-semibold">Adaptasi SIBEBEB: </span>
          {activeScore > 0.3
            ? 'Ekspresi riang gembira, pose ✌️ dua jari, dan nada suara ceria!'
            : activeScore < -0.2
            ? 'Ekspresi penuh perhatian, nada suara lembut, dan respon menenangkan.'
            : 'Ekspresi santai, kontak mata ramah, siap diajak ngobrol seru.'}
        </div>
      </div>
    </div>
  );
};
