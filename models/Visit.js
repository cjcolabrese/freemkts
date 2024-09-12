const mongoose = require('mongoose');
var stockSchema= require('./Stock')
var searchSchema= require('./Search')
var userSchema = require('./User');
const Schema = mongoose.Schema;
const VisitSchema = new Schema({
    symbol: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: () => new Date().toLocaleDateString('en-US'),
        required: false,
    },
});
module.exports = mongoose.model('Visit', VisitSchema);