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

if (!MONGO_URI.startsWith('mongodb://') && !MONGO_URI.startsWith('mongodb+srv://')) {
  console.error('ERRO: A variável de ambiente MONGO_URI parece estar em um formato inválido.');
  console.error('Ela deve começar com "mongodb://" ou "mongodb+srv://".');
  console.error('Verifique seu arquivo .env.');
  process.exit(1);
}

// Middlewares
app.use(express.json()); // Para parsear JSON no corpo das requisições
app.use(express.static(__dirname)); // Servir arquivos estáticos (HTML, CSS, JS)

// Rotas da API
app.use('/api', apiRoutes);

// --- ROTAS PARA SERVIR PÁGINAS HTML ---

// Rota raiz redireciona para o login
app.get('/', (req, res) => {
  res.redirect('/products');
});

// Mapeia rotas para seus respectivos arquivos HTML
const pages = {
  products: 'index.html', // A rota /products serve o index.html
  cart: 'cart.html',
  checkout: 'checkout.html',
  'order-success': 'order-success.html',
  profile: 'profile.html',
  admin: 'admin.html',
  dashboard: 'dashboard.html',
  users: 'users.html',
  orders: 'orders.html',
  login: 'login.html',
  register: 'register.html',
};

Object.keys(pages).forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, pages[page]));
  });
});

// Função para iniciar o servidor após a conexão com o banco de dados
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);

    // Adiciona uma dica específica para o erro de autenticação
    if (err.name === 'MongoServerError' && err.code === 8000) {
      console.error('\n[DICA] O erro "bad auth : authentication failed" indica que o usuário ou a senha no seu arquivo .env estão incorretos.');
      console.error('Por favor, verifique se a senha está correta, sem os caracteres "<" e ">", e se o seu IP está liberado no MongoDB Atlas.\n');
    }

    process.exit(1); // Encerra o processo se a conexão com o DB falhar
  }
};

startServer();