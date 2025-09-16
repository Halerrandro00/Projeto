document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const productModalEl = document.getElementById('productModal');
    const productModal = new bootstrap.Modal(productModalEl);
    const productForm = document.getElementById('product-form');
    const productModalLabel = document.getElementById('productModalLabel');
    const adminProductsList = document.getElementById('admin-products-list');
    const adminPaginationContainer = document.getElementById('admin-pagination');
    const adminSearchForm = document.getElementById('admin-search-form');
    const adminSearchBox = document.getElementById('admin-search-box');

    let currentAdminPage = 1;
    let currentAdminKeyword = '';

    // --- FUNÇÕES DE VERIFICAÇÃO E RENDERIZAÇÃO ---

    const checkAdminStatus = async () => {
        if (!token) {
            window.location.href = '/login';
            return;
        }
        try {
            const res = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha na autenticação');
            
            const user = await res.json();
            if (!user.isAdmin) {
                alert('Acesso negado. Apenas administradores.');
                window.location.href = '/products';
            } else {
                fetchProducts(); // Se for admin, carrega os produtos
            }
        } catch (error) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    const renderProducts = (products) => { // Agora recebe apenas a lista de produtos
        adminProductsList.innerHTML = '';
        if (products.length === 0) {
            adminProductsList.innerHTML = `<tr><td colspan="3" class="text-center text-muted p-4">Nenhum produto encontrado.</td></tr>`;
            return;
        }
        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${product.imageUrl}" alt="${product.name}" style="width: 45px; height: 45px" class="rounded-circle me-3" />
                        <div class="fw-bold">${product.name}</div>
                    </div>
                </td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${product._id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${product._id}">Excluir</button>
                </td>
            `;
            adminProductsList.appendChild(tr);
        });
    };

    const renderAdminPagination = (currentPage, totalPages) => {
        adminPaginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>`;
        adminPaginationContainer.appendChild(prevLi);

        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            adminPaginationContainer.appendChild(pageLi);
        }

        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Próximo</a>`;
        adminPaginationContainer.appendChild(nextLi);
    };

    // --- FUNÇÕES DA API ---

    const fetchProducts = async (page = 1, keyword = '') => {
        try {
            currentAdminPage = page;
            currentAdminKeyword = keyword;

            // Usamos um limite maior para a página de admin
            const res = await fetch(`/api/products?page=${page}&limit=10&keyword=${keyword}`);
            if (!res.ok) throw new Error('Falha ao buscar produtos');
            const data = await res.json();
            renderProducts(data.products);
            renderAdminPagination(data.page, data.pages);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
        }
    };

    const saveProduct = async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const productData = {
            name: document.getElementById('product-name').value,
            price: parseFloat(document.getElementById('product-price').value),
            description: document.getElementById('product-description').value,
            imageUrl: document.getElementById('product-imageUrl').value,
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/products/${id}` : '/api/products';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(productData)
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message));

            productModal.hide();
            fetchProducts(currentAdminPage, currentAdminKeyword); // Recarrega a página/busca atual
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message));
            fetchProducts(currentAdminPage, currentAdminKeyword); // Recarrega a página/busca atual
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    };

    const openEditModal = async (id) => {
        try {
            const res = await fetch(`/api/products/${id}`);
            if (!res.ok) throw new Error('Produto não encontrado');
            const product = await res.json();

            if (product) {
                productModalLabel.textContent = 'Editar Produto';
                document.getElementById('product-id').value = product._id;
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-price').value = product.price;
                document.getElementById('product-description').value = product.description;
                document.getElementById('product-imageUrl').value = product.imageUrl;
                productModal.show();
            }
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    };

    // --- EVENT LISTENERS ---

    productForm.addEventListener('submit', saveProduct);

    adminProductsList.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('edit-btn')) openEditModal(id);
        if (e.target.classList.contains('delete-btn')) deleteProduct(id);
    });

    adminSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const keyword = adminSearchBox.value.trim();
        fetchProducts(1, keyword); // Reseta para a página 1 em uma nova busca
    });

    adminPaginationContainer.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'A' && !e.target.parentElement.classList.contains('disabled')) {
            const page = parseInt(e.target.dataset.page);
            fetchProducts(page, currentAdminKeyword); // Usa a keyword atual para paginar
        }
    });

    productModalEl.addEventListener('show.bs.modal', (e) => {
        if (!e.relatedTarget || !e.relatedTarget.classList.contains('edit-btn')) {
            productModalLabel.textContent = 'Adicionar Produto';
            productForm.reset();
            document.getElementById('product-id').value = '';
        }
    });

    // --- INICIALIZAÇÃO ---
    checkAdminStatus();
});