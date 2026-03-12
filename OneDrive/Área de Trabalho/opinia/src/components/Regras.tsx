import React from 'react';
import { Shield, CheckCircle, Lock, AlertTriangle, ArrowLeft, Scale } from 'lucide-react';

// Ajustamos aqui para receber o comando de fechar a página e voltar para a home
interface RegrasProps {
  onVoltar: () => void;
}

export default function Regras({ onVoltar }: RegrasProps) {
  const regras = [
    {
      icon: <CheckCircle className="text-green-400" />,
      title: "Verificabilidade Pública",
      desc: "Toda pool deve ser baseada em fatos que qualquer um possa conferir em grandes portais (G1, ESPN, CNN, etc). Pools privadas ou subjetivas ('Eu sou bonito?') são proibidas."
    },
    {
      icon: <Lock className="text-blue-400" />,
      title: "Apostas Definitivas",
      desc: "Uma vez confirmado o palpite, ele é registrado no banco de dados e não pode ser alterado. Isso evita manipulações após o início dos eventos."
    },
    {
      icon: <AlertTriangle className="text-red-400" />,
      title: "Política de Banimento",
      desc: "Fraudes, criação de pools falsas ou tentativa de enganar a comunidade resultam em banimento imediato e perda total do saldo da conta."
    },
    {
      icon: <Scale className="text-purple-400" />,
      title: "Resolução de Conflitos",
      desc: "Se um criador encerrar uma pool incorretamente, a comunidade pode denunciar. A moderação revisará e punirá criadores de má-fé."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12 font-sans animate-in fade-in duration-500">
      {/* Botão Voltar ajustado para usar a função do App.tsx */}
      <button 
        onClick={onVoltar}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-all mb-12 uppercase text-[10px] font-black tracking-widest group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        Voltar para o Opinia
      </button>

      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase">
            REGRAS DA <span className="text-green-500 font-black">COMUNIDADE</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            O <span className="text-white font-bold">OPINIA.</span> é baseado em transparência. Para manter o ecossistema justo, seguimos diretrizes rígidas de moderação.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regras.map((regra, index) => (
            <div key={index} className="bg-white/5 border border-white/10 p-8 rounded-[32px] hover:border-white/20 transition-all group">
              <div className="mb-6 bg-white/5 w-fit p-4 rounded-2xl group-hover:scale-110 transition-transform">
                {regra.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 italic uppercase">{regra.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">
                {regra.desc}
              </p>
            </div>
          ))}
        </div>

        <footer className="mt-20 p-8 border-t border-white/5 text-center">
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[24px]">
            <p className="text-red-400 text-xs font-black uppercase tracking-widest">
              Aviso: O descumprimento resultará no encerramento da conta sem aviso prévio.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}