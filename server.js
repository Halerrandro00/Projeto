const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const apiRoutes = require('./api');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERRO: A variável de ambiente MONGO_URI não está definida no arquivo .env');
  console.error('Por favor, crie um arquivo .env na raiz do projeto e adicione: MONGO_URI=sua_string_de_conexao_mongodb');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
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

// Rota para a página de admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
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