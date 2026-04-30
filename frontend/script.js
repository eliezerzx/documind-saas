// Elementos Globais
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const uploadBtn = document.getElementById('uploadBtn');
const resultTable = document.getElementById('resultTable');
const themeToggle = document.getElementById('theme-toggle');

let totalGeralValor = 0;
let totalGeralDocs = 0;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    inicializarUsuario();
    verificarStatusIA();
    setInterval(verificarStatusIA, 10000); // Verifica a cada 10s
    carregarHistorico();
    lucide.createIcons();
});

function inicializarUsuario() {
    const nome = localStorage.getItem('userName') || 'Utilizador';
    const tipo = localStorage.getItem('userType') || 'Teste Grátis';
    
    document.getElementById('user-name-display').innerText = nome;
    document.getElementById('user-type-display').innerText = tipo;
    document.getElementById('welcome-name').innerText = nome.split(' ')[0];

    const iniciais = nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('user-avatar').innerText = iniciais;
}

// --- VERIFICAÇÃO DE STATUS REAL ---
async function verificarStatusIA() {
    const aiStatusText = document.getElementById('ai-status-text');
    const aiStatusDesc = document.getElementById('ai-status-desc');
    const aiStatusDot = document.getElementById('ai-status-dot');
    const aiCard = document.getElementById('ai-status-card');

    try {
        const response = await fetch('http://127.0.0.1:8000/historico');
        
        if (response.ok) {
            aiStatusText.innerText = "Online";
            aiStatusText.className = "text-2xl font-bold mb-4 text-white";
            aiStatusDot.className = "w-2 h-2 bg-green-400 rounded-full animate-pulse";
            aiStatusDesc.innerHTML = `<span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Processamento disponível`;
            aiCard.classList.replace('bg-red-900', 'bg-blue-600');
            
            uploadBtn.disabled = false;
            uploadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else { throw new Error(); }
    } catch (error) {
        aiStatusText.innerText = "Offline";
        aiStatusText.className = "text-2xl font-bold mb-4 text-red-200";
        aiStatusDot.className = "w-2 h-2 bg-red-500 rounded-full";
        aiStatusDesc.innerHTML = `<span class="w-2 h-2 bg-red-500 rounded-full"></span> Processamento indisponível`;
        aiCard.classList.replace('bg-blue-600', 'bg-red-900');
        
        uploadBtn.disabled = true;
        uploadBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// --- LÓGICA DE UPLOAD ---
uploadBtn.onclick = async () => {
    const files = Array.from(fileInput.files);
    if (!files.length) return showToast("Selecione arquivos PDF", "error");

    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const progContainer = document.getElementById('progress-container');
    const progBar = document.getElementById('progress-bar');

    uploadBtn.disabled = true;
    btnText?.classList.add('hidden');
    btnLoader?.classList.remove('hidden');
    progContainer?.classList.remove('hidden');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const percent = Math.round(((i + 1) / files.length) * 100);
        
        if (progBar) progBar.style.width = `${percent}%`;
        document.getElementById('progress-percent').innerText = `${percent}%`;
        document.getElementById('progress-text').innerText = `Extraindo: ${file.name}`;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://127.0.0.1:8000/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                document.getElementById('emptyState')?.remove();
                adicionarLinhaTabela(data.dados_extraidos, file.name);
                atualizarCards();
                showToast(`${file.name} processado!`, "success");
            }
        } catch (e) { showToast("Erro no servidor", "error"); }
    }

    setTimeout(() => {
        progContainer.classList.add('hidden');
        uploadBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        fileInput.value = "";
        lucide.createIcons();
    }, 1000);
};

function adicionarLinhaTabela(dados, nome) {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.remove();

    const row = document.createElement('tr');
    const dataAtual = new Date();
    
    // Configurações essenciais para filtros e estilo
    row.setAttribute('data-date', dataAtual.toISOString());
    row.className = "border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors";
    
    // --- VALIDAÇÃO RÍGIDA DE VALOR MONETÁRIO ---
    let valorExibicao = "---";
    let valorParaSoma = 0;

    if (dados.valor && dados.valor !== "Não encontrado") {
        let v = String(dados.valor).trim();
        const regexMoedaBrasileira = /\d+,\d{2}$/;

        if (regexMoedaBrasileira.test(v)) {
            valorExibicao = v.includes("R$") ? v : `R$ ${v}`;
            const limpo = v.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
            valorParaSoma = parseFloat(limpo) || 0;
        }
    }

    // --- TRATAMENTO DE CONTATO (E-mail e Telefone) ---
    const cnpjCpf = dados.cnpj_cpf || dados.cnpj || "---";
    const email = dados.email || "E-mail não encontrado";
    const telefone = dados.contato || dados.telefone || "Telefone não encontrado";
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR');

    // HTML COM AS 6 COLUNAS ALINHADAS E CONTATO DUPLO
    row.innerHTML = `
        <td class="px-6 py-4 font-medium text-xs text-slate-700 dark:text-slate-300">${nome}</td>
        <td class="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">${cnpjCpf}</td>
        <td class="px-6 py-4 font-bold text-blue-600 text-xs">${valorExibicao}</td>
        <td class="px-6 py-4">
            <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title="${email}">
                    ${email}
                </span>
                <span class="text-[10px] text-slate-500 dark:text-slate-500">
                    ${telefone}
                </span>
            </div>
        </td>
        <td class="px-6 py-4 text-xs text-slate-500">${dataFormatada}</td>
        <td class="px-6 py-4">
            <span class="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-[9px] font-bold uppercase">
                Concluído
            </span>
        </td>
    `;
    
    if (typeof resultTable !== 'undefined') {
        resultTable.prepend(row);
    }
    
    // Recalcula os cards com base na tabela atualizada
    if (typeof atualizarCards === 'function') {
        atualizarCards();
    }
}

// Função auxiliar para atualizar os números lá em cima nos cards
function atualizarCardsNaTela() {
    if (document.getElementById('card-total-docs')) {
        document.getElementById('card-total-docs').innerText = totalGeralDocs;
    }
    if (document.getElementById('card-total-valor')) {
        document.getElementById('card-total-valor').innerText = totalGeralValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}

function atualizarCards() {
    // Pega todas as linhas da tabela, exceto a mensagem de "vazio"
    const rows = Array.from(resultTable.querySelectorAll('tr:not(#emptyState)'));
    
    let totalSoma = 0;
    let totalDocumentos = rows.length;

    rows.forEach(row => {
        // Pega o texto da terceira coluna (índice 2 -> VALOR)
        const textoValor = row.cells[2].innerText;

        // Só tenta somar se o texto contiver "R$" (garante que é um valor extraído)
        if (textoValor.includes('R$')) {
            // Limpa a string: remove "R$", remove pontos de milhar e troca vírgula por ponto
            const valorLimpo = textoValor
                .replace('R$', '')
                .replace(/\./g, '')
                .replace(',', '.')
                .trim();
            
            const valorNumerico = parseFloat(valorLimpo);
            
            if (!isNaN(valorNumerico)) {
                totalSoma += valorNumerico;
            }
        }
    });

    // Atualiza os cards na tela com os valores reais da tabela
    const cardDocs = document.getElementById('card-total-docs');
    const cardValor = document.getElementById('card-total-valor');

    if (cardDocs) cardDocs.innerText = totalDocumentos;
    if (cardValor) {
        cardValor.innerText = totalSoma.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        });
    }
}

async function carregarHistorico() {
    try {
        const res = await fetch('http://127.0.0.1:8000/historico');
        if (res.ok) {
            const dados = await res.json();
            // Limpa a tabela antes de carregar para não duplicar
            resultTable.innerHTML = '<tr id="emptyState"><td colspan="6" class="py-10 text-center opacity-40 italic text-sm">Nenhum dado encontrado.</td></tr>';
            
            if (dados.length > 0) {
                document.getElementById('emptyState')?.remove();
                // Inverte a ordem para o mais novo aparecer em cima, ou use prepend
                dados.forEach(item => adicionarLinhaTabela(item, item.nome_arquivo || item.arquivo));
                atualizarCards(); // Garante que os cards somem os valores do banco
            }
        }
    } catch (e) { 
        console.error("Erro ao carregar histórico do servidor"); 
    }
}

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-2 animate-bounce-in`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function fazerLogout() { localStorage.clear(); window.location.href = 'login.html'; }

themeToggle.onclick = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    lucide.createIcons();
};

dropzone.onclick = () => fileInput.click();

// --- LÓGICA DE FILTROS DE DATA ---

function filtrarPorPeriodo(dias) {
    const rows = document.querySelectorAll('#resultTable tr:not(#emptyState)');
    const agora = new Date();
    
    rows.forEach(row => {
        const dataAtributo = row.getAttribute('data-date');
        if (!dataAtributo) return;

        const dataDoc = new Date(dataAtributo);
        const diferencaTempo = agora - dataDoc;
        const diferencaDias = diferencaTempo / (1000 * 60 * 60 * 24);

        if (dias === -1) {
            // Mostrar todos
            row.style.display = '';
        } else if (dias === 0) {
            // Hoje (mesmo dia, mês e ano)
            const hoje = agora.toLocaleDateString();
            const docData = dataDoc.toLocaleDateString();
            row.style.display = hoje === docData ? '' : 'none';
        } else {
            // Últimos X dias
            row.style.display = diferencaDias <= dias ? '' : 'none';
        }
    });

    // Feedback visual nos botões
    atualizarEstiloBotoesFiltro(dias);
}

function atualizarEstiloBotoesFiltro(diasSelecionados) {
    const botoes = document.querySelectorAll('.filter-btn');
    botoes.forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-200');
        // Adiciona estilo se for o selecionado
        if (btn.getAttribute('data-days') == diasSelecionados) {
            btn.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-200');
        }
    });
}

// Configurar os cliques nos botões ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const btnHoje = document.querySelector('button:contains("Hoje")') || document.querySelectorAll('.lg\\:w-80 button')[0];
    const btn7Dias = document.querySelector('button:contains("7 dias")') || document.querySelectorAll('.lg\\:w-80 button')[1];
    const btnMes = document.querySelector('button:contains("Este mês")') || document.querySelectorAll('.lg\\:w-80 button')[2];

    // Adicionando identificadores e eventos
    if(btnHoje) {
        btnHoje.classList.add('filter-btn');
        btnHoje.setAttribute('data-days', '0');
        btnHoje.onclick = () => filtrarPorPeriodo(0);
    }
    if(btn7Dias) {
        btn7Dias.classList.add('filter-btn');
        btn7Dias.setAttribute('data-days', '7');
        btn7Dias.onclick = () => filtrarPorPeriodo(7);
    }
    if(btnMes) {
        btnMes.classList.add('filter-btn');
        btnMes.setAttribute('data-days', '30');
        btnMes.onclick = () => filtrarPorPeriodo(30);
    }
});

// Função para Limpar Tabela
// Botão de Limpeza Geral
if (document.getElementById('clearBtn')) {
    document.getElementById('clearBtn').onclick = async () => { // Adicionei async aqui
        if (confirm("Deseja apagar TUDO? Isso limpará o histórico no servidor e zerará os contadores.")) {
            
            try {
                // AVISA O BACKEND PARA APAGAR O BANCO DE DADOS
                await fetch('http://127.0.0.1:8000/historico/limpar', { method: 'DELETE' });
                
                // Limpa visualmente a tabela
                resultTable.innerHTML = '<tr id="emptyState"><td colspan="6" class="py-10 text-center opacity-40 italic text-sm">Nenhum dado encontrado.</td></tr>';
                
                // Zera as variáveis e os cards
                totalGeralValor = 0;
                totalGeralDocs = 0;
                document.getElementById('card-total-docs').innerText = '0';
                document.getElementById('card-total-valor').innerText = 'R$ 0,00';
                
                // Limpa o cache do navegador
                localStorage.removeItem('historicoDocumentos'); 
                
                showToast("Banco de dados e histórico limpos!", "success");
            } catch (err) {
                showToast("Erro ao limpar dados no servidor", "error");
            }
        }
    };
}

// Exportar Excel
const exportBtn = document.getElementById('exportExcelBtn');
if(exportBtn) {
    exportBtn.onclick = () => {
        showToast("Gerando seu arquivo Excel...", "success");
        window.location.href = 'http://127.0.0.1:8000/historico/exportar';
    };
}

// Busca em Tempo Real
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.oninput = (e) => {
        const termo = e.target.value.toLowerCase();
        const linhas = resultTable.querySelectorAll('tr:not(#emptyState)');
        
        linhas.forEach(linha => {
            const texto = linha.innerText.toLowerCase();
            linha.style.display = texto.includes(termo) ? '' : 'none';
        });
    };
}

