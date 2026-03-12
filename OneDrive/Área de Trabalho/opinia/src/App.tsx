import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ModalPerfil } from './components/ModalPerfil';
import { RankingSide } from './RankingSide/RankingSide';
import './App.css';
import { motion, AnimatePresence } from 'framer-motion';
import { BetTicket } from './components/BetTicket';
import { Shield, Scale, Trophy, Skull, Users } from 'lucide-react';


// --- TIPOS ---
type AbaType = 'explorar' | 'minhas_apostas' | 'criadas_por_mim';

//cronometro de pagamento
const calcularTempoRestante = (releaseAt: string) => {
  const agora = new Date().getTime();
  const destino = new Date(releaseAt).getTime();
  const diferenca = destino - agora;

  if (diferenca <= 0) return "LIBERADO";

  const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

  return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
};
//cronometro de pagamento fim

//fingerprint
const getDeviceFingerprint = () => {
  const navigator_info = window.navigator.userAgent;
  const screen_info = `${window.screen.width}x${window.screen.height}`;
  // Cria uma hash simples em Base64
  return btoa(`${navigator_info}-${screen_info}`).substring(0, 32);
};
//fim finger print

// --- SUB-COMPONENTES ---

// 1. COMPONENTE DE NAVEGAÇÃO (ABAS)
function NavegacaoPools({ abaAtiva, setAbaAtiva }: any) {
  const abas = [
    { id: 'explorar', label: 'Explorar', icon: '🔥' },
    { id: 'minhas_apostas', label: 'Onde Apostei', icon: '💰' },
    { id: 'criadas_por_mim', label: 'Minhas Criações', icon: '🛠️' },
    { id: 'ativas', label: 'Ativas', icon: '🟢' },
     { id: 'finalizadas', label: 'Finalizadas', icon: '🏁' },
  ];

  return (
    <div className="flex gap-6 mb-8 border-b border-gray-800 overflow-x-auto no-scrollbar">
      {abas.map((aba) => (
        <button
          key={aba.id}
          onClick={() => setAbaAtiva(aba.id)}
          className={`flex items-center gap-2 whitespace-nowrap pb-4 transition-all duration-200 font-black text-[11px] uppercase tracking-wider ${
            abaAtiva === aba.id 
              ? 'border-b-2 border-[#10b981] text-[#10b981]' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span>{aba.icon}</span>
          {aba.label}
        </button>
      ))}
    </div>
  );
}
function ContadorRegressivo({ dataFinal }: { dataFinal: string }) {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>({h:0, m:0, s:0});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(dataFinal).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          h: Math.floor((diff / (1000 * 60 * 60))),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [dataFinal]);

  if (!timeLeft) return <span>ENCERRADO</span>;

  return (
    <>{timeLeft.h}h {timeLeft.m}m {timeLeft.s}s</>
  );
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  
  const [titulo, setTitulo] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [tema, setTema] = useState('⚽ Esportes') 
  const [pools, setPools] = useState<any[]>([])
  const [filtroAtivo, setFiltroAtivo] = useState('Todos')
  
  

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalTransacaoOpen, setIsModalTransacaoOpen] = useState<'deposito' | 'saque' | null>(null)
  const [valorTransacao, setValorTransacao] = useState('')
  const [selectedOption, setSelectedOption] = useState<any>(null)
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [valorAposta, setValorAposta] = useState('')
  const [historico, setHistorico] = useState<any[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const requestId = crypto.randomUUID();
  const [valorPendente, setValorPendente] = useState(0);
  const [temContestacao, setTemContestacao] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('explorar');
  const [perfilAberto, setPerfilAberto] = useState<any>(null);
  const [poolsDoCriador, setPoolsDoCriador] = useState<any[]>([]);
  const [ranking, setRanking] = useState([]);
  const [justificativa, setJustificativa] = useState('');
 const [confirmacaoEncerramento, setConfirmacaoEncerramento] = useState<any>({
  aberto: false,
  poolId: '',
  optionId: '',
  textoOpcao: '',
  ownerId: ''
});

const [sucessoPublicacao, setSucessoPublicacao] = useState<any>({ aberto: false, mensagem: '', tipo: 'sucesso' });
const [minutosExpiracao, setMinutosExpiracao] = useState<number>(0);
const [agora, setAgora] = useState(new Date());
// Estados para o Ticket de Resultado
const [isApostaConcluida, setIsApostaConcluida] = useState(false);
const [dadosTicket, setDadosTicket] = useState<{
  poolTitle: string;
  optionLabel: string;
  amount: number;
  multiplier: number;
  status: 'win' | 'lose';
  qtdGanhadores?: number; 
  valorTotalPote?: number;
  stats: { fav: number; contra: number };
  justificativa?: string; // <--- Certifique-se que esta linha está aqui
} | null>(null);
  

// Isso vai fazer o React "acordar" a cada segundo e re-checar os botões
useEffect(() => {
  const interval = setInterval(() => setAgora(new Date()), 1000);
  return () => clearInterval(interval);
}, []);


/*ticket*/
useEffect(() => {
  if (!user?.id) return;

  const canal = supabase
    .channel('debug-resultado')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'pools' },
      async (payload) => {
        // 1. O código chegou aqui?
        console.log("RECEBI MUDANÇA NA POOL!", payload.new.status);

        if (payload.new.status === 'closed') {
          console.log("Status é CLOSED. Procurando bet para user:", user.id);

          const { data: minhaAposta, error } = await supabase
            .from('bets')
            .select('*')
            .eq('pool_id', payload.new.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error("Erro na busca da bet:", error);
            return;
          }

          if (!minhaAposta) {
            console.warn("VOCÊ NÃO TEM APOSTA NESSA POOL. ID da Pool:", payload.new.id);
            // TESTE: Remova o comentário abaixo para forçar o modal mesmo sem aposta
            // setDadosTicket({ poolTitle: payload.new.title, status: 'win', amount: 10, multiplier: 2, optionLabel: 'TESTE', stats: {fav:50, contra:50} });
            // setIsApostaConcluida(true);
            return;
          }

          console.log("BET ENCONTRADA! Abrindo ticket...");
          
          const ganhou = minhaAposta.option_id === payload.new.winner_id;
          setDadosTicket({
            poolTitle: payload.new.title,
            optionLabel: minhaAposta.option_label || (ganhou ? "VENCEDOR" : "CONTRA"),
            amount: minhaAposta.amount,
            multiplier: payload.new.final_multiplier || 1.0,
            status: ganhou ? 'win' : 'lose',
            stats: { fav: 50, contra: 50 },
            qtdGanhadores: payload.new.total_winners, // Nova coluna
            valorTotalPote: payload.new.total_pool_sum, // Nova coluna
            justificativa: (payload.new as any).justificativa
          });
          setIsApostaConcluida(true);
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(canal); };
}, [user?.id]);
/*ticket*/


useEffect(() => {
  console.log("Iniciando escuta da tabela pools...");

  const canalTeste = supabase
    .channel('qualquer-nome')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'pools' },
      (payload) => {
        console.log("RECEBI UM UPDATE!", payload);
        
        
        // Aqui dentro vai a lógica do Ticket que te mandei antes
        if (payload.new.status === 'finished') {
           // ... lógica do minhaAposta
        }
      }
    )
    .subscribe((status) => {
      console.log("Status da conexão:", status);
    });

  return () => { supabase.removeChannel(canalTeste); };
}, []);
  
useEffect(() => {
  // Configura o canal para escutar a tabela de apostas
  const canalApostas = supabase
    .channel('atualizacao-pote-total')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bets' }, // Certifique-se que o nome na tabela é 'apostas'
      () => {
        console.log("Nova aposta detectada! Atualizando pote total...");
        buscarPools(); // <-- Isso faz o valor de R$ 20.00 subir para R$ 21.00 sozinho
      }
    )
    .subscribe();

  // Limpa a conexão ao sair da página para não gastar memória
  return () => {
    supabase.removeChannel(canalApostas);
  };
}, []);

  const temasDisponiveis = [
    '⚽ Esportes', '🎮 Games', '🗳️ Política', '📺 Entretenimento', 
    '📱 Internet', '💰 Economia', '🚀 Lançamentos', '⚙️ Geral'
  ]

  


  
const buscarRanking = async () => {
  const { data, error } = await supabase
    .from('ranking_global')
    .select('*')
    .limit(5);

  if (!error && data) {
    setRanking(data as any); // Use apenas 'as any' sem os colchetes para testar
  }
};

  useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
    if (session?.user) {
      buscarPerfil(session.user.id)
      buscarHistorico(session.user.id)
      buscarSaldosPendentes(session.user.id) // <-- NOVO: Busca inicial ao logar
      buscarRanking()
    }
  })
  
  buscarPools()
  buscarRanking()

  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
        buscarPools()
        if (user) {
          buscarPerfil(user.id)
          buscarHistorico(user.id)
          buscarSaldosPendentes(user.id) // <-- NOVO: Atualiza se houver nova aposta
          buscarRanking()
        }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        if (user) buscarPerfil(user.id)
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pools' }, () => {
        buscarPools()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        if (user) buscarHistorico(user.id)
    })
    // ABAIXO O BLOCO NOVO PARA O COFRE:
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_payouts' }, () => {
        if (user) {
          buscarSaldosPendentes(user.id) // <-- NOVO: Atualiza o cofre em tempo real
          buscarPerfil(user.id)         // <-- NOVO: Garante que o saldo atualize quando o prêmio cair
        }
    })
    .subscribe()

  return () => {
    subscription.unsubscribe()
    supabase.removeChannel(channel)
  }
}, [user?.id, abaAtiva])

  async function buscarHistorico(userId: string) {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  }

 async function handleSignUp() {
  if (!email || !password) return alert("Preencha e-mail e senha!");
  
  // 1. Cadastro no Auth do Supabase
  const { data, error } = await supabase.auth.signUp({ email, password });
  
  if (error) return alert("Erro no cadastro: " + error.message);

  if (data.user) {
    const fingerprint = getDeviceFingerprint(); // Função que gera o DNA do aparelho

    // 2. Criação manual do perfil vinculado ao dispositivo (Obrigatório para o Ledger)
    await supabase.from('profiles').insert([
      { 
        id: data.user.id, 
        email: email, 
        last_device_id: fingerprint,
        balance: 0 
      }
    ]);

    alert("Cadastro realizado! Verifique seu e-mail.");
    setUser(data.user);
  }
}

async function handleLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) return alert("Erro: " + error.message);

  if (data.user) {
    const fingerprint = getDeviceFingerprint();

    // 3. ATUALIZAÇÃO CRÍTICA: Vincula o login atual ao aparelho
    // Isso alimenta a lógica de "Em Análise" vista na image_e9ce96.png
    await supabase
      .from('profiles')
      .update({ 
        last_device_id: fingerprint,
        last_login: new Date().toISOString() 
      })
      .eq('id', data.user.id);

    setUser(data.user);
  }
}

  async function atualizarNickname() {
    if (!tempNickname.trim() || !user) {
      setIsEditingNickname(false);
      return;
    }
    const { error } = await supabase.from('profiles').update({ nickname: tempNickname }).eq('id', user.id);
    if (error) {
      if (error.code === '23505') alert("Este nickname já está em uso. Tente outro!");
      else alert("Erro ao salvar: " + error.message);
    } else {
      setPerfil({ ...perfil, nickname: tempNickname });
      setIsEditingNickname(false);
    }
  }

  async function buscarPerfil(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error && error.code === 'PGRST116') {
      const { data: newProfile } = await supabase.from('profiles').insert([{ id: userId, balance: 50, reputation: 60 }]).select().single()
      if (newProfile) setPerfil(newProfile)
      return
    }
    if (data) {
        const { data: bets } = await supabase.from('bets').select('amount').eq('user_id', userId)
        const totalMovimentado = bets?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
        setPerfil({ ...data, totalMovimentado })
    }
  }
  //configuração de pagamento pendente
  async function buscarSaldosPendentes(userId: string) {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('pending_payouts')
      .select('amount, is_contested, release_at')
      .eq('user_id', userId)
      .in('status', ['pending', 'contested']);

    if (error) throw error;

    if (data) {
      const total = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      setValorPendente(total);
      setTemContestacao(data.some(p => p.is_contested));
    }
  } catch (error) {
    console.error("Erro ao buscar saldos pendentes:", error);
  }
}

  async function buscarPools() {
  // 1. Iniciamos a busca com a estrutura que você já tem
  let query = supabase
    .from('pools')
    .select(`*, profiles:user_id (reputation, nickname), pool_options (*, bets (amount, user_id))`)
    .order('created_at', { ascending: false });

  // 2. FILTRO DE ORIGEM (Abas)
  // Se a aba for "Onde Apostei", filtramos apenas as pools onde seu ID aparece nas apostas
  if (abaAtiva === 'minhas_apostas' && user) {
    const { data: minhasBets } = await supabase
      .from('bets')
      .select('pool_id')
      .eq('user_id', user.id);
    
    const idsRelacionados = minhasBets?.map(b => b.pool_id) || [];
    query = query.in('id', idsRelacionados);
  } 
  // Se a aba for "Minhas Criações", filtramos pelo seu ID de criador
  else if (abaAtiva === 'criadas_por_mim' && user) {
    query = query.eq('user_id', user.id);
  }

  // 3. FILTRO DE STATUS (Facilita muito a navegação)
  // Se você quiser ver apenas as que ainda aceitam apostas:
  // query = query.eq('status', 'open');
  // 3. FILTRO DE STATUS (Unificado com as novas abas)
if (abaAtiva === 'ativas') {
  query = query.eq('status', 'open');
} else if (abaAtiva === 'finalizadas') {
  query = query.eq('status', 'closed');
}
  // Se quiser ver apenas as que já foram encerradas:
  // query = query.eq('status', 'closed');

  const { data, error } = await query;
  if (data) setPools(data);
}

 async function gerenciarSaldo() {
  const valor = parseFloat(valorTransacao);
  if (isNaN(valor) || valor <= 0) return alert("Valor inválido");

  // 1. Ativa o bloqueio (isActionLoading vira true)
  setIsActionLoading(true);

  try {
    let novoSaldo = perfil?.balance || 0;
    if (isModalTransacaoOpen === 'deposito') {
      novoSaldo += valor;
    } else {
      if (valor > novoSaldo) {
        alert("Saldo insuficiente para saque!");
        // O finally vai rodar e liberar o botão automaticamente
        return; 
      }
      novoSaldo -= valor;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ balance: novoSaldo })
      .eq('id', user.id);

    if (error) throw error;

    // Se tudo der certo, limpa os campos e fecha o modal
    setIsModalTransacaoOpen(null);
    setValorTransacao('');
    buscarPerfil(user.id);

  } catch (error: any) {
    alert("Erro na transação: " + error.message);
  } finally {
    // 2. Libera o botão (isActionLoading vira false)
    // Isso roda mesmo se der erro ou se der sucesso!
    setIsActionLoading(false);
  }
}

 async function criarPool() {
  if (!titulo || !user) {
    setSucessoPublicacao({
      aberto: true,
      mensagem: "Por favor, preencha o título antes de continuar!",
      tipo: 'erro'
    });
    return;
  }

  setIsActionLoading(true);

  try {
    // --- CÁLCULO DO TEMPO EM MINUTOS ---
    let expiresAt = null;
    if (minutosExpiracao > 0) {
      const agora = new Date();
      // Multiplicamos minutos por 60000 para converter em milissegundos
      expiresAt = new Date(agora.getTime() + minutosExpiracao * 60000).toISOString();
    }

    const slug = `${titulo.toLowerCase().replace(/ /g, '-')}-${Date.now()}`;

    // 2. Insere a Pool principal
    const { data: newPool, error: poolError } = await supabase
      .from('pools')
      .insert([{ 
        title: titulo, 
        slug: slug, 
        is_public: isPublic, 
        user_id: user.id, 
        category: tema, 
        status: 'open',
        expires_at: expiresAt //
      }])
      .select()
      .single();

    if (poolError) throw poolError;

    const { error: optionsError } = await supabase
      .from('pool_options')
      .insert([
        { pool_id: newPool.id, label: '👍 Favorável' }, 
        { pool_id: newPool.id, label: '👎 Contra' }
      ]);

    if (optionsError) throw optionsError;

    // 4. Limpeza e Sucesso
    setTitulo('');
    
    // --- RESETAR O CAMPO DE MINUTOS ---
    setMinutosExpiracao(0); 
    
    buscarPools();

    setSucessoPublicacao({
      aberto: true,
      mensagem: "Pool criada com sucesso! Já pode começar os palpites.",
      tipo: 'sucesso'
    });

  } catch (error: any) {
    setSucessoPublicacao({
      aberto: true,
      mensagem: "Erro ao criar pool: " + error.message,
      tipo: 'erro'
    });
  } finally {
    setIsActionLoading(false);
  }
}

//hitorico de criador
async function buscarHistoricoCriador(userId: string) {
  const { data } = await supabase
    .from('pools')
    .select('*, profiles:user_id (nickname, reputation)')
    .eq('user_id', userId)
    .limit(5); 
  if (data) setPoolsDoCriador(data);
}
//hitorico de criador fim 

  async function confirmarAposta() {
  const valor = parseFloat(valorAposta);
  if (!user?.id || isNaN(valor) || valor <= 0 || valor > (perfil?.balance || 0)) {
    return alert("Dados inválidos ou saldo insuficiente.");
  }

  setIsActionLoading(true);

  try {
    // 1. GERA A DIGITAL DO APARELHO (NOVO)
    const fingerprint = getDeviceFingerprint(); 
    
    // 2. MANTÉM O REQUEST ID (BOA PRÁTICA)
    const requestId = crypto.randomUUID(); 

    // 3. CHAMA A RPC QUE AGORA TAMBÉM CHECA O DISPOSITIVO
    const { error: rpcError } = await supabase.rpc('processar_aposta_ledger', { 
      p_user_id: user.id, 
      p_pool_id: selectedPool.id, 
      p_option_id: selectedOption.id, 
      p_amount: valor,
      p_request_id: requestId,
      p_device_id: fingerprint // <--- NOVO: Envia a digital do aparelho
    });

    if (rpcError) throw new Error(rpcError.message);

    // Sucesso: limpa e atualiza tudo
    setIsModalOpen(false);
    setValorAposta('');
    
    // Atualiza os estados para refletir o novo saldo e histórico
    buscarPerfil(user.id);
    buscarPools();
    buscarHistorico(user.id); // <--- Importante para ver a linha no Livro Razão
    
  } catch (error: any) {
    // Se a RPC detectar que o mesmo aparelho está em outra conta, 
    // ela retornará o erro aqui.
    alert("Erro de Segurança: " + error.message);
  } finally {
    setIsActionLoading(false);
  }
}
  async function encerrarPool(poolId: string, optionId: string, ownerId: string, justificativa: string) {
  // Segurança básica
  if (user?.id !== ownerId) return;

  try {
    // 1. DISTRIBUIÇÃO (RPC)
    // Chamamos a função no banco que gera os ganhadores
    const { error: rpcError } = await supabase.rpc('distribuir_premios', {
      p_pool_id: poolId,
      p_opcao_vencedora_id: optionId
    });

    if (rpcError) throw rpcError;

    // A nova função para dar o bônus ao criador
    await supabase.rpc('pagar_criador_pool', { p_pool_id: poolId });

    // --- PAUSA DE SINCRONIA ---
    // Aguarda 500ms para o banco processar as tabelas antes de lermos os dados
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. BUSCA DE DADOS REAIS
    // Busca o volume total (usando Promise.all para ser mais rápido)
    const [betsRes, winnersRes] = await Promise.all([
      supabase.from('bets').select('amount').eq('pool_id', poolId),
      supabase.from('pending_payouts').select('*', { count: 'exact', head: true }).eq('pool_id', poolId)
    ]);

    if (betsRes.error) throw betsRes.error;

    // Cálculo garantindo que o valor seja numérico (resolve Pote R$ 0.00)
    const poteCalculado = betsRes.data?.reduce((acc, b) => acc + Number(b.amount || 0), 0) || 0;
    const totalGanhadores = winnersRes.count || 0;

    // 3. UPDATE FINAL ÚNICO
    // Salva tudo de uma vez para o Realtime do App.tsx ler os dados completos
    const { error: updateError } = await supabase
      .from('pools')
      .update({ 
        status: 'closed',
        winner_id: optionId,
        justificativa: justificativa,
        total_winners: totalGanhadores,
        total_pool_sum: poteCalculado
      })
      .eq('id', poolId);

    if (updateError) throw updateError;

    // Atualiza a lista local
    buscarPools();

  } catch (error: any) {
    console.error("Erro no encerramento: " + error.message);
  }
}
  
  const contestarResultado = async (poolId: string) => {
  try {
    const { error } = await supabase.rpc('disparar_contestacao', { 
      p_pool_id: poolId 
    });

    if (error) throw error;
    
    alert("Contestação enviada! O prazo de liberação foi estendido para 3 horas para análise.");
  } catch (error) {
    console.error("Erro ao contestar:", error);
  }
};

  const calcularDadosPool = (pool: any) => {
    const opcoes = pool.pool_options || []
    const totalPote = opcoes.reduce((acc: number, opt: any) => acc + (opt.bets?.reduce((sum: number, b: any) => sum + (b.amount || 0), 0) || 0), 0)
    return { totalPote, opcoes }
  }

  const obterGanhoEstimado = () => {
    if (!selectedOption || !selectedPool || !valorAposta) return 0
    const { totalPote } = calcularDadosPool(selectedPool)
    const totalOpcao = (selectedOption.bets || []).reduce((s: number, b: any) => s + (b.amount || 0), 0)
    const valorNum = parseFloat(valorAposta)
    const multiplicador = (totalOpcao + valorNum) > 0 ? ((totalPote + valorNum) / (totalOpcao + valorNum)) : 1
    return valorNum * multiplicador
  }

  const poolsFiltradas = filtroAtivo === 'Todos' 
    ? [...pools].sort((a, b) => calcularDadosPool(b).totalPote - calcularDadosPool(a).totalPote)
    : pools.filter(p => p.category === filtroAtivo)

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1e293b] p-8 rounded-3xl border border-gray-800 shadow-2xl">
          <h1 className="text-4xl font-black mb-8 text-center text-[#10b981]">Opinia</h1>
          <div className="space-y-4">
            <input type="email" placeholder="E-mail" className="w-full p-4 rounded-xl bg-[#0f172a] border border-gray-700 outline-none focus:border-[#10b981]" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Senha" className="w-full p-4 rounded-xl bg-[#0f172a] border border-gray-700 outline-none focus:border-[#10b981]" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin} className="w-full bg-[#10b981] p-4 rounded-xl font-black text-[#0f172a] hover:opacity-90 transition-all">ENTRAR NO PAINEL</button>
            <button onClick={handleSignUp} className="w-full border border-gray-700 p-4 rounded-xl font-black text-gray-400 hover:text-white hover:border-[#10b981] transition-all">CRIAR CONTA</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className=" mx-auto flex flex-col lg:flex-row gap-10">

        {/* 1. COLUNA ESQUERDA (RANKING) */}
<aside className="hidden lg:block w-[280px]">
  <RankingSide ranking={ranking} />
</aside>
        
        {/* COLUNA PRINCIPAL */}
        <div className="flex-1 space-y-10">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-[#10b981] italic tracking-tighter uppercase">OPINIA.</h1>
            <button onClick={() => { supabase.auth.signOut(); setUser(null); }} className="text-gray-500 font-bold text-[10px] bg-gray-900/50 px-4 py-2 rounded-full uppercase hover:text-white transition-all">Sair</button>
          </div>
          <div><NavegacaoPools abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} /></div>

          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            <button onClick={() => setFiltroAtivo('Todos')} className={`px-6 py-2.5 rounded-full text-[11px] font-black transition-all border whitespace-nowrap ${filtroAtivo === 'Todos' ? 'bg-[#10b981] text-[#0f172a] border-[#10b981]' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>🔥 TODOS</button>
            {temasDisponiveis.map(t => (
              <button key={t} onClick={() => setFiltroAtivo(t)} className={`px-6 py-2.5 rounded-full text-[11px] font-black transition-all border whitespace-nowrap ${filtroAtivo === t ? 'bg-[#10b981] text-[#0f172a] border-[#10b981]' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>{t.toUpperCase()}</button>
            ))}
          </div>
          
<div className="mb-6 w-full max-w-4xl mx-auto">
  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4 backdrop-blur-sm">
    <div className="bg-blue-500/20 p-2 rounded-xl">
      <Shield size={20} className="text-blue-400" />
    </div>
    
    <div className="flex-1">
      <h4 className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-1">
        Regra da Comunidade
      </h4>
      <p className="text-gray-400 text-xs leading-relaxed">
        É proibido criar pools cujos resultados não possam ser <span className="text-white font-medium">verificados publicamente</span>. 
        Uma vez confirmadas, as apostas são <span className="text-white font-medium">definitivas</span> para garantir a justiça do pote e evitar manipulações.<span>
          Criação de pools proibidas resultarão em banimento imediato e permanente da conta. RESPEITE AS REGRAS
        </span>
      </p>
    </div>

    {/* Opcional: Um selo de "Auditado" ou "Seguro" no canto */}
    <div className="hidden md:block opacity-20 transform rotate-12">
      <Scale size={40} className="text-white" />
    </div>
  </div>
</div>
          <div className="bg-[#1e293b] p-10 rounded-[40px] border border-gray-800 shadow-2xl">
            <input className="w-full p-0 bg-transparent mb-8 text-3xl font-black outline-none placeholder-green-700" placeholder="Qual sua previsão?" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <select className="bg-[#0f172a] p-4 rounded-2xl border border-gray-800 text-xs text-[#10b981] font-bold outline-none" value={tema} onChange={(e) => setTema(e.target.value)}>
                {temasDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="flex bg-[#0f172a] p-1.5 rounded-2xl border border-gray-800">
                <button onClick={() => setIsPublic(true)} className={`flex-1 p-3 rounded-xl text-[10px] font-black ${isPublic ? 'bg-[#10b981] text-[#0f172a]' : 'text-gray-500'}`}>PÚBLICA</button>
                <button onClick={() => setIsPublic(false)} className={`flex-1 p-3 rounded-xl text-[10px] font-black ${!isPublic ? 'bg-[#10b981] text-[#0f172a]' : 'text-gray-500'}`}>PRIVADA</button>
                
              </div>
            </div>
            <div className="mb-6">
  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-3 block">
    Duração da Pool (Minutos) opcional
  </label>
  <input 
    type="number"
    min="0"
    value={minutosExpiracao || ''}
    onChange={(e) => setMinutosExpiracao(Math.max(0, Number(e.target.value)))}
    placeholder="Ex: 60 (para 1 hora)"
    className="w-full bg-[#0f172a] border border-gray-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-[#10b981] transition-all"
  />
  <p className="text-[9px] text-gray-600 mt-2 font-bold italic uppercase">
    {minutosExpiracao > 0 ? `Fecha em ${minutosExpiracao} minutos` : "Fechamento manual"}
  </p>
</div>
            <button 
  onClick={criarPool} 
  disabled={isActionLoading}
  className={`w-full p-5 rounded-2xl font-black text-[#0f172a] text-lg transition-all ${
    isActionLoading ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-[#10b981] hover:opacity-90'
  }`}
>
  {isActionLoading ? 'PUBLICANDO...' : 'PUBLICAR AGORA'}
</button>
          </div>

          <div className="space-y-10">
            {poolsFiltradas.map((pool: any) => {
              const { totalPote, opcoes } = calcularDadosPool(pool)
              return (
                <div key={pool.id} className="p-10 bg-[#1e293b] rounded-[40px] border border-gray-800 relative shadow-xl overflow-hidden group">
                  <div className="flex items-center gap-3 mb-6">
                    <div 
  onClick={() => { 
    // Forçamos o ID para dentro do objeto que vai para o Modal
    const dadosPerfil = { 
      ...pool.profiles, 
      id: pool.user_id // O user_id da pool é o ID do criador
    };
    console.log("Abrindo perfil de:", dadosPerfil.id); 
    setPerfilAberto(dadosPerfil); 
    buscarHistoricoCriador(pool.user_id); 
  }}
  className="w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center font-black text-[#0f172a] text-[10px] cursor-pointer relative z-50"
>
  {(pool.profiles?.nickname || 'U').substring(0, 2).toUpperCase()}
</div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">@{pool.profiles?.nickname || 'usuario'}</p>
                    {/* 2. O CRONÔMETRO DENTRO DO CARD */}
    {pool.expires_at && pool.status === 'open' && (
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
          <span className="text-amber-500 text-[10px] font-black uppercase italic tracking-wider">
             FECHA EM: <ContadorRegressivo dataFinal={pool.expires_at} />
          </span>
        </div>
      </div>
    )}
                  </div>
                  <div className="poolsresultados flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <h3 className="textoaposta text-2xl font-black">{pool.title}</h3>
                    <div className="poteclass bg-[#0f172a] p-4 rounded-3xl border border-gray-800 min-w-[140px] text-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Pote Total</p>
                      <div className="relative flex justify-center">
  <AnimatePresence mode="popLayout"> 
  <motion.p
    key={totalPote} // O gatilho: anima sempre que o valor total mudar
    initial={{ y: 20, opacity: 0 }} // Começa em baixo e invisível
    animate={{ 
      y: [20, -5, 0], // Sobe, passa ligeiramente e estabiliza (slot machine)
      opacity: 1, // Torna-se visível
      color: ['#10b981', '#ffffff', '#10b981'], // Pisca em verde-esmeralda/branco/verde-esmeralda
      transition: {
        type: "spring", // Usa um efeito de mola para um movimento mais orgânico
        stiffness: 150, // "Rigidez" da mola
        damping: 10, // "Amortecimento"
      }
    }}
    exit={{ y: -20, opacity: 0 }} // Quando o valor antigo sai, ele sobe e desaparece
    className="text-[#10b981] font-black text-2xl tracking-tighter leading-none italic"
  >
    R$ {totalPote.toFixed(2)}
  </motion.p>
</AnimatePresence>
</div>
                    </div>
                    
                  </div>
               
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {opcoes.map((option: any) => {
    // 1. Calculamos a trava aqui dentro para cada opção
    const tempoExpirou = pool.expires_at && new Date(pool.expires_at) < agora;
    const estaBloqueado = pool.status === 'closed' || pool.status === 'finished' || tempoExpirou;

    // 2. Cálculos do pote que você já tinha
    const totalOpcao = (option.bets || []).reduce((s: number, b: any) => s + (b.amount || 0), 0);
    const multiplicador = totalOpcao > 0 ? (totalPote / totalOpcao) : 1;

    return (
      <div key={option.id} className="p-6 bg-[#0f172a] rounded-[32px] border border-gray-800 hover:border-[#10b981] transition-all">
        {/* Verificamos se a pool está aberta no banco e se não expirou no tempo */}
        {pool.status !== 'closed' && pool.status !== 'finished' ? (
          <button 
            disabled={estaBloqueado}
            onClick={() => { 
              setSelectedOption(option); 
              setSelectedPool(pool); 
              setIsModalOpen(true); 
            }} 
            className={`w-full p-4 rounded-xl transition-all font-black text-xs mb-4 uppercase ${
              estaBloqueado
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-[#1e293b] hover:bg-[#10b981] hover:text-[#0f172a]'
            }`}
          >
            {tempoExpirou ? '⏳ Tempo Esgotado' : option.label}
          </button>
        ) : (
          /* Quando a pool fecha ou termina, mostra o ganhador */
          <div className={`w-full p-4 rounded-xl font-black text-xs mb-4 uppercase text-center ${
            pool.winner_id === option.id ? 'bg-[#10b981] text-[#0f172a]' : 'bg-gray-800 text-gray-500'
          }`}>
            {option.label} {pool.winner_id === option.id && '🏆'}
          </div>
        )}

        <div className="flex justify-between items-center text-[11px] font-bold uppercase">
          <motion.span 
  key={totalOpcao} // Isso dispara a animação sempre que o valor muda
  initial={{ scale: 1 }}
  animate={{ 
    scale: [1, 1.2, 1], 
    color: ["#6b7280", "#10b981", "#6b7280"] // Pisca em verde e volta ao cinza
  }}
  transition={{ duration: 0.4 }}
  className="text-gray-500"
>
  Pote: R$ {totalOpcao.toFixed(2)}
</motion.span>
          <span className="text-[#10b981]">x{multiplicador.toFixed(2)}</span>
        </div>
      </div>
    );
  })}
</div>
                  
                  {user.id === pool.user_id && pool.status !== 'closed' && (
  <div className="mt-8 pt-8 border-t border-gray-800 flex gap-4">
    {opcoes.map((opt: any) => (
      <button 
        key={opt.id} 
        onClick={() => setConfirmacaoEncerramento({
          aberto: true,
          poolId: pool.id,
          optionId: opt.id,
          textoOpcao: opt.label,
          ownerId: pool.user_id // Adicionamos isso para o modal funcionar 100%
        })} 
        className="flex-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all"
      >
        Confirmar {opt.label}
      </button>
    ))}
  </div>
)}
                </div>
              )
            })}
          </div>
        </div>

        {/* BARRA LATERAL (FIXADA) */}
        <div className="w-full lg:w-[320px] space-y-8">
          <div className="bg-[#1e293b] p-8 rounded-[35px] border border-gray-800 shadow-2xl sticky top-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#10b981] rounded-2xl flex items-center justify-center font-black text-[#0f172a]">
                {(perfil?.nickname || 'U').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col flex-1">
                {isEditingNickname ? (
                  <input autoFocus className="bg-[#0f172a] border border-[#10b981] text-white text-xs p-2 rounded-lg outline-none w-full" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} onBlur={atualizarNickname} onKeyDown={(e) => e.key === 'Enter' && atualizarNickname()} />
                ) : (
                  <h2 onClick={() => { setIsEditingNickname(true); setTempNickname(perfil?.nickname || ''); }} className="text-sm font-black text-white uppercase truncate cursor-pointer hover:text-[#10b981]">
                    @{perfil?.nickname || 'definir_nome'} ✎
                  </h2>
                )}
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map(i => <span key={i} className={`text-[12px] ${i <= (perfil?.reputation || 60) / 20 ? 'text-amber-400' : 'text-gray-700'}`}>★</span>)}
                </div>
              </div>
            </div>
            <div>
              {/* INSERIR AQUI - PAINEL DE CREDIBILIDADE */}
  <div className="grid grid-cols-2 gap-2 bg-black/20 p-2 rounded-xl border border-gray-800/50 mb-6">
    <div className="text-center border-r border-gray-800">
      <div className="text-[#10b981] text-[10px] font-black">
        👍 {perfil?.total_top || 0}
      </div>
      <div className="text-[6px] text-gray-500 uppercase font-bold tracking-tighter">TOP</div>
    </div>
    <div className="text-center">
      <div className="text-red-500 text-[10px] font-black">
        👎 {perfil?.total_bad || 0}
      </div>
      <div className="text-[6px] text-gray-500 uppercase font-bold tracking-tighter">BAD</div>
    </div>
  </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Saldo Atual</p>
                 
                <p className="text-3xl font-black text-white tracking-tighter">R$ {(perfil?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                            {valorPendente > 0 && (
  <div className={`mt-3 p-3 rounded-2xl border ${temContestacao ? 'border-red-500/50 bg-red-500/10' : 'border-[#10b981]/30 bg-[#10b981]/10'}`}>
    <div className="flex justify-between items-start">
      <p className={`text-[9px] font-black uppercase ${temContestacao ? 'text-red-400' : 'text-[#10b981]'}`}>
        {temContestacao ? '⚠️ Em Análise' : '⏳ Recebendo'}
      </p>
      
      {/* Contador Simples */}
      {!temContestacao && (
        <span className="text-[9px] text-gray-400 font-bold">
          ~10 min
        </span>
      )}
    </div>
    
    <p className="text-lg font-black text-white leading-none mt-1">
      + R$ {valorPendente.toFixed(2)}
    </p>
    
    {!temContestacao && (
      <p className="text-[10px] text-gray-400 mt-2 leading-tight">
        Seu prêmio está sendo processado e cairá em breve.
      </p>
    )}
  </div>
)}
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => setIsModalTransacaoOpen('deposito')} className="w-full bg-[#10b981] text-[#0f172a] text-[10px] font-black py-3 rounded-xl uppercase">Depositar</button>
                <button onClick={() => setIsModalTransacaoOpen('saque')} className="w-full bg-gray-800 text-white text-[10px] font-black py-3 rounded-xl uppercase">Sacar</button>
              </div>

              <div className="pt-6 border-t border-gray-800 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-gray-500">Acertos</span><span className="text-[#10b981]">{perfil?.acertos || 0}</span></div>
                <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-gray-500">Erros</span><span className="text-red-500">{perfil?.erros || 0}</span></div>
              </div>

              <div className="pt-6 border-t border-gray-800">
                <p className="text-[10px] text-gray-500 font-black uppercase mb-4">Histórico</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                  {historico.length === 0 && <p className="text-[9px] text-gray-700 uppercase font-black">Nenhuma transação</p>}
                  {historico.map((item) => (
                    <div key={item.id} className="p-3 bg-[#0f172a] rounded-xl flex justify-between items-center border border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white uppercase">{item.type === 'bet_win' ? 'Vitória' : item.type === 'bet' ? 'Aposta' : 'Recarga'}</span>
                        <span className="text-[7px] text-gray-600">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[10px] font-black ${item.amount > 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                        {item.amount > 0 ? '+' : ''}{Number(item.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAIS */}
{/* MODAL DE PERFIL DO CRIADOR - Versão Independente */}
{perfilAberto && (
  <ModalPerfil 
    perfil={perfilAberto}      // O dono do perfil que estamos vendo
    pools={poolsDoCriador} 
    usuarioLogado={perfil}     // <--- VOCÊ (Dados do seu login que estão no App.tsx)
    onClose={() => {
      setPerfilAberto(null);
      buscarPools();           // Atualiza os dados na tela principal após votar
    }} 
  />
)}

{confirmacaoEncerramento.aberto && (
  <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl flex items-center justify-center p-6 z-[100]">
    <div className="bg-[#1e293b] p-10 rounded-[40px] max-w-sm w-full border border-gray-800 shadow-2xl text-center">
      
      <h2 className="text-3xl font-black mb-6 italic text-[#10b981]">FINALIZAR?</h2>
      
      <p className="text-gray-400 mb-8 font-bold uppercase text-[10px] tracking-[3px] leading-relaxed">
        Você confirma que o resultado <br/> oficial deste evento foi: <br/>
        <span className="text-white text-lg block mt-2 italic">
          "{confirmacaoEncerramento.textoOpcao}"
        </span>
      </p>
      

<div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-[32px]">
  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3 block">
    Mensagem para os Apostadores (Opcional)
  </label>
  
  <textarea 
    placeholder="Explique o resultado... Ex: O time X venceu por 2x1."
    value={justificativa}
    onChange={(e) => setJustificativa(e.target.value)}
    maxLength={150}
    className="w-full bg-[#0b121f] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-gray-700 focus:border-blue-500/50 outline-none resize-none h-24 transition-all"
  />
  
  <p className="text-[9px] text-gray-600 mt-2 italic font-medium">
    
  </p>
</div>
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => {
            // DISPARA A FUNÇÃO REAL
            encerrarPool(
              confirmacaoEncerramento.poolId, 
              confirmacaoEncerramento.optionId, 
              confirmacaoEncerramento.ownerId,
              justificativa,
            );
            // FECHA O MODAL
            setConfirmacaoEncerramento({ ...confirmacaoEncerramento, aberto: false });
            setJustificativa('');
          }} 
          className="w-full bg-[#10b981] p-5 rounded-2xl font-black text-[#0f172a] text-lg hover:scale-105 transition-all shadow-lg"
        >
          SIM, CONFIRMAR
        </button>

        <button 
          onClick={() => setConfirmacaoEncerramento({ ...confirmacaoEncerramento, aberto: false })} 
          className="w-full text-gray-500 font-bold text-[10px] uppercase hover:text-white mt-2 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
{sucessoPublicacao.aberto && (
  <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl flex items-center justify-center p-6 z-[150]">
    <div className="bg-[#1e293b] p-10 rounded-[40px] max-w-sm w-full border border-gray-800 shadow-2xl text-center">
      
      {/* Ícone Dinâmico: Verde para sucesso, Vermelho para erro */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${
        sucessoPublicacao.tipo === 'sucesso' 
        ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' 
        : 'bg-red-500/10 border-red-500/20 text-red-500'
      }`}>
        <span className="text-4xl">{sucessoPublicacao.tipo === 'sucesso' ? '✓' : '✕'}</span>
      </div>

      <h2 className={`text-3xl font-black mb-4 italic uppercase ${
        sucessoPublicacao.tipo === 'sucesso' ? 'text-[#10b981]' : 'text-red-500'
      }`}>
        {sucessoPublicacao.tipo === 'sucesso' ? 'PUBLICADO!' : 'ERRO!'}
      </h2>
      
      <p className="text-gray-400 mb-10 font-bold uppercase text-[10px] tracking-[3px] leading-relaxed">
        {sucessoPublicacao.mensagem}
      </p>

      <button 
        onClick={() => setSucessoPublicacao({ ...sucessoPublicacao, aberto: false })} 
        className={`w-full p-5 rounded-2xl font-black text-[#0f172a] text-lg hover:scale-105 transition-all ${
          sucessoPublicacao.tipo === 'sucesso' ? 'bg-[#10b981]' : 'bg-red-500'
        }`}
      >
        ENTENDIDO
      </button>
    </div>
  </div>
)}

{/* MODAL GLOBAL DO TICKET DE RESULTADO */}
{isApostaConcluida && dadosTicket && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f172a]/95 backdrop-blur-xl p-4">
    
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
      
      <button 
        onClick={() => setIsApostaConcluida(false)}
        className="mb-6 text-gray-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
      >
        [ FECHAR RESULTADO X ]
      </button>
{sucessoPublicacao.aberto && (
  <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl flex items-center justify-center p-6 z-[150]">
    <div className="bg-[#1e293b] p-10 rounded-[40px] max-w-sm w-full border border-gray-800 shadow-2xl text-center">
      
      {/* Ícone Dinâmico: Verde para sucesso, Vermelho para erro */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${
        sucessoPublicacao.tipo === 'sucesso' 
        ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' 
        : 'bg-red-500/10 border-red-500/20 text-red-500'
      }`}>
        <span className="text-4xl">{sucessoPublicacao.tipo === 'sucesso' ? '✓' : '✕'}</span>
      </div>

      <h2 className={`text-3xl font-black mb-4 italic uppercase ${
        sucessoPublicacao.tipo === 'sucesso' ? 'text-[#10b981]' : 'text-red-500'
      }`}>
        {sucessoPublicacao.tipo === 'sucesso' ? 'PUBLICADO!' : 'ERRO!'}
      </h2>
      
      <p className="text-gray-400 mb-10 font-bold uppercase text-[10px] tracking-[3px] leading-relaxed">
        {sucessoPublicacao.mensagem}
      </p>
{/* ADICIONE ISSO ACIMA DO BOTÃO ENTENDIDO NO MODAL DO CRIADOR */}
<div className="mb-6 text-left">
  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2 block text-center">
    Justificativa do Resultado
  </label>
  <textarea 
    placeholder="Explique o motivo do resultado (ex: Placar final 2x1)..."
    className="w-full bg-[#0b121f] border border-gray-700 rounded-2xl p-4 text-xs text-white focus:border-[#10b981] outline-none resize-none h-24 transition-all"
    value={justificativa} // Você precisa criar esse estado: const [justificativa, setJustificativa] = useState('');
    onChange={(e) => setJustificativa(e.target.value)}
  />
</div>
      <button 
        onClick={() => setSucessoPublicacao({ ...sucessoPublicacao, aberto: false })} 
        className={`w-full p-5 rounded-2xl font-black text-[#0f172a] text-lg hover:scale-105 transition-all ${
          sucessoPublicacao.tipo === 'sucesso' ? 'bg-[#10b981]' : 'bg-red-500'
        }`}
      >
        ENTENDIDO
      </button>
    </div>
  </div>
)}

{/* MODAL GLOBAL DO TICKET DE RESULTADO */}
{isApostaConcluida && dadosTicket && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f172a]/95 backdrop-blur-xl p-4">
    
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
      
      <button 
        onClick={() => setIsApostaConcluida(false)}
        className="mb-6 text-gray-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
      >
        [ FECHAR RESULTADO X ]
      </button>

      <BetTicket 
        poolTitle={dadosTicket.poolTitle}
        optionLabel={dadosTicket.optionLabel}
        amount={dadosTicket.amount}
        multiplier={dadosTicket.multiplier}
        status={dadosTicket.status}
        stats={dadosTicket.stats}
        justificativa={dadosTicket.justificativa}
      />
      
    </div>
  </div>
)}

      <BetTicket 
        poolTitle={dadosTicket.poolTitle}
        optionLabel={dadosTicket.optionLabel}
        amount={dadosTicket.amount}
        multiplier={dadosTicket.multiplier}
        status={dadosTicket.status}
        stats={dadosTicket.stats}
        justificativa={dadosTicket.justificativa}
      />
    </div>
  </div>
)}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <div className="bg-[#1e293b] p-10 rounded-[40px] max-w-sm w-full border border-gray-800 shadow-2xl">
            <h2 className="text-3xl font-black mb-6 text-center italic text-[#10b981]">CONFIRMAR</h2>
            <input autoFocus type="number" className="w-full bg-[#0f172a] p-6 rounded-2xl text-3xl font-black outline-none border-2 border-transparent focus:border-[#10b981] mb-6" placeholder="0,00" value={valorAposta} onChange={(e) => setValorAposta(e.target.value)} />
            <div className="bg-[#0f172a] p-4 rounded-2xl mb-8 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-500 uppercase">Ganhos:</span>
              <span className="text-[#10b981] font-black text-xl">R$ {obterGanhoEstimado().toFixed(2)}</span>
            </div>
            <button onClick={confirmarAposta} className="w-full bg-[#10b981] p-5 rounded-2xl font-black text-[#0f172a] text-lg mb-4">APOSTAR AGORA</button>
            <button onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 font-bold text-[10px] uppercase">Cancelar</button>
          </div>
        </div>
      )}

      {isModalTransacaoOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <div className="bg-[#1e293b] p-10 rounded-[40px] max-w-sm w-full border border-gray-800">
            <h2 className="text-3xl font-black mb-8 text-center uppercase text-[#10b981]">{isModalTransacaoOpen === 'deposito' ? 'Adicionar' : 'Retirar'}</h2>
            <input autoFocus type="number" className="w-full bg-[#0f172a] p-6 rounded-2xl text-3xl font-black outline-none border-2 border-transparent focus:border-[#10b981] mb-8" placeholder="0,00" value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)} />
            <button onClick={gerenciarSaldo} className="w-full bg-[#10b981] p-5 rounded-2xl font-black text-[#0f172a] text-lg mb-4">CONFIRMAR</button>
            <button onClick={() => setIsModalTransacaoOpen(null)} className="w-full text-gray-500 font-bold text-[10px] uppercase">Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

