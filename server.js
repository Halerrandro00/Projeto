const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const apiRoutes = require('./api');

const app = express();
const PORT = process.env.PORT || 3001;

// Substitua pela sua string de conexão do MongoDB Atlas ou local
const MONGO_URI = 'mongodb://localhost:27017/shopping_cart_db';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middlewares
app.use(express.json()); // Para parsear JSON no corpo das requisições
app.use(express.static(__dirname)); // Servir arquivos estáticos (HTML, CSS, JS)

// Rotas da API
app.use('/api', apiRoutes);

// Rota principal para servir o frontend
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota raiz redireciona para o login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Rota para a página do carrinho
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

// Rota para a página de perfil
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

// Rota para a página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota para a página de registro
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});