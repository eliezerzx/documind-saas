import pandas as pd
import os

def criar_planilha(dados_lista, pasta_saida):
    """
    dados_lista: deve ser uma lista de dicionários ex: [{'cnpj': '...', 'valor': '...'}, ...]
    """
    df = pd.DataFrame(dados_lista)
    
    # Define o caminho do arquivo
    caminho_excel = os.path.join(pasta_saida, "resultado_extracao.xlsx")
    
    # Salva o Excel usando o motor openpyxl
    df.to_excel(caminho_excel, index=False)
    
    return caminho_excel