// models/StockByIndustry.js
const mongoose = require('mongoose');

const stockByIndustrySchema = new mongoose.Schema({
    Symbol: { type: String, required: true },
    name: { type: String, required: true },
    industry: { type: String, required: true }
});

const StockByIndustry = mongoose.model('StockByIndustry', stockByIndustrySchema, 'stocks-and-industries');

module.exports = StockByIndustry;
