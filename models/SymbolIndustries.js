const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema({
    industry: { type: String, required: true },
    description: { type: String, required: true }
});

const Industries = mongoose.model('Industries', industrySchema, 'stocksindustries');

module.exports = Industries