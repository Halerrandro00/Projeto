document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const allOrdersContainer = document.getElementById('all-orders-container');

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

            fetchAllOrders();
        } catch (error) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    const renderAllOrders = (orders) => {
        allOrdersContainer.innerHTML = '';

        if (!orders || orders.length === 0) {
            allOrdersContainer.innerHTML = '<div class="alert alert-info">Nenhum pedido foi realizado na loja ainda.</div>';
            return;
        }

        const accordion = document.createElement('div');
        accordion.className = 'accordion';
        accordion.id = 'allOrdersAccordion';

        orders.forEach((order, index) => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
            const orderTotal = order.totalPrice.toFixed(2);
            const userName = order.userId ? order.userId.name : 'Usuário Removido';
            const userEmail = order.userId ? order.userId.email : '-';

            const itemsHtml = order.orderItems.map(item => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <img src="${item.imageUrl}" alt="${item.name}" class="img-fluid rounded me-2" style="width: 40px;">
                        ${item.name} <span class="text-muted">(Qtd: ${item.quantity})</span>
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
                            <span class="text-muted d-none d-md-inline">Cliente: ${userName}</span>
                            <span class="text-muted">${orderDate}</span>
                            <span class="fw-bold">R$ ${orderTotal}</span>
                        </div>
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#allOrdersAccordion">
                    <div class="accordion-body">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Cliente:</strong>
                                <p class="mb-2">${userName} (<a href="mailto:${userEmail}">${userEmail}</a>)</p>
                                <strong>Endereço de Entrega:</strong>
                                <p class="mb-2">${order.shippingAddress.address}, ${order.shippingAddress.city} - ${order.shippingAddress.postalCode}</p>
                                <strong>Método de Pagamento:</strong>
                                <p class="mb-0">${order.paymentMethod}</p>
                            </div>
                            <div class="col-md-6 mt-3 mt-md-0">
                                <strong>Itens do Pedido:</strong>
                                <ul class="list-group mt-2">
                                    ${itemsHtml}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            accordion.appendChild(accordionItem);
        });

        allOrdersContainer.appendChild(accordion);
    };

    const fetchAllOrders = async () => {
        try {
            const res = await fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Falha ao buscar os pedidos.');
            const orders = await res.json();
            renderAllOrders(orders);
        } catch (error) {
            allOrdersContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    };

    checkAdminAndFetchData();
});