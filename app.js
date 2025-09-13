document.addEventListener('DOMContentLoaded', () => {
    const productsList = document.getElementById('products-list');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const exportCartBtn = document.getElementById('export-cart-btn');

    // Simples ID de usuário para este exemplo. Em uma aplicação real, isso viria de um sistema de login.
    const USER_ID = 'user123';

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    const renderProducts = (products) => {
        productsList.innerHTML = '';
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>R$ ${product.price.toFixed(2)}</p>
                <button class="add-to-cart-btn" data-product-id="${product._id}">Adicionar ao Carrinho</button>
            `;
            productsList.appendChild(productCard);
        });
    };

    const renderCart = (cart) => {
        cartItemsList.innerHTML = '';
        let total = 0;
        let count = 0;

        if (cart && cart.items) {
            cart.items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    <span>${item.name} (x${item.quantity})</span>
                    <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-from-cart-btn" data-product-id="${item.productId}">Remover</button>
                `;
                cartItemsList.appendChild(li);
                total += item.price * item.quantity;
                count += item.quantity;
            });
        }

        cartCount.textContent = count;
        cartTotal.textContent = total.toFixed(2);
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
            const response = await fetch(`/api/cart/${USER_ID}`);
            const cart = await response.json();
            renderCart(cart);
        } catch (error) {
            console.error('Erro ao buscar carrinho:', error);
        }
    };

    const addToCart = async (productId) => {
        try {
            await fetch(`/api/cart/${USER_ID}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: productId, quantity: 1 })
            });
            fetchCart(); // Atualiza a exibição do carrinho
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
        }
    };

    const removeFromCart = async (productId) => {
        try {
            await fetch(`/api/cart/${USER_ID}/items/${productId}`, {
                method: 'DELETE'
            });
            fetchCart(); // Atualiza a exibição do carrinho
        } catch (error) {
            console.error('Erro ao remover do carrinho:', error);
        }
    };

    // --- EVENT LISTENERS ---

    productsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.productId;
            addToCart(productId);
        }
    });

    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-cart-btn')) {
            const productId = e.target.dataset.productId;
            removeFromCart(productId);
        }
    });

    exportCartBtn.addEventListener('click', () => {
        // A rota da API já força o download, então podemos apenas redirecionar.
        window.location.href = `/api/cart/${USER_ID}/export`;
    });

    // --- INICIALIZAÇÃO ---
    fetchProducts();
    fetchCart();
});