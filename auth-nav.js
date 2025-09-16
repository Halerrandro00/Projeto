document.addEventListener('DOMContentLoaded', () => {
    const navAuthLinks = document.getElementById('nav-auth-links');
    const token = localStorage.getItem('token');
    
    const setupNav = async () => {
        if (token) {
            try {
                const res = await fetch('/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    localStorage.removeItem('token');
                    renderLoggedOutLinks();
                    return;
                }
                const user = await res.json();
                renderLoggedInLinks(user.isAdmin);
            } catch (error) {
                renderLoggedOutLinks();
            }
        } else {
            renderLoggedOutLinks();
        }
    };

    const renderLoggedInLinks = (isAdmin) => {
        const adminLinks = isAdmin ? `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="adminMenu" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Admin
                </a>
                <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="adminMenu">
                    <li><a class="dropdown-item" href="/dashboard">Dashboard</a></li>
                    <li><a class="dropdown-item" href="/admin">Gerenciar Produtos</a></li>
                </ul>
            </li>
        ` : '';
        navAuthLinks.innerHTML = `
            ${adminLinks}
            <li class="nav-item"><a class="nav-link" href="/profile">Meu Perfil</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="logout-link" style="cursor: pointer;">Sair</a></li>
        `;
        document.getElementById('logout-link').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '/login';
        });
    };

    const renderLoggedOutLinks = () => {
         navAuthLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/login">Login</a>
            </li>
            <li class="nav-item">
                <a class="btn btn-primary" href="/register">Registrar-se</a>
            </li>
        `;
    };

    setupNav();
});