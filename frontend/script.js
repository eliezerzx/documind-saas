// Elementos
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const uploadBtn = document.getElementById('uploadBtn');
const clearBtn = document.getElementById('clearBtn');
const resultTable = document.getElementById('resultTable');
const themeToggle = document.getElementById('theme-toggle');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const progressText = document.getElementById('progress-text');

// --- TEMA (DARK MODE) ---
themeToggle.onclick = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('theme-icon');
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
};

// --- CARREGAR HISTÓRICO ---
window.onload = async () => {
    // Ajuste de ícone inicial do tema
    if (document.documentElement.classList.contains('dark')) {
        document.getElementById('theme-icon').setAttribute('data-lucide', 'sun');
        lucide.createIcons();
    }

    try {
        const res = await fetch('http://127.0.0.1:8000/historico');
        if (res.ok) {
            const dados = await res.json();
            if (dados.length > 0) {
                document.getElementById('emptyState')?.remove();
                dados.forEach(item => adicionarLinhaTabela(item, item.arquivo));
            }
        }
    } catch (e) { showToast("Erro ao carregar histórico", "error"); }
};

// --- UPLOAD COM PROGRESSO ---
uploadBtn.onclick = async () => {
    const files = Array.from(fileInput.files);
    if (!files.length) return showToast("Selecione arquivos PDF", "error");

    document.getElementById('emptyState')?.remove();
    uploadBtn.disabled = true;
    progressContainer.classList.remove('hidden');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const percent = Math.round(((i + 1) / files.length) * 100);
        
        // Atualiza UI da barra
        progressBar.style.width = `${percent}%`;
        progressPercent.innerText = `${percent}%`;
        progressText.innerText = `Processando: ${file.name}`;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://127.0.0.1:8000/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                adicionarLinhaTabela(data.dados_extraidos, file.name);
                showToast(`${file.name} extraído!`, "success");
            }
        } catch (e) { showToast(`Erro no arquivo ${file.name}`, "error"); }
    }

    setTimeout(() => {
        progressContainer.classList.add('hidden');
        uploadBtn.disabled = false;
        lucide.createIcons();
    }, 1000);
};

// --- LIMPAR TUDO ---
clearBtn.onclick = async () => {
    if (!confirm("Apagar histórico permanentemente?")) return;
    try {
        const res = await fetch('http://127.0.0.1:8000/historico/limpar', { method: 'DELETE' });
        if (res.ok) {
            resultTable.innerHTML = `<tr id="emptyState"><td colspan="6" class="py-20 text-center opacity-40">Histórico limpo.</td></tr>`;
            showToast("Banco de dados limpo!", "success");
        }
    } catch (e) { showToast("Erro ao limpar dados", "error"); }
};

// --- HELPERS ---
function adicionarLinhaTabela(dados, nome) {
    const row = document.createElement('tr');
    row.className = "border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors";
    const valor = dados.valor && dados.valor !== "Não encontrado" ? `R$ ${dados.valor}` : "---";
    
    row.innerHTML = `
        <td class="px-6 py-4 text-sm font-semibold">${nome}</td>
        <td class="px-6 py-4 text-sm opacity-80">${dados.cnpj || '---'}</td>
        <td class="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">${valor}</td>
        <td class="px-6 py-4 text-[11px] opacity-70">${dados.email || 'N/A'}<br>${dados.telefone || ''}</td>
        <td class="px-6 py-4 text-sm opacity-60">${new Date().toLocaleDateString()}</td>
        <td class="px-6 py-4"><span class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-[10px] font-bold">OK</span></td>
    `;
    resultTable.prepend(row);
}

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    toast.className = `${color} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 toast-entry pointer-events-auto`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i><span>${msg}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// Drag & Drop
dropzone.onclick = () => fileInput.click();
dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('border-blue-500', 'bg-blue-50'); };
dropzone.ondragleave = () => dropzone.classList.remove('border-blue-500', 'bg-blue-50');
dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500', 'bg-blue-50');
    fileInput.files = e.dataTransfer.files;
    showToast(`${fileInput.files.length} arquivos prontos.`, "success");
};

// Selecione o botão (verifique se o ID no HTML é este ou adicione id="exportExcelBtn")
const exportBtn = document.getElementById('exportExcelBtn');

exportBtn.onclick = () => {
    showToast("Gerando seu arquivo Excel...", "success");
    
    // O navegador inicia o download automaticamente ao abrir este link
    window.location.href = 'http://127.0.0.1:8000/historico/exportar';
};

const searchInput = document.getElementById('searchInput');

searchInput.oninput = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = resultTable.getElementsByTagName('tr');

    // Ignora se for o estado vazio
    if (document.getElementById('emptyState')) return;

    for (let i = 0; i < rows.length; i++) {
        const rowText = rows[i].innerText.toLowerCase();
        
        // Se o termo de busca estiver em algum lugar da linha, mostra. Se não, esconde.
        if (rowText.includes(searchTerm)) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
};