// login.js

const loginForm = document.querySelector('form');

loginForm.onsubmit = async (e) => {
    e.preventDefault(); // Impede a página de recarregar

    // Pegamos os valores dos inputs
    const email = document.querySelector('input[type="email"]').value;
    const senha = document.querySelector('input[type="password"]').value;

    try {
        const response = await fetch('http://127.0.0.1:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok && !data.error) {
            // Se o login for um sucesso
            showToast("Bem-vindo de volta!", "success");
            
            // --- SALVANDO OS DADOS NO NAVEGADOR ---
            // Usamos os nomes exatos que o seu main.py envia: 'nome' e 'tipo'
            localStorage.setItem('usuarioLogado', 'true'); 
            localStorage.setItem('userName', data.nome || 'Usuário'); 
            localStorage.setItem('userType', data.tipo || 'Teste Grátis'); 
            // ---------------------------------------

            // Redireciona para o Dashboard após 1.5 segundos
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Se der erro (senha errada, usuário não existe)
            showToast(data.error || "Erro ao realizar login", "error");
        }
    } catch (error) {
        console.error("Erro técnico:", error);
        showToast("Servidor offline. Tente novamente mais tarde.", "error");
    }
};

// Função de Toast
function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    if (!container) return alert(msg); 

    const toast = document.createElement('div');
    const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    toast.className = `${color} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-300`;
    toast.innerHTML = `<span>${msg}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 3000);
    }, 2000);
}