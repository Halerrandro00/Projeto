const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Product = require('./product');
const Cart = require('./cart');
const User = require('./user');
const Order = require('./order');

// --- ROTA DE AUTENTICAÇÃO ---

// POST /api/register - Registrar um novo usuário
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Usuário já existe' });
        }
        const user = await User.create({ name, email, password });
        res.status(201).json({ _id: user._id, name: user.name, email: user.email });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// POST /api/login - Autenticar e obter token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Email ou senha inválidos' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// --- MIDDLEWARE DE PROTEÇÃO ---
const protect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Não autorizado, token falhou' });
        }
    }

    // Se não entrou no if ou se o try/catch falhou, a resposta já foi enviada ou cairá aqui.
    return res.status(401).json({ message: 'Não autorizado, sem token' });
};

// --- MIDDLEWARE DE ADMIN ---
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Não autorizado como administrador' });
    }
};

// --- ROTA DE PERFIL ---
// GET /api/profile - Obter informações do perfil do usuário logado
router.get('/profile', protect, (req, res) => {
    // req.user é populado pelo middleware 'protect'
    // Retornamos os dados do usuário sem a senha
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin, // Envia o status de admin
    });
});

// UPDATE /api/profile - Atualizar informações do perfil
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
            });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        // Handle potential duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Este email já está em uso.' });
        }
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// UPDATE /api/profile/password - Alterar a senha do usuário
router.put('/profile/password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Por favor, forneça a senha atual e a nova senha.' });
    }

    try {
        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword; // O hook 'pre-save' no model irá criptografar
            await user.save();
            res.json({ message: 'Senha alterada com sucesso' });
        } else {
            res.status(401).json({ message: 'Senha atual incorreta.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// --- ROTA DE ADMIN STATS ---
router.get('/admin/stats', protect, admin, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        // Conta carrinhos que têm pelo menos um item
        const activeCartsCount = await Cart.countDocuments({ 'items.0': { $exists: true } });

        // Pega os 5 produtos mais caros para o gráfico
        const topProductsByPrice = await Product.find().sort({ price: -1 }).limit(5).select('name price');

        res.json({
            userCount,
            productCount,
            activeCartsCount,
            topProductsByPrice,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
});

// --- ROTAS DE ADMIN - GERENCIAMENTO DE USUÁRIOS ---

// GET /api/users - Listar todos os usuários (Admin)
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// DELETE /api/users/:id - Deletar um usuário (Admin)
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Prevenir que o admin se auto-delete
            if (user._id.equals(req.user._id)) {
                return res.status(400).json({ message: 'Não pode deletar o próprio usuário administrador.' });
            }
            await User.deleteOne({ _id: req.params.id });
            res.json({ message: 'Usuário removido' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// PUT /api/users/:id - Atualizar um usuário (Admin)
router.put('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.isAdmin = req.body.isAdmin;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
            });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// --- ROTAS DE PRODUTOS ---

// READ: Listar todos os produtos
router.get('/products', async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 8; // Produtos por página
  const page = parseInt(req.query.page) || 1;      // Página atual
  const keyword = req.query.keyword ? {
    name: {
      $regex: req.query.keyword,
      $options: 'i', // case-insensitive
    },
  } : {};
  const sort = {};
  if (req.query.sort === 'price_asc') {
    sort.price = 1;
  } else if (req.query.sort === 'price_desc') {
    sort.price = -1;
  }

  try {
    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort(sort);

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ONE: Get a single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE: Adicionar um novo produto (Protegido para Admin)
router.post('/products', protect, admin, async (req, res) => {
    const product = new Product({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        imageUrl: req.body.imageUrl
    });
    try {
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE: Atualizar um produto (Protegido para Admin)
router.put('/products/:id', protect, admin, async (req, res) => {
    const { name, price, description, imageUrl } = req.body;
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = name || product.name;
            product.price = price || product.price;
            product.description = description || product.description;
            product.imageUrl = imageUrl || product.imageUrl;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Produto não encontrado' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE: Remover um produto (Protegido para Admin)
router.delete('/products/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await Product.deleteOne({ _id: req.params.id });
            res.json({ message: 'Produto removido' });
        } else {
            res.status(404).json({ message: 'Produto não encontrado' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- ROTAS DO CARRINHO (CRUD COMPLETO) ---

// READ: Obter o carrinho de um usuário
router.get('/cart', protect, async (req, res) => {
  try {
    // req.user é adicionado pelo middleware 'protect'
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.json({ userId: req.user._id, items: [] }); // Retorna carrinho vazio se não existir
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE/UPDATE: Adicionar/atualizar item no carrinho
router.post('/cart/items', protect, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Carrinho existe, verificar se o item já está lá
      const itemIndex = cart.items.findIndex(p => p.productId == productId);

      if (itemIndex > -1) {
        // Item existe, atualiza a quantidade
        let productItem = cart.items[itemIndex];
        productItem.quantity += quantity;
        cart.items[itemIndex] = productItem;
      } else {
        // Item não existe, adiciona ao carrinho
        cart.items.push({ productId, name: product.name, quantity, price: product.price, imageUrl: product.imageUrl });
      }
      cart = await cart.save();
      return res.status(200).json(cart);
    } else {
      // Não existe carrinho para o usuário, cria um novo
      const newCart = await Cart.create({
        userId,
        items: [{ productId, name: product.name, quantity, price: product.price, imageUrl: product.imageUrl }]
      });
      return res.status(201).json(newCart);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE: Atualizar a quantidade de um item no carrinho
router.put('/cart/items/:productId', protect, async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    const newQuantity = parseInt(quantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
        return res.status(400).json({ message: 'A quantidade deve ser um número positivo.' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Carrinho não encontrado" });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = newQuantity;
            const updatedCart = await cart.save();
            return res.status(200).json(updatedCart);
        } else {
            return res.status(404).json({ message: "Item não encontrado no carrinho" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE: Remover um item do carrinho
router.delete('/cart/items/:productId', protect, async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;
    try {
        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter(item => item.productId != productId);

        const updatedCart = await cart.save();
        res.status(200).json(updatedCart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// EXPORT: Exportar dados do carrinho em JSON
router.get('/cart/export', protect, async (req, res) => {
    // Esta rota é idêntica à de leitura, mas demonstra a funcionalidade de exportação.
    const cart = await Cart.findOne({ userId: req.user._id }).lean(); // .lean() para um objeto JS puro
    res.header('Content-Disposition', `attachment; filename="cart-${req.user._id}.json"`);
    res.json(cart);
});

// --- ROTAS DE PEDIDOS ---

// CREATE: Criar um novo pedido a partir do carrinho
router.post('/orders', protect, async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;

        const cart = await Cart.findOne({ userId: req.user._id });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Seu carrinho está vazio.' });
        }

        // Calcula o preço total
        const totalPrice = cart.items.reduce((acc, item) => acc + item.quantity * item.price, 0);

        const order = new Order({
            userId: req.user._id,
            orderItems: cart.items,
            shippingAddress,
            paymentMethod,
            totalPrice,
            isPaid: true, // Simulação
            paidAt: Date.now(), // Simulação
        });

        const createdOrder = await order.save();

        // Limpa o carrinho do usuário após o pedido ser criado
        await Cart.deleteOne({ userId: req.user._id });

        res.status(201).json(createdOrder);

    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ message: 'Erro no servidor ao criar pedido.' });
    }
});

// READ: Obter os pedidos do usuário logado
router.get('/orders/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Erro ao buscar pedidos do usuário:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar pedidos.' });
    }
});

// READ: Obter todos os pedidos (Admin)
router.get('/orders', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Erro ao buscar todos os pedidos:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar pedidos.' });
    }
});


module.exports = router;