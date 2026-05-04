from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import sqlite3
import os
import io
import shutil
import pandas as pd
from uuid import uuid4
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse

# Importações do seu projeto
from app.processors.pdf_engine import extrair_dados_do_pdf
from app.database import iniciar_db, salvar_extracao, listar_todos

# 1. Carregar variáveis de ambiente
load_dotenv()

# 2. Configurações de Segurança
SECRET_KEY = os.getenv("SECRET_KEY", "8fGkL9vQ2zX!rP7mD4sW@cYhT6uB1nA5eR$JxC3pF0qZ&VwH*oI")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 3. INICIALIZAR O APP (Deve vir antes dos middlewares)
app = FastAPI()

# 4. CONFIGURAÇÃO DE MIDDLEWARES
app.add_middleware(
    SessionMiddleware, 
    secret_key=SECRET_KEY
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Configuração do OAuth/Google
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# 6. Modelos de dados
class LoginData(BaseModel):
    email: str
    senha: str

# 7. Funções de Inicialização do Banco
def criar_tabela_usuarios():
    conn = sqlite3.connect('storage/documind.db')
    cursor = conn.cursor()
    # Removido o 'NOT NULL' da coluna senha_hash
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT,
            nome TEXT,
            google_id TEXT,
            foto_perfil TEXT
        )
    ''')

    # Scripts de migração caso a tabela já exista sem as colunas novas
    try: cursor.execute('ALTER TABLE usuarios ADD COLUMN google_id TEXT')
    except: pass
    try: cursor.execute('ALTER TABLE usuarios ADD COLUMN foto_perfil TEXT')
    except: pass
    
    conn.commit()
    conn.close()

# Executa inicializações
criar_tabela_usuarios()
print("Iniciando banco de dados...")
iniciar_db()

# Configuração de caminhos de arquivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(os.path.dirname(BASE_DIR), "storage", "uploads")
os.makedirs(STORAGE_DIR, exist_ok=True)

# --- ROTAS DE AUTENTICAÇÃO ---

@app.post("/auth/registrar")
async def registrar(user: LoginData):
    hashed_password = pwd_context.hash(user.senha)
    try:
        conn = sqlite3.connect('storage/documind.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)", (user.email, hashed_password))
        conn.commit()
        conn.close()
        return {"message": "Usuário criado com sucesso!"}
    except:
        return {"error": "E-mail já cadastrado"}

@app.post("/auth/login")
async def login(user: LoginData):
    conn = sqlite3.connect('storage/documind.db')
    cursor = conn.cursor()
    cursor.execute("SELECT senha_hash FROM usuarios WHERE email = ?", (user.email,))
    result = cursor.fetchone()
    conn.close()

    if not result or not pwd_context.verify(user.senha, result[0]):
        return {"error": "E-mail ou senha incorretos"}
    
    return {"message": "Login realizado!", "redirect": "/index.html"}

@app.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = "http://localhost:8000/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri, prompt="select_account")

@app.get("/auth/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Erro ao obter dados do Google")

        conn = sqlite3.connect('storage/documind.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM usuarios WHERE email = ?", (user_info['email'],))
        user_exists = cursor.fetchone()

        if not user_exists:
            cursor.execute('''
                INSERT INTO usuarios (nome, email, google_id, foto_perfil) 
                VALUES (?, ?, ?, ?)
            ''', (user_info['name'], user_info['email'], user_info['sub'], user_info['picture']))
        else:
            cursor.execute('''
                UPDATE usuarios SET google_id = ?, foto_perfil = ? WHERE email = ?
            ''', (user_info['sub'], user_info['picture'], user_info['email']))

        conn.commit()
        conn.close()

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = jwt.encode(
            {"sub": user_info['email'], "exp": datetime.utcnow() + access_token_expires}, 
            SECRET_KEY, algorithm=ALGORITHM
        )

        url_dashboard = f"http://127.0.0.1:3000/frontend/index.html?token={access_token}" 
        return RedirectResponse(url=url_dashboard)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ROTAS DO SISTEMA (Upload, Histórico, Excel) ---

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
        
        dados = extrair_dados_do_pdf(file_path)
        
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
    historico = listar_todos()
    if not historico:
        raise HTTPException(status_code=404, detail="Histórico vazio.")

    df = pd.DataFrame(historico, columns=["Arquivo", "CNPJ", "Data", "Valor", "Telefone", "Email", "Processado em"])
    excel_path = os.path.join(STORAGE_DIR, "relatorio_completo.xlsx")
    df.to_excel(excel_path, index=False)
    
    return FileResponse(path=excel_path, filename="historico_extracao.xlsx")

@app.get("/historico")
async def buscar_historico():
    linhas = listar_todos() 
    historico = []
    for linha in linhas:
        historico.append({
            "arquivo": linha[0],
            "cnpj": linha[1],
            "valor": linha[3],
            "email": linha[5],
            "telefone": linha[4]
        })
    return historico

@app.get("/historico/exportar")
async def exportar_excel():
    conn = sqlite3.connect('storage/documind.db')
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
    conn = sqlite3.connect('storage/documind.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documentos")
    conn.commit()
    conn.close()
    return {"message": "Histórico limpo"}

@app.get("/auth/me")
async def obter_meu_perfil():
    try:
        conn = sqlite3.connect('storage/documind.db')
        cursor = conn.cursor()
        # Buscamos o último utilizador registado para o teste de perfil
        cursor.execute("SELECT nome, foto_perfil FROM usuarios ORDER BY id DESC LIMIT 1")
        user = cursor.fetchone()
        conn.close()
        
        if user:
            # Retornamos exatamente as chaves que o JS espera: "nome" e "foto"
            return {"nome": user[0], "foto": user[1]}
        return {"error": "Usuário não encontrado"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Certifique-se de que a porta aqui é a 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)