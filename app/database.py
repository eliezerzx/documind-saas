import sqlite3
import os

# Configuração de caminhos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "documind.db")

def iniciar_db():
    """Cria a pasta storage e a tabela inicial se não existirem."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Usamos o nome 'documentos' como padrão para evitar erros de acentuação
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_arquivo TEXT,
            cnpj TEXT,
            data TEXT,
            valor TEXT,
            telefone TEXT,
            email TEXT,
            data_processamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Garante que as colunas novas existam caso o banco seja antigo
    try:
        cursor.execute('ALTER TABLE documentos ADD COLUMN telefone TEXT')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE documentos ADD COLUMN email TEXT')
    except:
        pass
        
    conn.commit()
    conn.close()

def salvar_extracao(nome, cnpj, data, valor, telefone, email):
    """Salva os dados extraídos no banco de dados."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO documentos (nome_arquivo, cnpj, data, valor, telefone, email)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (nome, cnpj, data, valor, telefone, email))
    conn.commit()
    conn.close()

def listar_todos():
    """Retorna todos os registros para o histórico, do mais recente para o mais antigo."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Selecionamos exatamente as colunas que o frontend espera
    cursor.execute('''
        SELECT nome_arquivo, cnpj, data, valor, telefone, email, data_processamento 
        FROM documentos 
        ORDER BY id DESC
    ''')
    dados = cursor.fetchall()
    conn.close()
    return dados