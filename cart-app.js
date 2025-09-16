document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-container');
    const cartCountNav = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const generateInvoiceBtn = document.getElementById('generate-invoice-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

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
            checkoutBtn.classList.add('disabled'); // Desabilita o botão de checkout
            generateInvoiceBtn.classList.add('disabled');
            return;
        }

        cart.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const itemCard = document.createElement('div');
            itemCard.className = 'card mb-3';
            itemCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div class="d-flex flex-row align-items-center" style="min-width: 0;">
                            <div>
                                <img src="${item.imageUrl || 'https://via.placeholder.com/100x100'}" class="img-fluid rounded-3" alt="Shopping item" style="width: 65px;">
                            </div>
                            <div class="ms-3">
                                <h5>${item.name}</h5>
                                <p class="small mb-0 text-muted">Preço Unitário: R$ ${item.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <div class="d-flex flex-row align-items-center">
                            <div style="width: 110px;">
                                <label class="form-label d-none" for="quantity-${item.productId}">Quantidade</label>
                                <input id="quantity-${item.productId}" type="number" min="1" value="${item.quantity}" class="form-control form-control-sm text-center quantity-input" data-product-id="${item.productId}" style="width: 70px;">
                            </div>
                            <div style="width: 110px;" class="text-end">
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
        checkoutBtn.classList.remove('disabled'); // Habilita o botão de checkout
        generateInvoiceBtn.classList.remove('disabled');
    };

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            // Se não houver token, o usuário não está logado.
            // O carrinho dele está vazio por definição no frontend.
            if (!token) {
                renderCart(null);
                return;
            }

            const response = await fetch(`/api/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Se o token for inválido/expirado, o servidor retornará 401
            if (!response.ok) {
                throw new Error('Falha na autenticação ao buscar carrinho.');
            }

            const cart = await response.json();
            renderCart(cart);
        } catch (error) {
            console.error('Erro ao buscar carrinho:', error);
            cartContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <strong>Ops!</strong> Não foi possível carregar seu carrinho. Verifique sua conexão ou tente novamente mais tarde.
                </div>
            `;
        }
    };

    const generateInvoicePDF = (cart, user) => {
        // Garante que estamos usando a instância global que o plugin autotable estende.
        const doc = new window.jspdf.jsPDF();

        // Cabeçalho
        doc.setFontSize(20);
        doc.text('Nota Fiscal - HRTZ tecnologias', 14, 22);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
        doc.text(`Cliente: ${user.name}`, 14, 38);
        doc.text(`Email: ${user.email}`, 14, 44);

        // Itens do Pedido
        const tableColumn = ["Produto", "Qtd.", "Preço Unit.", "Subtotal"];
        const tableRows = [];

        cart.items.forEach(item => {
            const itemData = [
                item.name,
                item.quantity,
                `R$ ${item.price.toFixed(2).replace('.', ',')}`,
                `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
            ];
            tableRows.push(itemData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] } // Cor azul para o cabeçalho da tabela
        });

        // Total
        const finalY = doc.autoTable.previous.finalY; // Pega a posição Y final da tabela
        const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: R$ ${total.toFixed(2).replace('.', ',')}`, 14, finalY + 15);

        // Salva o PDF
        doc.save('nota-fiscal.pdf');
    };
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const updateCartQuantity = async (productId, quantity) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`/api/cart/items/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity })
            });

            if (!res.ok) throw new Error('Falha ao atualizar a quantidade.');
            
            fetchCart(); // Atualiza a exibição do carrinho com os novos totais
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
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

    // Cria uma versão "debounced" da função de atualização.
    // Isso evita que a API seja chamada a cada pressionamento de tecla no campo de quantidade.
    const debouncedUpdate = debounce((productId, quantity) => {
        updateCartQuantity(productId, quantity);
    }, 500); // Atraso de 500ms

    cartContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const productId = e.target.dataset.productId;
            const quantity = e.target.value;
            // Validação básica para não enviar valores vazios ou inválidos
            if (quantity && parseInt(quantity) > 0) {
                debouncedUpdate(productId, quantity);
            }
        }
    });

    generateInvoiceBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Faça login para emitir a nota fiscal.');

        try {
            // Busca os dados do carrinho e do perfil do usuário em paralelo
            const [cartResponse, profileResponse] = await Promise.all([
                fetch(`/api/cart`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!cartResponse.ok) throw new Error('Falha ao buscar os dados do carrinho.');
            if (!profileResponse.ok) throw new Error('Falha ao buscar os dados do usuário.');
            
            const cart = await cartResponse.json();
            const user = await profileResponse.json();

            if (!cart || !cart.items || cart.items.length === 0) {
                return alert('Seu carrinho está vazio.');
            }
            // Passa os dados do carrinho e do usuário para a função de geração do PDF
            generateInvoicePDF(cart, user);
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });

    checkoutBtn.addEventListener('click', () => {
        // O botão já estará desabilitado se o carrinho estiver vazio, mas é uma boa prática verificar
        if (!checkoutBtn.classList.contains('disabled')) window.location.href = '/checkout';
    });

    fetchCart();
});