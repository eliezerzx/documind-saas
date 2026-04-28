import pdfplumber
import re

def extrair_dados_do_pdf(caminho_pdf):
    texto_completo = ""
    with pdfplumber.open(caminho_pdf) as pdf:
        for pagina in pdf.pages:
            texto_completo += pagina.extract_text() + "\n"

    # --- REGEX POTENTES ---
    
    # CNPJ: 00.000.000/0000-00
    cnpj_padrao = r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}"
    
    # DATA: DD/MM/AAAA ou DD-MM-AAAA
    data_padrao = r"\d{2}/\d{2}/\d{4}"
    
    # VALOR: Procura "R$" seguido de números, pontos e vírgulas
    valor_padrao = r"(?:R\$|VALOR TOTAL|TOTAL)\s?([\d\.,]+)"
    
    # TELEFONE: (00) 0000-0000 ou (00) 90000-0000 ou sem parênteses
    tel_padrao = r"(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})-\d{4}"
    
    # EMAIL: Padrao comum de emails
    email_padrao = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    # --- BUSCA DOS DADOS ---
    
    cnpj = re.search(cnpj_padrao, texto_completo)
    data = re.search(data_padrao, texto_completo)
    valor = re.search(valor_padrao, texto_completo)
    tel = re.search(tel_padrao, texto_completo)
    email = re.search(email_padrao, texto_completo)

    return {
        "cnpj": cnpj.group(0) if cnpj else "Não encontrado",
        "data": data.group(0) if data else "Não encontrada",
        "valor": valor.group(1) if valor else "Não encontrado",
        "telefone": tel.group(0) if tel else "Não encontrado",
        "email": email.group(0) if email else "Não encontrado"
    }