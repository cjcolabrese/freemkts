const mongoose = require('mongoose')

const RateSchema = new mongoose.Schema({
  symbol: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  info: {
    type: String
  }

 
})

module.exports = mongoose.model('Rate', RateSchema, 'rates2')
