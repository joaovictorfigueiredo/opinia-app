import React from 'react';
import { Trophy, Skull, Users, MessageCircle } from 'lucide-react';

interface TicketProps {
  poolTitle: string;
  optionLabel: string;
  amount: number;
  multiplier: number;
  status: 'win' | 'lose';
  stats: { fav: number; contra: number };
  justificativa?: string;
  // NOVOS CAMPOS ADICIONADOS NA INTERFACE
  valorTotalPote?: number;
  qtdGanhadores?: number;
}

export const BetTicket = ({ 
  poolTitle, 
  optionLabel, 
  amount, 
  multiplier, 
  status, 
  stats,
  justificativa,
  // NOVOS CAMPOS RECEBIDOS NAS PROPS
  valorTotalPote,
  qtdGanhadores 
}: TicketProps) => {
  const isWin = status === 'win';

  return (
    <div className={`w-[320px] p-6 rounded-[35px] border-2 shadow-2xl relative overflow-hidden text-white transition-all
      ${isWin ? 'bg-[#064e3b] border-[#10b981]' : 'bg-[#450a0a] border-red-500'}`}>
      
      {/* Ícone de fundo */}
      <div className="absolute -right-4 -top-4 opacity-10 rotate-12 pointer-events-none">
        {isWin ? <Trophy size={140} /> : <Skull size={140} />}
      </div>

      <div className="text-center mb-6 relative z-10">
        <h2 className={`text-2xl font-black italic tracking-tighter ${isWin ? 'text-[#10b981]' : 'text-red-500'}`}>
          {isWin ? 'VITÓRIA!' : 'DERROTA'}
        </h2>
        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest text-center">OPINIA.RESULTADO</p>
      </div>

      <div className="space-y-4 relative z-10">
        <div>
          <p className="text-white/30 text-[9px] uppercase font-bold text-center">Evento</p>
          <p className="text-sm font-bold leading-tight uppercase text-center line-clamp-2">{poolTitle}</p>
        </div>

        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
            <div>
              <p className="text-white/30 text-[9px] uppercase font-bold">O seu Palpite</p>
              <p className="font-black italic text-sm">{optionLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-[9px] uppercase font-bold">Odds</p>
              <p className="font-black italic">x{multiplier.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-end pt-1">
            <div>
              <p className="text-white/30 text-[9px] uppercase font-bold">Aposta</p>
              <p className="text-lg font-black italic">R$ {amount.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className={`${isWin ? 'text-[#10b981]' : 'text-red-500'} text-[9px] uppercase font-bold text-center`}>
                {isWin ? 'Recebido' : 'Perdido'}
              </p>
              <p className={`text-lg font-black italic ${isWin ? 'text-[#10b981]' : 'text-white/20'}`}>
                R$ {isWin ? (amount * multiplier).toFixed(2) : '0,00'}
              </p>
            </div>
          </div>
        </div>

        {/* Seção de Transparência (VALIDADA) */}
        <div className="flex justify-between items-center px-4 py-2 bg-black/20 rounded-xl mb-3 border border-white/5">
          <div className="text-center">
            <p className="text-[7px] text-white/30 uppercase font-bold">Pote Total</p>
            {/* O uso do ? evita erro se valorTotalPote for undefined */}
            <p className="text-[10px] font-black text-white">R$ {valorTotalPote?.toFixed(2) || "0.00"}</p>
          </div>
          
          <div className="h-6 w-[1px] bg-white/10" />

          <div className="text-center">
            <p className="text-[7px] text-white/30 uppercase font-bold">Ganhadores</p>
            <p className="text-[10px] font-black text-[#10b981]">{qtdGanhadores || 0} fatias</p>
          </div>
        </div>

        {/* Estatísticas da Comunidade */}
        <div className="pt-2">
          <div className="flex justify-between text-[9px] font-black uppercase text-white/50 mb-1.5">
            <span className="flex items-center gap-1"><Users size={12} /> Comunidade</span>
            <span>{stats.fav}% VS {stats.contra}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
            <div style={{ width: `${stats.fav}%` }} className="h-full bg-[#10b981]" />
            <div style={{ width: `${stats.contra}%` }} className="h-full bg-red-500" />
          </div>
        </div>

        {/* --- BLOCO DE JUSTIFICATIVA --- */}
        {justificativa && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="bg-black/40 rounded-2xl p-3 border border-white/5 relative">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageCircle size={10} className={isWin ? 'text-[#10b981]' : 'text-red-500'} />
                <span className="text-[8px] font-black uppercase tracking-[2px] text-white/40">
                  Nota Oficial do Oráculo
                </span>
                
              </div>
              <p className="text-[11px] text-gray-300 italic leading-relaxed text-left pl-1">
                "{justificativa}"
              </p>
              
            </div>
          </div>
        )}
      </div>
      <div>
        <span className="text-[10px] text-gray-300 mt-1 opacity-70">
    Taxa de serviço da plataforma: 4% (já inclusa no cálculo de prêmios)
  </span>
      </div>
    </div>
  );
};