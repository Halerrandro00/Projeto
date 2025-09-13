const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Cart = require('../models/cart');

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
router.get('/cart/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      return res.json({ userId: req.params.userId, items: [] }); // Retorna carrinho vazio se não existir
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE/UPDATE: Adicionar/atualizar item no carrinho
router.post('/cart/:userId/items', async (req, res) => {
  const { productId, quantity } = req.body;
  const { userId } = req.params;

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
router.delete('/cart/:userId/items/:productId', async (req, res) => {
    const { userId, productId } = req.params;
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
router.get('/cart/:userId/export', async (req, res) => {
    // Esta rota é idêntica à de leitura, mas demonstra a funcionalidade de exportação.
    const cart = await Cart.findOne({ userId: req.params.userId }).lean(); // .lean() para um objeto JS puro
    res.header('Content-Disposition', `attachment; filename="cart-${req.params.userId}.json"`);
    res.json(cart);
});

module.exports = router;