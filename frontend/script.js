const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const uploadBtn = document.getElementById('uploadBtn');
const resultTable = document.getElementById('resultTable');
const loadingArea = document.getElementById('loadingArea');
const progressBar = document.getElementById('progressBar');
const loadingStatus = document.getElementById('loadingStatus');

// Abre seleção de arquivo ao clicar no dropzone
dropzone.onclick = () => fileInput.click();

// Muda texto quando arquivos são selecionados
fileInput.onchange = () => {
    const qtd = fileInput.files.length;
    document.getElementById('dropzoneText').innerText = qtd > 0 ? `${qtd} arquivo(s) selecionado(s)` : "Arraste seus PDFs aqui";
};

uploadBtn.onclick = async () => {
    const files = Array.from(fileInput.files);
    
    if (files.length === 0) return alert("Selecione ao menos um arquivo!");

    // Feedback visual
    uploadBtn.disabled = true;
    uploadBtn.innerText = "Trabalhando...";
    loadingArea.classList.remove('hidden');
    
    let processados = 0;

    for (const file of files) {
        console.log("Iniciando processo do arquivo:", file.name);
        const formData = new FormData();
        formData.append('file', file);

        try {
            loadingStatus.innerText = `Processando: ${file.name}...`;
            
            const response = await fetch('http://127.0.0.1:8000/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                console.error("Erro no servidor para o arquivo:", file.name);
                continue;
            }

            const data = await response.json();
            
            if (data.dados_extraidos) {
                adicionarLinha(data.dados_extraidos, file.name);
            }

            processados++;
            const percentual = (processados / files.length) * 100;
            progressBar.style.width = percentual + '%';
            loadingStatus.innerText = `Concluído ${processados} de ${files.length}`;

            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error("Erro fatal no loop:", error);
        }
    }

    setTimeout(() => {
        uploadBtn.disabled = false;
        uploadBtn.innerText = "Processar Arquivos";
        loadingArea.classList.add('hidden');
        progressBar.style.width = '0%';
        fileInput.value = "";
        alert("Processamento finalizado!");
    }, 1000);
};

function adicionarLinha(dados, nomeArquivo) {
    const row = document.createElement('tr');
    row.className = "border-b hover:bg-gray-50 transition-colors animate-pulse";
    
    const valorFormatado = dados.valor !== "Não encontrado" ? `R$ ${dados.valor}` : "N/A";

    row.innerHTML = `
        <td class="p-4 text-sm font-medium text-gray-800">${nomeArquivo}</td>
        <td class="p-4 text-sm text-gray-600">${dados.cnpj || '---'}</td>
        <td class="p-4 text-sm text-blue-700 font-bold">${valorFormatado}</td>
        <td class="p-4 text-xs text-gray-500">
            <span class="font-semibold">${dados.email || ''}</span><br>
            <span>${dados.telefone || ''}</span>
        </td>
    `;
    setTimeout(() => row.classList.remove('animate-pulse'), 1000);
    resultTable.insertBefore(row, resultTable.firstChild);
}