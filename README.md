# 🚧 ---- EM DESENVOLVIMENTO ---- 🚧

# 📑 DocuMind - Extração Inteligente de Dados

O **DocuMind** é uma solução completa para automação de leitura de documentos. Utilizando Inteligência Artificial, o sistema processa arquivos PDF, identifica informações críticas (como CNPJ, Valores, Contatos e Datas) e organiza tudo em um dashboard intuitivo e profissional.

---

## 🚀 Funcionalidades

-   **Processamento de PDF:** Upload e leitura automatizada de documentos.
-   **Dashboard Financeiro:** Cards com somatórios automáticos de documentos processados e valores totais extraídos.
-   **Histórico Inteligente:** Tabela detalhada com:
    -   Nome do arquivo e CNPJ/CPF.
    -   Validação de valores monetários (filtra ruídos e foca em R$).
    -   Contato inteligente (E-mail e Telefone sobrepostos).
    -   Data e Status de conclusão.
-   **Persistência de Dados:** Integração com SQLite para armazenamento seguro.
-   **Segurança:** Sistema de autenticação (Login) para proteção dos dados.
-   **Modo Dark/Light:** Interface adaptativa para melhor experiência do usuário.

---

## 🛠️ Tecnologias Utilizadas

### Frontend:
- **HTML5 & CSS3**
- **Tailwind CSS** (Estilização moderna e responsiva)
- **JavaScript (ES6+)** (Lógica de interface e consumo de API)

### Backend:
- **Python 3.x**
- **FastAPI** (Framework de alta performance)
- **SQLite** (Banco de dados leve e eficiente)
- **IA/OCR** (Lógica de processamento de documentos)

---

## 📸 Demonstração
<img width="720" height="405" alt="screen-capture (3)" src="https://github.com/user-attachments/assets/678c8270-6084-49a5-bdfe-ebe1d22ab4f0" />





---

## ⚙️ Como Executar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/documind.git](https://github.com/seu-usuario/documind.git)
   cd documind







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
