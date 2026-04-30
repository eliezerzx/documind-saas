from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import sqlite3
import os
import io
import shutil
import pandas as pd
from uuid import uuid4
from app.processors.pdf_engine import extrair_dados_do_pdf
from app.database import iniciar_db, salvar_extracao, listar_todos # Importa o banco
from app.processors.pdf_engine import extrair_dados_do_pdf # Importando o seu motor de extração
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from passlib.context import CryptContext

# Mudamos de bcrypt para argon2
#pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Criamos funções simples que não usam bibliotecas externas
def hash_falso(senha):
    return senha  # Não faz nada, apenas retorna o texto

def verificar_falso(senha_digitada, senha_do_banco):
    return senha_digitada == senha_do_banco

# Configurações de Segurança
SECRET_KEY = "sua_chave_secreta_super_segura" # Mude isso em produção!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Modelos de dados para o formulário
class LoginData(BaseModel):
    email: str
    senha: str

# Adicione este print para ter certeza que o código passou por aqui
print("Iniciando banco de dados...")
iniciar_db()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração de caminhos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(os.path.dirname(BASE_DIR), "storage", "uploads")
os.makedirs(STORAGE_DIR, exist_ok=True)

@app.post("/auth/registrar")
async def registrar(user: LoginData):
    hashed_password = pwd_context.hash(user.senha)
    try:
        conn = sqlite3.connect('storage/documind_v2.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)", (user.email, hashed_password))
        conn.commit()
        conn.close()
        return {"message": "Usuário criado com sucesso!"}
    except:
        return {"error": "E-mail já cadastrado"}


@app.get("/")
def home():
    return {"status": "DocuMind rodando perfeitamente"}

@app.post("/upload")
async def upload_documento(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Envie um PDF")

    file_id = str(uuid4())[:8]
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(STORAGE_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 1. Extrair
        dados = extrair_dados_do_pdf(file_path)
        
        # 2. SALVAR NO BANCO DE DADOS
        salvar_extracao(
            file.filename, 
            dados.get("cnpj"), 
            dados.get("data"), 
            dados.get("valor"),
            dados.get("telefone"),  
            dados.get("email")
        )     
        return {"status": "Processado e salvo no histórico", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-excel")
async def download_excel():
    # 3. BUSCAR TUDO DO BANCO PARA O EXCEL
    historico = listar_todos()
    
    if not historico:
        raise HTTPException(status_code=404, detail="Histórico vazio.")

    # Criar DataFrame com os nomes das colunas
    df = pd.DataFrame(historico, columns=["Arquivo", "CNPJ", "Data", "Valor", "Telefone", "Email", "Processado em"])
    
    excel_path = os.path.join(STORAGE_DIR, "relatorio_completo.xlsx")
    df.to_excel(excel_path, index=False)
    
    return FileResponse(path=excel_path, filename="historico_extracao.xlsx")

@app.get("/historico")
async def buscar_historico():
    # Usa a função que você já tem no database.py
    linhas = listar_todos() 
    
    historico = []
    for linha in linhas:
        historico.append({
            "arquivo": linha[0],
            "cnpj": linha[1],
            "valor": linha[3],  # No seu SELECT, valor é o índice 3
            "email": linha[5],  # Email é o índice 5
            "telefone": linha[4] # Telefone é o índice 4
        })
    
    return historico

@app.get("/historico/exportar")
async def exportar_excel():
    conn = sqlite3.connect('storage/documind_v2.db')
    # Lembre-se: o nome da tabela no seu banco é 'documentos'
    query = "SELECT nome_arquivo, cnpj, data, valor, telefone, email FROM documentos"
    df = pd.read_sql_query(query, conn)
    conn.close()

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Extrações')
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": "attachment; filename=historico_documind.xlsx"}
    )

@app.delete("/historico/limpar")
async def limpar_historico():
    conn = sqlite3.connect('storage/documind_v2.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documentos")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='documentos'") # Reinicia a contagem de IDs
    conn.commit()
    conn.close()
    return {"message": "Histórico limpo"}


@app.get("/setup-teste")
async def setup_teste():
    conn = sqlite3.connect('storage/documind_v2.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM usuarios") # Limpa para o teste
    
    usuarios = [
        ("Admin Documind", "admin@documind.com", "teste123", "Administrador"),
        ("João Silva", "joao@gmail.com", "teste123", "Premium"),
        ("Maria Teste", "maria@outlook.com", "teste123", "Teste Grátis")
    ]
    
    for nome, email, senha, tipo in usuarios:
        cursor.execute("INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)",
                       (nome, email, senha, tipo))
    
    conn.commit()
    conn.close()
    return {"message": "3 usuários criados: Admin, Premium e Teste Grátis"}

@app.post("/auth/login")
async def login(data: LoginData):
    try:
        conn = sqlite3.connect('storage/documind_v2.db')
        conn.row_factory = sqlite3.Row  # Isso permite acessar colunas pelo nome
        cursor = conn.cursor()
        
        # 1. Busca o usuário pelo e-mail
        cursor.execute("SELECT * FROM usuarios WHERE email = ?", (data.email,))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return {"error": "E-mail não encontrado"}

        # 2. Verifica a senha (usando a função 'falsa' que criamos para pular o erro do bcrypt)
        # Se você ainda não criou a função verificar_falso, use: if data.senha != user['senha_hash']:
        if data.senha != user['senha_hash']:
            return {"error": "Senha incorreta"}

        # 3. Se deu tudo certo, retorna os dados básicos
        return {
            "status": "success",
            "nome": user['nome'],
            "email": user['email'],
            "tipo": user['tipo']
        }

    except Exception as e:
        return {"error": f"Erro no servidor: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)