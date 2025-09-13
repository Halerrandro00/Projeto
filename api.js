const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Product = require('./product');
const Cart = require('./cart');
const User = require('./user');

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
            const token = jwt.sign({ id: user._id }, 'SUA_CHAVE_SECRETA_AQUI', { expiresIn: '1h' });
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
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, 'SUA_CHAVE_SECRETA_AQUI');
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Não autorizado, token falhou' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, sem token' });
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
    });
});

// --- ROTAS DE PRODUTOS ---

// READ: Listar todos os produtos
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE: Adicionar um novo produto (para popular a loja)
router.post('/products', async (req, res) => {
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
        cart.items.push({ productId, name: product.name, quantity, price: product.price });
      }
      cart = await cart.save();
      return res.status(200).json(cart);
    } else {
      // Não existe carrinho para o usuário, cria um novo
      const newCart = await Cart.create({
        userId,
        items: [{ productId, name: product.name, quantity, price: product.price }]
      });
      return res.status(201).json(newCart);
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

module.exports = router;