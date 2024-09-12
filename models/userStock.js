const mongoose = require('mongoose');

const userStocksSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  stocks: [{
    type: mongoose.Schema.Types.ObjectId,
    name: String,
    ref: 'Stock'
  }]
});

const UserStocks = mongoose.model('UserStocks', userStocksSchema);

module.exports = UserStocks;