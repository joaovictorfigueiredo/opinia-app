import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
import os

# Configurações
CICLOS_OTIMIZACAO = [4, 10, 15, 20, 30]
DB_FILE = "clientes_gestao.csv"
FIN_FILE = "historico_financeiro.csv"

# --- FUNÇÕES DE DADOS ---
def carregar_dados():
    if os.path.exists(DB_FILE):
        try:
            df = pd.read_csv(DB_FILE, dtype={'notas_extra': str, 'id': str})
            df['data_criacao'] = pd.to_datetime(df['data_criacao'], errors='coerce')
            df['deadline_tarefa'] = pd.to_datetime(df['deadline_tarefa'], errors='coerce')
            df['proxima_cobranca'] = pd.to_datetime(df.get('proxima_cobranca', df['data_criacao'] + timedelta(days=30)), errors='coerce')
            df['notas_extra'] = df['notas_extra'].fillna("")
            return df
        except: 
            return criar_df_vazio()
    return criar_df_vazio()

def carregar_financeiro():
    colunas = ['id_cliente', 'nome_cliente', 'valor', 'data_pagamento']
    if os.path.exists(FIN_FILE):
        try:
            df = pd.read_csv(FIN_FILE)
            if df.empty:
                return pd.DataFrame(columns=colunas)
            # CORREÇÃO CRÍTICA: Força a conversão e remove o que não for data
            df['data_pagamento'] = pd.to_datetime(df['data_pagamento'], errors='coerce')
            df = df.dropna(subset=['data_pagamento'])
            return df
        except: 
            return pd.DataFrame(columns=colunas)
    return pd.DataFrame(columns=colunas)

def criar_df_vazio():
    df = pd.DataFrame(columns=['id', 'nome', 'status', 'data_criacao', 'deadline_tarefa', 'ciclo_atual', 'notas_extra', 'proxima_cobranca'])
    return df.astype({'notas_extra': str, 'id': str})

def salvar_dados(df, arquivo):
    df.to_csv(arquivo, index=False)

# --- INICIALIZAÇÃO ---
st.set_page_config(page_title="Gestor de Tráfego VIP", layout="wide")

if 'df' not in st.session_state:
    st.session_state.df = carregar_dados()
if 'fin' not in st.session_state:
    st.session_state.fin = carregar_financeiro()

# --- SIDEBAR ---
with st.sidebar:
    st.title("⚙️ Menu Principal")
    aba = st.radio("Navegar para:", ["🚀 Painel de Ações", "💰 Financeiro"])
    st.divider()
    
    if aba == "🚀 Painel de Ações":
        busca = st.text_input("🔍 Buscar Cliente", placeholder="Nome ou ID").lower()
        visualizar_tudo = st.toggle("👁️ Visualizar todos")
        
        st.subheader("➕ Novo Cliente")
        with st.form("cadastro_cliente", clear_on_submit=True):
            novo_nome = st.text_input("Nome do Cliente")
            if st.form_submit_button("Cadastrar"):
                if novo_nome:
                    novo_id = str(len(st.session_state.df) + 1).zfill(3)
                    hoje = datetime.now()
                    novo_cliente = {
                        'id': novo_id, 'nome': novo_nome, 'status': 'Criação de Campanha',
                        'data_criacao': hoje, 'deadline_tarefa': hoje + timedelta(hours=48),
                        'ciclo_atual': -1, 'notas_extra': "", 'proxima_cobranca': hoje + timedelta(days=30)
                    }
                    st.session_state.df = pd.concat([st.session_state.df, pd.DataFrame([novo_cliente])], ignore_index=True)
                    salvar_dados(st.session_state.df, DB_FILE)
                    st.rerun()

agora = datetime.now()

# --- ABA 1: PAINEL DE AÇÕES ---
if aba == "🚀 Painel de Ações":
    st.title("🚀 Painel de Gestão")
    
    def deve_mostrar_card(row, termo_busca, mostrar_tudo):
        nome = str(row['nome']).lower()
        id_cli = str(row['id'])
        if mostrar_tudo: 
            return (termo_busca in nome or termo_busca in id_cli) if termo_busca else True
        if termo_busca: 
            return termo_busca in nome or termo_busca in id_cli
        if str(row['notas_extra']) != "": 
            return True
        if row['status'] in ['Criação de Campanha', 'Informar Cliente']: 
            return True
        if 'Aguardando' in str(row['status']) or 'Otimização' in str(row['status']):
            return agora >= pd.to_datetime(row['deadline_tarefa'])
        return False

    for index, row in st.session_state.df.iterrows():
        if deve_mostrar_card(row, busca, visualizar_tudo):
            atrasado = agora > pd.to_datetime(row['deadline_tarefa'])
            vencido = agora > pd.to_datetime(row['proxima_cobranca'])
            
            with st.container():
                c1, c2, c3, c4 = st.columns([1, 3, 3, 2])
                with c1: st.write(f"**ID: {row['id']}**")
                with c2:
                    st.write(f"### {row['nome']}")
                    if vencido: 
                        st.error(f"💳 COBRANÇA VENCIDA ({pd.to_datetime(row['proxima_cobranca']).strftime('%d/%m')})")
                    elif atrasado: 
                        st.warning(f"⌛ Prazo: {pd.to_datetime(row['deadline_tarefa']).strftime('%d/%m %H:%M')}")
                    else: 
                        st.success(f"📅 Prazo: {pd.to_datetime(row['deadline_tarefa']).strftime('%d/%m %H:%M')}")
                
                with c3:
                    em_espera = 'Aguardando' in str(row['status']) and agora < pd.to_datetime(row['deadline_tarefa'])
                    if em_espera: 
                        st.warning("🌙 Em Standby (Ciclo)")
                    else: 
                        st.info(f"📍 {row['status']}")
                    
                    if str(row['notas_extra']) != "":
                        st.markdown(f"🔔 **Demanda:** {row['notas_extra']}")
                
                with c4:
                    status_atual = str(row['status'])
                    if status_atual == 'Criação de Campanha':
                        txt_btn = "Finalizar Campanha"
                    elif status_atual == 'Informar Cliente':
                        txt_btn = "Confirmar Aviso"
                    else:
                        c_idx = int(row['ciclo_atual']) if pd.notna(row['ciclo_atual']) and row['ciclo_atual'] != -1 else 0
                        txt_btn = f"Concluir Otimização {CICLOS_OTIMIZACAO[c_idx]}d"

                    if st.button(txt_btn, key=f"btn_{row['id']}"):
                        if status_atual == 'Criação de Campanha':
                            st.session_state.df.at[index, 'status'] = 'Informar Cliente'
                            st.session_state.df.at[index, 'deadline_tarefa'] = agora + timedelta(hours=24)
                        
                        elif status_atual == 'Informar Cliente':
                            st.session_state.df.at[index, 'status'] = 'Aguardando Ciclo'
                            st.session_state.df.at[index, 'ciclo_atual'] = 0
                            st.session_state.df.at[index, 'deadline_tarefa'] = row['data_criacao'] + timedelta(days=CICLOS_OTIMIZACAO[0])
                        
                        elif 'Aguardando' in status_atual or 'Ciclo' in status_atual:
                            novo_idx = int(row['ciclo_atual']) + 1
                            if novo_idx < len(CICLOS_OTIMIZACAO):
                                st.session_state.df.at[index, 'ciclo_atual'] = novo_idx
                                st.session_state.df.at[index, 'status'] = 'Aguardando Ciclo'
                                st.session_state.df.at[index, 'deadline_tarefa'] = row['data_criacao'] + timedelta(days=CICLOS_OTIMIZACAO[novo_idx])
                            else:
                                st.session_state.df.at[index, 'status'] = 'Ciclo Completo'
                        
                        salvar_dados(st.session_state.df, DB_FILE)
                        st.rerun()
                    
                    if str(row['notas_extra']) != "":
                        if st.button("✅ Concluir Nota", key=f"clr_{row['id']}"):
                            st.session_state.df.at[index, 'notas_extra'] = ""
                            salvar_dados(st.session_state.df, DB_FILE)
                            st.rerun()

                with st.expander("📝 Notas e Configurações"):
                    n_nota = st.text_input("Nova demanda", key=f"in_{row['id']}")
                    if st.button("Ativar (48h)", key=f"btn_n_{row['id']}"):
                        if n_nota:
                            st.session_state.df['notas_extra'] = st.session_state.df['notas_extra'].astype(str)
                            st.session_state.df.at[index, 'notas_extra'] = str(n_nota)
                            st.session_state.df.at[index, 'deadline_tarefa'] = agora + timedelta(hours=48)
                            salvar_dados(st.session_state.df, DB_FILE)
                            st.rerun()
            st.divider()

# --- ABA 2: FINANCEIRO ---
elif aba == "💰 Financeiro":
    st.title("💰 Gestão Financeira")
    col_f1, col_f2 = st.columns([1, 2])
    
    with col_f1:
        st.subheader("💵 Registrar Pagamento")
        if not st.session_state.df.empty:
            with st.form("form_financeiro"):
                cliente_pagto = st.selectbox("Cliente", st.session_state.df['nome'].tolist())
                valor = st.number_input("Valor Recebido (R$)", min_value=0.0, step=100.0)
                data_p = st.date_input("Data do Pagamento", datetime.now())
                if st.form_submit_button("Confirmar Recebimento"):
                    cli_idx = st.session_state.df[st.session_state.df['nome'] == cliente_pagto].index[0]
                    st.session_state.df.at[cli_idx, 'proxima_cobranca'] = pd.to_datetime(data_p) + timedelta(days=30)
                    salvar_dados(st.session_state.df, DB_FILE)
                    
                    novo_h = {
                        'id_cliente': st.session_state.df.at[cli_idx, 'id'], 
                        'nome_cliente': cliente_pagto, 
                        'valor': valor, 
                        'data_pagamento': pd.to_datetime(data_p)
                    }
                    st.session_state.fin = pd.concat([st.session_state.fin, pd.DataFrame([novo_h])], ignore_index=True)
                    salvar_dados(st.session_state.fin, FIN_FILE)
                    st.success("Pagamento registrado!")
                    st.rerun()
        else:
            st.info("Cadastre clientes primeiro.")

    with col_f2:
        st.subheader("📊 Faturamento")
        d_ini = st.date_input("Início", datetime.now() - timedelta(days=30))
        d_f = st.date_input("Fim", datetime.now())
        
        if not st.session_state.fin.empty:
            # Filtro seguro: converte explicitamente para datetime antes de usar .dt
            df_fin_filtrar = st.session_state.fin.copy()
            df_fin_filtrar['data_pagamento'] = pd.to_datetime(df_fin_filtrar['data_pagamento'])
            
            mask = (df_fin_filtrar['data_pagamento'].dt.date >= d_ini) & \
                   (df_fin_filtrar['data_pagamento'].dt.date <= d_f)
            df_filtrado = df_fin_filtrar.loc[mask]
            
            st.metric("Total no Período", f"R$ {df_filtrado['valor'].sum():,.2f}")
            st.dataframe(df_filtrado[['data_pagamento', 'nome_cliente', 'valor']], use_container_width=True)
        else:
            st.write("Sem registros no período.")

    st.divider()
    st.subheader("📅 Próximas Cobranças e Histórico")
    
    if not st.session_state.df.empty:
        hoje = datetime.now()
        
        # 1. Preparação segura do Financeiro
        df_fin_total = st.session_state.fin.copy()
        df_fin_total['data_pagamento'] = pd.to_datetime(df_fin_total['data_pagamento'], errors='coerce')
        df_fin_total = df_fin_total.dropna(subset=['data_pagamento'])
        
        # 2. Total Histórico
        if not df_fin_total.empty:
            total_hist = df_fin_total.groupby('nome_cliente')['valor'].sum().reset_index()
            total_hist.columns = ['nome', 'Total Pago']
            
            # 3. Valor Pago no Mês Atual
            fin_mes = df_fin_total[
                (df_fin_total['data_pagamento'].dt.month == hoje.month) & 
                (df_fin_total['data_pagamento'].dt.year == hoje.year)
            ]
            total_mes = fin_mes.groupby('nome_cliente')['valor'].sum().reset_index()
            total_mes.columns = ['nome', 'Pago no Mês']
        else:
            total_hist = pd.DataFrame(columns=['nome', 'Total Pago'])
            total_mes = pd.DataFrame(columns=['nome', 'Pago no Mês'])
        
        # 4. Mesclar com a lista principal
        df_fin_view = st.session_state.df[['nome', 'proxima_cobranca']].copy()
        df_fin_view = df_fin_view.merge(total_hist, on='nome', how='left').fillna(0)
        df_fin_view = df_fin_view.merge(total_mes, on='nome', how='left').fillna(0)
        df_fin_view = df_fin_view.sort_values('proxima_cobranca')

        def highlight_due(row):
            try:
                if pd.to_datetime(row['proxima_cobranca']) < hoje:
                    return ['background-color: #990000; color: white'] * len(row)
            except: pass
            return [''] * len(row)

        st.dataframe(
            df_fin_view.style.apply(highlight_due, axis=1)
            .format({'Total Pago': 'R$ {:.2f}', 'Pago no Mês': 'R$ {:.2f}'}),
            use_container_width=True,
            hide_index=True
        )