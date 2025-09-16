document.addEventListener('DOMContentLoaded', () => {
    const orderIdEl = document.getElementById('order-id');

    // Pega o ID do pedido da URL
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');

    // Exibe o ID na página
    if (orderId) orderIdEl.textContent = `#${orderId}`;
});