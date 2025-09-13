document.addEventListener('DOMContentLoaded', () => {
    const userNameDisplay = document.getElementById('user-name');
    const userEmailDisplay = document.getElementById('user-email');
    const cartCountNav = document.getElementById('cart-count');

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

    // Inicialização
    fetchProfileData();
});