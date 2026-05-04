import sqlite3
import os

# Configuração de caminhos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "documind.db")

def iniciar_db():
    """Cria a pasta storage e as tabelas de usuários e documentos."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. TABELA DE USUÁRIOS (Onde fica o login e info do Google)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT, -- Pode ser nulo se logar só com Google
            google_id TEXT,
            foto_perfil TEXT,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. TABELA DE DOCUMENTOS (Dados extraídos dos PDFs)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER, -- Para saber de quem é o documento
            nome_arquivo TEXT,
            cnpj TEXT,
            data TEXT,
            valor TEXT,
            telefone TEXT,
            email TEXT,
            data_processamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
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