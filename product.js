const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  imageUrl: { type: String }
});

// Criando um índice no campo 'name' para buscas mais rápidas
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);