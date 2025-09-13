document.addEventListener('DOMContentLoaded', () => {
    const navAuthLinks = document.getElementById('nav-auth-links');
    const token = localStorage.getItem('token');

    if (token) {
        // Usuário está logado: mostra "Meu Perfil" e "Sair"
        navAuthLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/profile">Meu Perfil</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" id="logout-link" style="cursor: pointer;">Sair</a>
            </li>
        `;

        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                alert('Você foi desconectado.');
                window.location.href = '/login';
            });
        }
    } else {
        // Usuário não está logado: mostra "Login" e "Registrar-se"
        navAuthLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/login">Login</a>
            </li>
            <li class="nav-item">
                <a class="btn btn-primary" href="/register">Registrar-se</a>
            </li>
        `;
    }
});