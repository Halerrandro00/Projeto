document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-container');
    const cartCountNav = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const exportCartBtn = document.getElementById('export-cart-btn');

    const renderCart = (cart) => {
        cartContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        if (!cart || !cart.items || cart.items.length === 0) {
            cartContainer.innerHTML = '<p class="alert alert-info">Seu carrinho está vazio.</p>';
            cartCountNav.textContent = 0;
            cartTotal.textContent = '0.00';
            return;
        }

        const listGroup = document.createElement('ul');
        listGroup.className = 'list-group';

        cart.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <h5 class="mb-1">${item.name}</h5>
                    <small>R$ ${item.price.toFixed(2)} x ${item.quantity}</small>
                </div>
                <div>
                    <span class="fw-bold me-3">R$ ${itemTotal.toFixed(2)}</span>
                    <button class="btn btn-danger btn-sm remove-from-cart-btn" data-product-id="${item.productId}">Remover</button>
                </div>
            `;
            listGroup.appendChild(li);
            total += itemTotal;
            count += item.quantity;
        });

        cartContainer.appendChild(listGroup);
        cartCountNav.textContent = count;
        cartTotal.textContent = total.toFixed(2);
    };

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return renderCart(null); // Limpa o carrinho se não houver token

            const response = await fetch(`/api/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cart = await response.json();
            renderCart(cart);
        } catch (error) {
            console.error('Erro ao buscar carrinho:', error);
        }
    };

    const removeFromCart = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch(`/api/cart/items/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCart(); // Atualiza a exibição do carrinho
        } catch (error) {
            console.error('Erro ao remover do carrinho:', error);
        }
    };

    cartContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-cart-btn')) {
            const productId = e.target.dataset.productId;
            removeFromCart(productId);
        }
    });

    exportCartBtn.addEventListener('click', () => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Faça login para exportar seu carrinho.');
        // A API de exportação agora é protegida, então não podemos simplesmente redirecionar.
        // Precisamos fazer um fetch e lidar com o blob de dados.
        fetch('/api/cart/export', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'cart.json';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => alert('Falha ao exportar o carrinho.'));
    });

    fetchCart();
});