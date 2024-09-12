const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const StockSchema = new Schema({
  symbol: {
      type: String,
      unique: true
  },
  name: {
      type: String,
  },
  industry: {
    type: String,
  },
  exchange: {
      type: String,
  },
  exchangeShortName: {
      type: String,
  },
  type: {
      type: String,
  }
});



module.exports = mongoose.model('Stock', StockSchema);
