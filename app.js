document.addEventListener('DOMContentLoaded', () => {
    const productsList = document.getElementById('products-list');
    const cartCountNav = document.getElementById('cart-count');

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    const renderProducts = (products) => { // Altera a renderização para usar cards do Bootstrap
        productsList.innerHTML = '';
        products.forEach(product => {
            const productCol = document.createElement('div');
            productCol.className = 'col';
            productCol.innerHTML = `
                <div class="card h-100">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/200x150'}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description || ''}</p>
                        <p class="card-text fw-bold">R$ ${product.price.toFixed(2)}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary w-100 add-to-cart-btn" data-product-id="${product._id}">Adicionar ao Carrinho</button>
                    </div>
                </div>
            `;
            productsList.appendChild(productCol);
        });
    };

    const updateCartCount = (cart) => { // Apenas atualiza o contador no menu
        let count = 0;
        if (cart && cart.items) {
            count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        cartCountNav.textContent = count;
    };

    // --- FUNÇÕES DA API (FETCH) ---

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
        }
    };

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return; // Não busca o carrinho se não houver token

            const response = await fetch(`/api/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cart = await response.json();
            updateCartCount(cart);
        } catch (error) {
            console.error('Erro ao buscar carrinho:', error);
        }
    };

    const addToCart = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return alert('Por favor, faça login para adicionar itens ao carrinho.');

            await fetch(`/api/cart/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: productId, quantity: 1 })
            });
            fetchCart(); // Atualiza a exibição do carrinho
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
        }
    };

    // --- EVENT LISTENERS ---

    productsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.productId;
            addToCart(productId);
        }
    });

    // --- INICIALIZAÇÃO ---
    fetchProducts();
    fetchCart();
});