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

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        // Guarda o token no navegador para o usuário não ter que logar toda hora
        localStorage.setItem('documind_token', token);
        
        // Limpa a URL para ficar bonita (sem o ?token=...)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        alert("Login realizado com sucesso!");
    }

    // Verifica se o usuário está logado
    const session = localStorage.getItem('documind_token');
    if (!session && window.location.pathname.includes('index.html')) {
        // Se tentar acessar o index sem estar logado, volta para o login
        window.location.href = "login.html";
    }
}

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

// --- UPLOAD COM PROGRESSO E VÍNCULO DE USUÁRIO ---
uploadBtn.onclick = async (e) => {
    if (e) e.preventDefault(); // <--- ISTO PARA O RECARREGAMENTO DA PÁGINA

    const files = Array.from(fileInput.files);
    if (!files.length) return showToast("Selecione arquivos PDF", "error");

    // Bloqueia o upload se o e-mail ainda não tiver sido carregado
    if (!LOGGED_USER_EMAIL) {
        return showToast("Aguarde o carregamento do perfil...", "error");
    }

    document.getElementById('emptyState')?.remove();
    uploadBtn.disabled = true;
    progressContainer.classList.remove('hidden');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Enviamos o e-mail na URL para o vínculo
            const res = await fetch(`http://127.0.0.1:8000/upload?user_email=${LOGGED_USER_EMAIL}`, { 
                method: 'POST', 
                body: formData 
            });

            if (res.ok) {
                const data = await res.json();
                // Adiciona a linha na tabela instantaneamente
                adicionarLinhaTabela(data.dados, file.name); 
                showToast(`${file.name} processado!`, "success");
            }
        } catch (error) {
            showToast(`Erro no ficheiro ${file.name}`, "error");
        }
    }

    // Reset sem dar refresh
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        uploadBtn.disabled = false;
        fileInput.value = "";
    }, 2000);
};

    // Reset da barra após concluir tudo
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        uploadBtn.disabled = false;
        fileInput.value = ""; // Limpa a seleção
        dropzone.classList.remove('border-blue-500', 'bg-blue-50');
    }, 2000);


    setTimeout(() => {
        progressContainer.classList.add('hidden');
        uploadBtn.disabled = false;
        lucide.createIcons();
    }, 1000);


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

// --- INICIALIZAÇÃO UNIFICADA ---
let LOGGED_USER_EMAIL = "";

window.onload = async function() {
    // 1. Lógica do Token (Mantenha igual)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        localStorage.setItem('documind_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. IMPORTANTE: Primeiro carregamos o perfil, depois o histórico
    // Usamos 'await' para garantir que temos o e-mail antes de qualquer outra coisa
    await carregarPerfilUsuario();
    
    lucide.createIcons();
};

async function carregarPerfilUsuario() {
    try {
        const response = await fetch('http://localhost:8000/auth/me');
        const dados = await response.json();

        if (dados.email) {
            LOGGED_USER_EMAIL = dados.email;
            document.getElementById('user-name').innerText = dados.nome;
            if (dados.foto) document.getElementById('user-photo').src = dados.foto;
            document.getElementById('user-profile').style.display = 'flex';

            // Só chamamos o histórico quando temos o e-mail confirmado
            carregarHistorico(dados.email);
        }
    } catch (e) { console.error("Erro ao carregar perfil:", e); }
}

async function carregarHistorico(email) {
    const res = await fetch(`http://127.0.0.1:8000/historico?email=${email}`);
    const dados = await res.json();
    // Aqui você chama sua lógica de adicionarLinhaTabela para cada dado
}

function logout() {
    localStorage.removeItem('documind_token'); // Limpa o token
    window.location.href = "login.html"; // Volta para o login
}