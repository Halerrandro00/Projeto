document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // Elementos da UI
    const summaryItemsList = document.getElementById('summary-items-list');
    const summaryItemCount = document.getElementById('summary-item-count');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total');
    const checkoutForm = document.getElementById('checkout-form');
    const payBtn = document.getElementById('pay-btn');
    const alertPlaceholder = document.getElementById('checkout-alert-placeholder');
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    const cardPaymentDetails = document.getElementById('card-payment-details');
    const pixPaymentDetails = document.getElementById('pix-payment-details');
    const cardFields = cardPaymentDetails.querySelectorAll('input');

    // Proteção da Rota
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const handlePaymentMethodChange = () => {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').id;

        if (selectedMethod === 'pix') {
            cardPaymentDetails.classList.add('d-none');
            pixPaymentDetails.classList.remove('d-none');
            // Torna os campos do cartão não obrigatórios para validação do formulário
            cardFields.forEach(field => field.required = false);
        } else { // 'credit' ou 'debit'
            cardPaymentDetails.classList.remove('d-none');
            pixPaymentDetails.classList.add('d-none');
            // Torna os campos do cartão obrigatórios novamente
            cardFields.forEach(field => field.required = true);
        }
        // Remove a classe de validação para revalidar no próximo submit
        checkoutForm.classList.remove('was-validated');
    };
    const showAlert = (message, type = 'danger') => {
        alertPlaceholder.innerHTML = `
            <div class="alert alert-${type} alert-dismissible" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    };

    const renderSummary = (cart) => {
        summaryItemsList.innerHTML = '';
        let total = 0;
        let count = 0;

        if (!cart || !cart.items || cart.items.length === 0) {
            // Se o carrinho estiver vazio, redireciona de volta para a página do carrinho
            window.location.href = '/cart';
            return;
        }

        cart.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between lh-sm';
            li.innerHTML = `
                <div>
                    <h6 class="my-0">${item.name}</h6>
                    <small class="text-muted">Qtd: ${item.quantity}</small>
                </div>
                <span class="text-muted">R$ ${itemTotal.toFixed(2)}</span>
            `;
            summaryItemsList.appendChild(li);
            total += itemTotal;
            count += item.quantity;
        });

        summaryItemCount.textContent = count;
        summarySubtotal.textContent = `R$ ${total.toFixed(2)}`;
        summaryTotal.textContent = `R$ ${total.toFixed(2)}`;
    };

    const fetchCartAndRender = async () => {
        try {
            const response = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar dados do carrinho.');
            
            const cart = await response.json();
            renderSummary(cart);
        } catch (error) {
            showAlert('Não foi possível carregar os itens do seu pedido. Tente novamente.');
            console.error(error);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        
        // Validação do Bootstrap
        if (!checkoutForm.checkValidity()) {
            e.stopPropagation();
            checkoutForm.classList.add('was-validated');
            return;
        }

        // Desabilita o botão para evitar múltiplos cliques
        payBtn.disabled = true;
        payBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Processando...
        `;

        const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        const orderData = {
            shippingAddress: {
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                postalCode: document.getElementById('postalCode').value,
            },
            paymentMethod: selectedPaymentMethod
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Não foi possível criar o pedido.');
            }

            // Sucesso! Redireciona para a página de confirmação com o ID do pedido
            window.location.href = `/order-success?id=${data._id}`;

        } catch (error) {
            showAlert(error.message);
            // Reabilita o botão em caso de erro
            payBtn.disabled = false;
            payBtn.innerHTML = 'Pagar e Finalizar Pedido';
        }
    };

    // --- INICIALIZAÇÃO ---
    fetchCartAndRender();
    handlePaymentMethodChange(); // Define o estado inicial correto dos formulários de pagamento
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', handlePaymentMethodChange);
    });
    checkoutForm.addEventListener('submit', handleCheckout);
});