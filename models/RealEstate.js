const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RealEstateSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    item: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

const RealEstate = mongoose.model('RealEstate', RealEstateSchema, 'realestate');
module.exports = RealEstate;
