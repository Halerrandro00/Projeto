const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productsData = require('./data/products');
const Product = require('./product');
const Cart = require('./cart');
const User = require('./user');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Conectado para o seeder...');
    } catch (err) {
        console.error(`Erro de conexão com MongoDB: ${err.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();

        // Limpa coleções
        await Product.deleteMany();
        await User.deleteMany();
        await Cart.deleteMany();

        // Cria usuário admin
        await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'adminpassword',
            isAdmin: true,
        });

        await Product.insertMany(productsData);

        console.log('Dados de produtos e usuário admin importados com sucesso!\nAdmin: admin@example.com / adminpassword');
        process.exit();
    } catch (error) {
        console.error(`Erro ao importar dados: ${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();

        await Product.deleteMany();
        await Cart.deleteMany();
        await User.deleteMany();

        console.log('Produtos, Carrinhos e Usuários removidos com sucesso!');
        process.exit();
    } catch (error) {
        console.error(`Erro ao destruir dados: ${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}