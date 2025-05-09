// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: String,
  amount: Number,
  currency: String,
  email: String,
  status: String,
  planId: String,
  date: { type: Date, default: Date.now },
  userId: {
    type: String,
    required: true,
  }
  
});

module.exports = mongoose.model('Transaction', transactionSchema);
