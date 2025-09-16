document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-container');
    const cartCountNav = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const exportCartBtn = document.getElementById('export-cart-btn');

    const renderCart = (cart) => {
        cartContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        if (!cart || !cart.items || cart.items.length === 0) {
            cartContainer.innerHTML = `
                <div class="card">
                    <div class="card-body text-center p-5">
                        <i class="bi bi-cart-x" style="font-size: 4rem; color: #6c757d;"></i>
                        <h4 class="mt-3">Seu carrinho está vazio.</h4>
                        <p class="text-muted">Adicione produtos para vê-los aqui.</p>
                        <a href="/products" class="btn btn-primary mt-2">Ver Produtos</a>
                    </div>
                </div>
            `;
            cartCountNav.textContent = 0;
            cartTotal.textContent = '0.00';
            cartSubtotal.textContent = 'R$ 0.00';
            return;
        }

        cart.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const itemCard = document.createElement('div');
            itemCard.className = 'card mb-3';
            itemCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div class="d-flex flex-row align-items-center">
                            <div>
                                <img src="${item.imageUrl || 'https://via.placeholder.com/100x100'}" class="img-fluid rounded-3" alt="Shopping item" style="width: 65px;">
                            </div>
                            <div class="ms-3">
                                <h5>${item.name}</h5>
                                <p class="small mb-0">Quantidade: ${item.quantity}</p>
                            </div>
                        </div>
                        <div class="d-flex flex-row align-items-center">
                            <div style="width: 120px;" class="text-end">
                                <h5 class="mb-0">R$ ${itemTotal.toFixed(2)}</h5>
                            </div>
                            <button class="btn btn-link text-danger remove-from-cart-btn" data-product-id="${item.productId}" style="text-decoration: none;">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartContainer.appendChild(itemCard);
            total += itemTotal;
            count += item.quantity;
        });

        cartCountNav.textContent = count;
        cartSubtotal.textContent = `R$ ${total.toFixed(2)}`;
        cartTotal.textContent = `R$ ${total.toFixed(2)}`;
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
        // Use .closest() para garantir que o clique funcione no botão ou no ícone
        const removeBtn = e.target.closest('.remove-from-cart-btn');
        if (removeBtn) {
            const productId = removeBtn.dataset.productId;
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