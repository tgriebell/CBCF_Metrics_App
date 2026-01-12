from backend.database import SessionLocal
from backend.models import FollowerHistory
from sqlalchemy import desc

def fix_youtube_history():
    db = SessionLocal()
    user_id = 1
    
    # 1. Pegar o registro mais recente do YouTube que tenha contagem válida
    latest_record = db.query(FollowerHistory).filter(
        FollowerHistory.user_id == user_id,
        FollowerHistory.platform == 'youtube',
        FollowerHistory.count > 0
    ).order_by(desc(FollowerHistory.date)).first()
    
    if not latest_record:
        print("Erro: Nenhum registro atual com contagem de inscritos encontrado para basear o cálculo.")
        return

    current_count = latest_record.count
    print(f"Base de cálculo: {current_count} inscritos em {latest_record.date}")

    # 2. Pegar todo o histórico anterior a essa data, ordenado do mais recente para o mais antigo
    history = db.query(FollowerHistory).filter(
        FollowerHistory.user_id == user_id,
        FollowerHistory.platform == 'youtube',
        FollowerHistory.date < latest_record.date
    ).order_by(desc(FollowerHistory.date)).all()
    
    updated_count = 0
    
    # 3. Caminhar para trás subtraindo o ganho líquido (net growth)
    # Precisamos saber o ganho do dia 'seguinte' para subtrair do total do dia 'seguinte' e achar o do dia 'atual'
    # Mas espere, o registro do dia X tem o ganho do dia X.
    # Total(X) = Total(X-1) + Ganho(X)
    # Logo: Total(X-1) = Total(X) - Ganho(X)
    
    # O 'latest_record' é o dia X. O primeiro da lista 'history' é X-1.
    # Precisamos subtrair o ganho do dia X para achar o total do dia X-1?
    # NÃO. O ganho do dia X contribuiu para chegar no Total X.
    # Se eu tenho 100 hoje e ganhei 10 hoje, ontem eu tinha 90.
    # Então: Total(Ontem) = Total(Hoje) - Ganho(Hoje)
    
    # Precisamos do ganho do 'latest_record' para achar o anterior?
    # Sim. Mas o 'latest_record' pode não ter os campos de ganho preenchidos se veio da API Data v3 (apenas snapshot).
    # Vamos verificar se temos o ganho do dia atual. Se não, assumimos 0 ou tentamos buscar.
    
    # Melhor abordagem:
    # Vamos iterar. 'running_total' começa com 'current_count'.
    # Para achar o total do dia anterior, subtraímos o ganho do dia ATUAL.
    # Mas a lista 'history' começa do dia anterior.
    
    # Problema: O ganho do dia 'latest_record' está onde? No 'latest_record' ou não temos?
    # Se latest_record veio do sync normal, ele pode ter count mas não ter 'views/likes' de delta (net_growth implícito).
    # Vamos assumir que o ganho do dia mais recente já está contabilizado no total dele.
    # Para achar o total do dia anterior (history[0]), precisamos subtrair o ganho que ocorreu no dia 'latest_record'.
    # Se não soubermos o ganho de 'latest_record', teremos um erro de precisão de 1 dia.
    
    # Vamos tentar usar os dados que temos. Se o histórico tem views/likes preenchidos pelo backfill,
    # ele deve ter uma lógica de growth? O backfill preenche views, likes, mas onde está o ganho de subs?
    # O backfill que fiz no youtube_service.py NÃO salvou subscribersGained no banco explicitamente, 
    # pois o model FollowerHistory não tem campo 'gained', apenas 'count'.
    # Ah, o backfill usou:
    # subs_net = row[idx_subs_gain] - row[idx_subs_lost]
    # Mas não salvou 'subs_net' em lugar nenhum! Só salvou views, likes, comments.
    
    # ERRO DETECTADO NA ANÁLISE ANTERIOR: O histórico antigo NÃO TEM a informação de ganho de inscritos salva no banco.
    # Sem saber quanto ganhou em cada dia passado, não consigo reconstruir o total.
    
    # Solução: Preciso consultar a API do YouTube Analytics novamente para pegar os ganhos diários (subscribersGained - subscribersLost)
    # e aí sim aplicar a lógica retroativa.
    
    # Como não tenho acesso fácil à API neste script solto sem refazer a autenticação completa...
    # Posso usar o youtube_service.py? Sim, ele já tem a lógica de auth.
    
    print("Aviso: O histórico salvo no banco não tem dados de ganho de inscritos (apenas views/likes).")
    print("Para corrigir, precisamos rodar o backfill novamente, mas salvando o 'count' calculado.")
    
    # Vou abortar este script simples e criar um que use o YoutubeService.

if __name__ == "__main__":
    fix_youtube_history()
