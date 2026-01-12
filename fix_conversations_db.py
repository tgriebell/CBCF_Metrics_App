import sqlite3

# Conecta ao banco
db_path = "cbcf_metrics.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Iniciando Correção do Banco de Dados (Modo Seguro) ---")

try:
    # 1. Verifica se a tabela já foi migrada (se prompt é TEXT)
    cursor.execute("PRAGMA table_info(conversations)")
    columns = cursor.fetchall()
    prompt_type = next((col[2] for col in columns if col[1] == 'prompt'), None)
    
    if prompt_type == 'TEXT':
        print("ℹ️  O banco de dados já está atualizado. Nenhuma ação necessária.")
    else:
        # 2. Renomeia a tabela atual
        print("1. Fazendo backup da tabela atual...")
        cursor.execute("ALTER TABLE conversations RENAME TO conversations_old")
        
        # 3. Cria a nova tabela com TEXT
        print("2. Criando nova estrutura otimizada...")
        cursor.execute("""
        CREATE TABLE conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title VARCHAR,
            type VARCHAR DEFAULT 'general',
            prompt TEXT,
            response TEXT,
            feedback INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)
        
        # 4. Migra os dados
        print("3. Migrando seu histórico...")
        cursor.execute("""
        INSERT INTO conversations (id, user_id, title, type, prompt, response, feedback, timestamp)
        SELECT id, user_id, title, type, prompt, response, feedback, timestamp FROM conversations_old
        """)
        
        # 5. Remove o backup
        print("4. Finalizando...")
        cursor.execute("DROP TABLE conversations_old")
        
        conn.commit()
        print("✅ SUCESSO: Histórico atualizado e salvo!")

except Exception as e:
    print(f"❌ ERRO: {e}")
    conn.rollback()

finally:
    conn.close()
