import sqlite3
import os

# Configuração de caminhos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "documind_v2.db")

def iniciar_db():
    """Cria a pasta storage e as tabelas se não existirem."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. TABELA DE USUÁRIOS (Para Login e Níveis de Acesso)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            tipo TEXT NOT NULL  -- 'Administrador', 'Premium' ou 'Teste Grátis'
        )
    ''')
    
    # 2. TABELA DE DOCUMENTOS (Para o Histórico de PDFs)
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
    
    conn.commit()
    conn.close()

def salvar_extracao(nome, cnpj, data, valor, telefone, email):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO documentos (nome_arquivo, cnpj, data, valor, telefone, email)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (nome, cnpj, data, valor, telefone, email))
    conn.commit()
    conn.close()

def listar_todos():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT nome_arquivo, cnpj, data, valor, telefone, email, data_processamento 
        FROM documentos 
        ORDER BY id DESC
    ''')
    dados = cursor.fetchall()
    conn.close()
    return dados