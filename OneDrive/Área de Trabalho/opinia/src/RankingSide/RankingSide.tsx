import React from 'react';
import { Trophy, Medal, Star } from 'lucide-react';

export function RankingSide({ ranking }: { ranking: any[] }) {
  return (
    <div className="bg-[#1e293b] rounded-[35px] p-6 border border-gray-800 shadow-2xl sticky top-8">
      {/* Título com a cor do seu Logo */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
        <Trophy className="text-[#10b981]" size={20} />
        <h3 className="text-white font-black italic uppercase tracking-tighter text-lg">
          Ranking Global
        </h3>
      </div>
      
      <div className="space-y-3">
        {ranking && ranking.length > 0 ? ranking.map((user, index) => (
          <div 
            key={user.id} 
            className="flex items-center justify-between bg-black/20 p-3 rounded-2xl border border-gray-800/50 hover:border-[#10b981/30] transition-all group"
          >
            <div className="flex items-center gap-3">
              {/* Medalhas para o Top 3 */}
              <div className="w-5 flex justify-center">
                {index === 0 ? <Medal className="text-yellow-500" size={18} /> : 
                 index === 1 ? <Medal className="text-gray-400" size={18} /> : 
                 index === 2 ? <Medal className="text-orange-700" size={18} /> : 
                 <span className="text-gray-600 font-black text-[10px]">{index + 1}º</span>}
              </div>

              <div>
                <p className="text-[11px] font-black text-white italic group-hover:text-[#10b981] transition-colors leading-none mb-1">
                  @{user.nickname || 'anonimo'}
                </p>
                <div className="flex items-center gap-1">
                  <Star className="text-amber-500" size={8} fill="currentColor" />
                  <span className="text-[8px] text-gray-500 font-bold uppercase">
                    {user.acertos || 0} Acertos
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[#10b981] font-black text-xs block">
                {user.ranking_score}
              </span>
              <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest">Score</p>
            </div>
          </div>
        )) : (
          <div className="py-8 text-center">
             <div className="animate-pulse text-gray-700 text-[10px] font-black uppercase">Carregando Top 5...</div>
          </div>
        )}
      </div>

      {/* Critérios na base do card */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-[6px] bg-black/40 text-gray-500 px-2 py-1 rounded-full font-bold uppercase">Reputação</span>
          <span className="text-[6px] bg-black/40 text-gray-500 px-2 py-1 rounded-full font-bold uppercase">Acertos</span>
          <span className="text-[6px] bg-black/40 text-gray-500 px-2 py-1 rounded-full font-bold uppercase">Volume</span>
        </div>
      </div>
    </div>
  );
}