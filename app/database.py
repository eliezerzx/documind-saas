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
            usuario_id INTEGER, 
            usuario_email TEXT, -- COLUNA PARA O VÍNCULO
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
    
    # Migração: Caso o banco já exista, adiciona a coluna sem erro
    try:
        cursor.execute('ALTER TABLE documentos ADD COLUMN usuario_email TEXT')
    except:
        pass
        
    conn.commit()
    conn.close()

def salvar_extracao(nome, cnpj, data, valor, telefone, email, usuario_email):
    """Salva os dados extraídos vinculando ao e-mail do usuário."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO documentos (nome_arquivo, cnpj, data, valor, telefone, email, usuario_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (nome, cnpj, data, valor, telefone, email, usuario_email))
    conn.commit()
    conn.close()

def listar_por_usuario(email):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Importante: O SELECT deve bater com a ordem que o main.py espera
    cursor.execute('''
        SELECT nome_arquivo, cnpj, data, valor, telefone, email 
        FROM documentos 
        WHERE usuario_email = ? 
        ORDER BY data_processamento DESC
    ''', (email,))
    rows = cursor.fetchall()
    conn.close()
    return rows

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