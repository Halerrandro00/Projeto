document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    const userCountEl = document.getElementById('user-count');
    const productCountEl = document.getElementById('product-count');
    const cartCountStatsEl = document.getElementById('cart-count-stats');
    const topProductsChartCanvas = document.getElementById('top-products-chart');

    const checkAdminAndFetchData = async () => {
        if (!token) {
            window.location.href = '/login';
            return;
        }
        try {
            // Primeiro, verifica se o usuário é admin
            const profileRes = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!profileRes.ok) throw new Error('Falha na autenticação');
            
            const user = await profileRes.json();
            if (!user.isAdmin) {
                alert('Acesso negado. Apenas administradores.');
                window.location.href = '/products';
                return;
            }

            // Se for admin, busca as estatísticas
            const statsRes = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!statsRes.ok) throw new Error('Falha ao buscar estatísticas');

            const stats = await statsRes.json();
            renderDashboard(stats);

        } catch (error) {
            console.error('Erro no Dashboard:', error);
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    const renderDashboard = (stats) => {
        // Preenche os cards de estatísticas
        userCountEl.textContent = stats.userCount;
        productCountEl.textContent = stats.productCount;
        cartCountStatsEl.textContent = stats.activeCartsCount;

        // Renderiza o gráfico
        if (topProductsChartCanvas && stats.topProductsByPrice) {
            new Chart(topProductsChartCanvas, {
                type: 'bar',
                data: {
                    labels: stats.topProductsByPrice.map(p => p.name),
                    datasets: [{
                        label: 'Preço (R$)',
                        data: stats.topProductsByPrice.map(p => p.price),
                        backgroundColor: [
                            'rgba(13, 110, 253, 0.5)',
                            'rgba(25, 135, 84, 0.5)',
                            'rgba(255, 193, 7, 0.5)',
                            'rgba(220, 53, 69, 0.5)',
                            'rgba(108, 117, 125, 0.5)',
                        ],
                        borderColor: [
                            'rgba(13, 110, 253, 1)',
                            'rgba(25, 135, 84, 1)',
                            'rgba(255, 193, 7, 1)',
                            'rgba(220, 53, 69, 1)',
                            'rgba(108, 117, 125, 1)',
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y', // Gráfico de barras horizontais
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                }
            });
        }
    };

    checkAdminAndFetchData();
});