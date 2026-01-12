import sqlite3

def migrate_db():
    conn = sqlite3.connect('cbcf_metrics.db')
    cursor = conn.cursor()
    
    try:
        print("Tentando adicionar coluna 'type'...")
        cursor.execute("ALTER TABLE conversations ADD COLUMN type VARCHAR DEFAULT 'general'")
        print("Coluna 'type' adicionada.")
    except Exception as e:
        print(f"Aviso (type): {e}")

    try:
        print("Tentando adicionar coluna 'title'...")
        cursor.execute("ALTER TABLE conversations ADD COLUMN title VARCHAR DEFAULT 'Nova Conversa'")
        print("Coluna 'title' adicionada.")
    except Exception as e:
        print(f"Aviso (title): {e}")

    conn.commit()
    conn.close()
    print("Migração concluída.")

if __name__ == "__main__":
    migrate_db()