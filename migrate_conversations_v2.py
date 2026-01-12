import sqlite3

def migrate():
    conn = sqlite3.connect('cbcf_metrics.db')
    cursor = conn.cursor()
    
    try:
        # Adicionar coluna 'messages' (JSON) na tabela conversations
        print("Adicionando coluna 'messages' na tabela conversations...")
        cursor.execute("ALTER TABLE conversations ADD COLUMN messages JSON DEFAULT '[]'")
        print("Coluna 'messages' adicionada com sucesso.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Coluna 'messages' já existe.")
        else:
            print(f"Erro ao adicionar coluna: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()