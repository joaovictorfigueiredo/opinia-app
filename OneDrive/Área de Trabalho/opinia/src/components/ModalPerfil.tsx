import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function ModalPerfil({ perfil, pools, onClose, usuarioLogado }: any) {
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  
  // ESTADO LOCAL: Permite que a tela atualize os números na hora do clique
  const [perfilLocal, setPerfilLocal] = useState(perfil);

  // 1. Geração do Fingerprint para segurança contra bots
  useEffect(() => {
    const gerarFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (e) {
        console.error("Erro ao gerar fingerprint", e);
      }
    };
    gerarFingerprint();
  }, []);

  // Atualiza o estado local se o perfil mudar externamente
  useEffect(() => {
    setPerfilLocal(perfil);
  }, [perfil]);

  if (!perfil) return null;

  // 2. Cálculo das estrelas (60/20 = 3 estrelas base)
  const estrelasAtivas = Math.round((perfilLocal.reputation || 60) / 20);

  // 3. FUNÇÃO DE VOTO MANUAL (Ignora o erro de RPC/Cache do Supabase)
  async function handleVoto(tipo: 'top' | 'bad') {
    const idCriador = perfilLocal?.id;
    const idAvaliador = usuarioLogado?.id;

    if (!idAvaliador) return alert("Faça login para avaliar!");
    if (!idCriador) return alert("Erro: ID do criador não encontrado.");
    if (idCriador === idAvaliador) return alert("Você não pode avaliar a si mesmo!");
    if (!fingerprint) return alert("Aguarde a identificação do dispositivo...");

    setLoading(true);
    try {
      // A. Grava o voto na tabela de contabilidade
      const { error: errVoto } = await supabase
        .from('reputacao_curtidas')
        .upsert({
          criador_id: idCriador,
          avaliador_id: idAvaliador,
          tipo: tipo,
          fingerprint: fingerprint
        }, { onConflict: 'criador_id,avaliador_id' });

      if (errVoto) throw errVoto;

      // B. Busca todos os votos para recalcular os números
      const { data: votos } = await supabase
        .from('reputacao_curtidas')
        .select('tipo')
        .eq('criador_id', idCriador);

      const tops = votos?.filter(v => v.tipo === 'top').length || 0;
      const bads = votos?.filter(v => v.tipo === 'bad').length || 0;

      // C. Cálculo da nova reputação (Base 60, Top +5, Bad -15)
      const novaReputacao = Math.min(100, Math.max(0, 60 + (tops * 5) - (bads * 15)));

      // D. Atualiza a tabela profiles no banco
      const { error: errPerfil } = await supabase
        .from('profiles')
        .update({
          total_top: tops,
          total_bad: bads,
          reputation: novaReputacao
        })
        .eq('id', idCriador);

      if (errPerfil) throw errPerfil;

      // E. ATUALIZAÇÃO VISUAL IMEDIATA (O "Pulo do Gato")
      setPerfilLocal({
        ...perfilLocal,
        total_top: tops,
        total_bad: bads,
        reputation: novaReputacao
      });

      alert("Avaliação registrada com sucesso!");
      // Opcional: remover o onClose() se quiser que o usuário veja os números mudando antes de fechar
      // onClose(); 
      
    } catch (err: any) {
      alert("Erro ao processar: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] w-full max-w-md rounded-[32px] p-8 border border-gray-800 shadow-2xl relative text-white font-sans">
        
        {/* Botão Fechar */}
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-all">
          ✕
        </button>

        {/* Cabeçalho do Perfil */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[#10b981] rounded-full flex items-center justify-center text-xl font-black text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            {(perfilLocal.nickname || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#10b981]">
              @{perfilLocal.nickname || 'Usuário'}
            </h2>
            
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span 
                    key={i} 
                    className={`text-[14px] ${i <= estrelasAtivas ? 'text-amber-400' : 'text-gray-700'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-500 text-[10px] font-bold font-mono">
                ({perfilLocal.reputation || 60}%)
              </span>
            </div>

            {/* PAINEL DE CREDIBILIDADE ATUALIZADO */}
            <div className="flex gap-4 mt-3 bg-black/40 p-2.5 rounded-xl border border-gray-800/50 w-fit">
              <div className="flex flex-col text-center px-1">
                <span className="text-[#10b981] text-[11px] font-black uppercase flex items-center gap-1">
                  👍 {perfilLocal.total_top || 0}
                </span>
                <span className="text-[7px] text-gray-500 uppercase font-black tracking-widest">TOP</span>
              </div>
              <div className="w-[1px] h-5 bg-gray-800 self-center"></div>
              <div className="flex flex-col text-center px-1">
                <span className="text-red-500 text-[11px] font-black uppercase flex items-center gap-1">
                  👎 {perfilLocal.total_bad || 0}
                </span>
                <span className="text-[7px] text-gray-500 uppercase font-black tracking-widest">BAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="space-y-4 mb-8">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1 h-1 bg-[#10b981] rounded-full"></span>
            Últimas Criações
          </h3>
          <div className="max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
            {pools.length > 0 ? pools.map((p: any) => (
              <div key={p.id} className="bg-black/20 p-3 rounded-xl border border-gray-800/50 text-[11px] font-bold italic text-gray-400 mb-2 hover:border-gray-700 transition-colors">
                {p.title}
              </div>
            )) : (
              <p className="text-gray-600 text-xs italic p-4 text-center">Nenhuma pool criada recentemente.</p>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-800/50">
          <button 
            disabled={loading}
            onClick={() => handleVoto('bad')} 
            className="bg-gray-800/30 hover:bg-red-950/30 text-red-500/80 hover:text-red-500 p-4 rounded-2xl font-black text-[10px] uppercase transition-all border border-transparent hover:border-red-900/50 disabled:opacity-30"
          >
            👎 Não Confiável
          </button>

          <button 
            disabled={loading}
            onClick={() => handleVoto('top')} 
            className="bg-[#10b981] hover:bg-[#0da371] text-black p-4 rounded-2xl font-black text-[10px] uppercase transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
          >
            {loading ? 'Processando...' : '👍 Criador Top'}
          </button>
        </div>
      </div>
    </div>
  );
}