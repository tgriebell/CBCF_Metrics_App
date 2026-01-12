import sqlite3

# Conectar ao banco
conn = sqlite3.connect('cbcf_metrics.db')
cursor = conn.cursor()

# Remover histórico do TikTok do dia 22/12/2025
cursor.execute("DELETE FROM follower_history WHERE platform = 'tiktok' AND date LIKE '2025-12-22%'")
deleted_count = cursor.rowcount

conn.commit()
conn.close()

print(f"Limpeza concluída! {deleted_count} registro(s) do dia 22/12 removido(s).")