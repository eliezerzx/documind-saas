# 🚧 ---- EM DESENVOLVIMENTO ---- 🚧

### 📂 Estrutura do Projeto

```text
SAAS/
├── app/
│   ├── api/            # Rotas e endpoints da API
│   ├── core/           # Configurações centrais do sistema
│   ├── models/         # Definições de modelos de dados
│   ├── processors/     # Motores de extração (PDF e Excel)
│   ├── schemas/        # Esquemas de validação (Pydantic)
│   ├── database.py     # Gerenciamento do Banco de Dados SQLite
│   └── main.py         # Arquivo principal do Backend (FastAPI)
├── frontend/
│   ├── index.html      # Interface do Dashboard
│   └── script.js       # Lógica e animações do Frontend
├── storage/
│   ├── uploads/        # PDFs enviados para processamento
│   ├── processed/      # Arquivos após processamento
│   └── documind.db     # Banco de dados local
├── venv/               # Ambiente virtual Python
├── .gitignore          # Filtros para o Git (ignora arquivos desnecessários)
├── README.md           # Documentação do projeto
└── requirements.txt    # Lista de dependências do Python
