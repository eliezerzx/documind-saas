import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "documind.db")

def iniciar_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Adicionamos telefone e email na criação
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
    
    # Truque para adicionar as colunas caso o banco já exista sem elas
    try:
        cursor.execute('ALTER TABLE documentos ADD COLUMN telefone TEXT')
        cursor.execute('ALTER TABLE documentos ADD COLUMN email TEXT')
    except:
        pass # Se as colunas já existirem, ele não faz nada
        
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
    cursor.execute('SELECT nome_arquivo, cnpj, data, valor, telefone, email, data_processamento FROM documentos ORDER BY id DESC')
    dados = cursor.fetchall()
    conn.close()
    return dados