const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: Number
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [itemSchema],
  updatedAt: { type: Date, default: Date.now }
});

cartSchema.index({ userId: 1 }); // Índice para buscar carrinhos por usuário rapidamente.

module.exports = mongoose.model('Cart', cartSchema);