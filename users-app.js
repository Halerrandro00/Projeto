document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const usersList = document.getElementById('users-list');

    const checkAdminAndFetchData = async () => {
        if (!token) {
            window.location.href = '/login';
            return;
        }
        try {
            const profileRes = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!profileRes.ok) throw new Error('Falha na autenticação');
            
            const user = await profileRes.json();
            if (!user.isAdmin) {
                alert('Acesso negado. Apenas administradores.');
                window.location.href = '/products';
                return;
            }

            fetchUsers();
        } catch (error) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    const renderUsers = (users) => {
        usersList.innerHTML = '';
        if (users.length === 0) {
            usersList.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">Nenhum usuário encontrado.</td></tr>`;
            return;
        }
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small>${user._id}</small></td>
                <td>${user.name}</td>
                <td><a href="mailto:${user.email}">${user.email}</a></td>
                <td>
                    <i class="bi ${user.isAdmin ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}"></i>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary toggle-admin-btn" data-id="${user._id}" data-is-admin="${user.isAdmin}" ${user.email === 'admin@example.com' ? 'disabled' : ''}>
                        ${user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${user._id}" ${user.email === 'admin@example.com' ? 'disabled' : ''}>Excluir</button>
                </td>
            `;
            usersList.appendChild(tr);
        });
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Falha ao buscar usuários');
            const users = await res.json();
            renderUsers(users);
        } catch (error) {
            usersList.innerHTML = `<tr><td colspan="5" class="text-center text-danger p-4">${error.message}</td></tr>`;
        }
    };

    const toggleAdmin = async (userId, currentIsAdmin) => {
        if (!confirm(`Tem certeza que deseja ${currentIsAdmin ? 'remover os privilégios de administrador' : 'tornar este usuário um administrador'}?`)) return;

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isAdmin: !currentIsAdmin })
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message));
            fetchUsers();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) return;

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message));
            fetchUsers();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    };

    usersList.addEventListener('click', (e) => {
        const target = e.target;
        const userId = target.dataset.id;

        if (target.classList.contains('delete-btn')) {
            deleteUser(userId);
        }
        if (target.classList.contains('toggle-admin-btn')) {
            const isAdmin = target.dataset.isAdmin === 'true';
            toggleAdmin(userId, isAdmin);
        }
    });

    checkAdminAndFetchData();
});