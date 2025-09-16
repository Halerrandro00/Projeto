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
        const adminLink = isAdmin ? `<li class="nav-item"><a class="nav-link" href="/admin">Admin</a></li>` : '';
        navAuthLinks.innerHTML = `
            ${adminLink}
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