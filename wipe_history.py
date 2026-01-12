import sqlite3

def wipe_conversations():
    conn = sqlite3.connect('cbcf_metrics.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conversations") # Limpa tudo
    conn.commit()
    conn.close()
    print("Histórico de conversas limpo com sucesso.")

if __name__ == "__main__":
    wipe_conversations()