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
    const orderHistoryContainer = document.getElementById('order-history-container');

    const token = localStorage.getItem('token');

    // Se não houver token, o usuário não está logado. Redireciona para o login.
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const renderOrderHistory = (orders) => {
        orderHistoryContainer.innerHTML = '';

        if (!orders || orders.length === 0) {
            orderHistoryContainer.innerHTML = '<p class="text-muted">Você ainda não fez nenhum pedido.</p>';
            return;
        }

        const accordion = document.createElement('div');
        accordion.className = 'accordion';
        accordion.id = 'ordersAccordion';

        orders.forEach((order, index) => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
            const orderTotal = order.totalPrice.toFixed(2);

            // Gera o HTML para a lista de itens dentro do pedido
            const itemsHtml = order.orderItems.map(item => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <img src="${item.imageUrl}" alt="${item.name}" class="img-fluid rounded me-2" style="width: 40px;">
                        ${item.name} <span class="text-muted"> (Qtd: ${item.quantity})</span>
                    </div>
                    <span class="fw-bold">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                </li>
            `).join('');

            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                        <div class="d-flex justify-content-between w-100 pe-3">
                            <span>Pedido #${order._id.substring(0, 8)}...</span>
                            <span class="text-muted">${orderDate}</span>
                            <span class="fw-bold">R$ ${orderTotal}</span>
                        </div>
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#ordersAccordion">
                    <div class="accordion-body">
                        <strong>Endereço de Entrega:</strong>
                        <p class="mb-2">${order.shippingAddress.address}, ${order.shippingAddress.city} - ${order.shippingAddress.postalCode}</p>
                        <strong>Itens do Pedido:</strong>
                        <ul class="list-group mt-2">
                            ${itemsHtml}
                        </ul>
                    </div>
                </div>
            `;
            accordion.appendChild(accordionItem);
        });

        orderHistoryContainer.appendChild(accordion);
    };

    const fetchOrderHistory = async () => {
        try {
            const res = await fetch('/api/orders/myorders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao buscar histórico de pedidos.');
            const orders = await res.json();
            renderOrderHistory(orders);
        } catch (error) {
            orderHistoryContainer.innerHTML = `<div class="alert alert-warning">${error.message}</div>`;
        }
    };

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

            // Busca o histórico de pedidos
            fetchOrderHistory();

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