const loginForm = document.querySelector('form');

loginForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const email = document.querySelector('input[type="email"]').value;
    const senha = document.querySelector('input[type="password"]').value;

    const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (data.error) {
        alert(data.error); // Aqui você pode usar o seu sistema de Toast!
    } else {
        // Se o login for sucesso, vai para o Dashboard
        window.location.href = 'index.html'; 
    }
};