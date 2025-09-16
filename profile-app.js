document.addEventListener('DOMContentLoaded', () => {
    const userNameDisplay = document.getElementById('user-name');
    const userEmailDisplay = document.getElementById('user-email');
    const userNameInfo = document.getElementById('user-name-info');
    const userEmailInfo = document.getElementById('user-email-info');
    const cartCountNav = document.getElementById('cart-count');
    const profileUpdateModalEl = document.getElementById('profileUpdateModal');
    const profileUpdateForm = document.getElementById('profile-update-form');
    const passwordChangeForm = document.getElementById('password-change-form');
    const passwordSuccessMessage = document.getElementById('password-success-message');
    const passwordErrorMessage = document.getElementById('password-error-message');

    const token = localStorage.getItem('token');

    // Se não houver token, o usuário não está logado. Redireciona para o login.
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const fetchProfileData = async () => {
        try {
            // Busca os dados do perfil
            const profileRes = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!profileRes.ok) throw new Error('Falha ao buscar perfil.');

            const user = await profileRes.json();
            userNameDisplay.textContent = user.name;
            userEmailDisplay.textContent = user.email;
            userNameInfo.textContent = user.name;
            userEmailInfo.textContent = user.email;

            // Preenche o formulário do modal com os dados atuais
            document.getElementById('update-name').value = user.name;
            document.getElementById('update-email').value = user.email;

            // Busca os dados do carrinho para atualizar o contador
            const cartRes = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cart = await cartRes.json();
            const count = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
            cartCountNav.textContent = count;

        } catch (error) {
            console.error('Erro:', error);
            // Se o token for inválido, desloga o usuário
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const name = document.getElementById('update-name').value;
        const email = document.getElementById('update-email').value;

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Falha ao atualizar perfil.');
            }

            alert('Perfil atualizado com sucesso!');
            const modal = bootstrap.Modal.getInstance(profileUpdateModalEl);
            modal.hide();
            fetchProfileData(); // Recarrega os dados na página
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        passwordSuccessMessage.classList.add('d-none');
        passwordErrorMessage.classList.add('d-none');

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            passwordErrorMessage.textContent = 'A nova senha e a confirmação não correspondem.';
            passwordErrorMessage.classList.remove('d-none');
            return;
        }

        try {
            const res = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Falha ao alterar a senha.');
            }

            passwordSuccessMessage.textContent = 'Senha alterada com sucesso!';
            passwordSuccessMessage.classList.remove('d-none');
            passwordChangeForm.reset();
        } catch (error) {
            passwordErrorMessage.textContent = `Erro: ${error.message}`;
            passwordErrorMessage.classList.remove('d-none');
        }
    };

    // Inicialização
    fetchProfileData();

    // Event Listeners para os novos formulários
    profileUpdateForm.addEventListener('submit', handleProfileUpdate);
    passwordChangeForm.addEventListener('submit', handlePasswordChange);
});