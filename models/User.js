// models/User.js
const mongoose = require('mongoose');
const stockSchema = require * ('/Stock');
const searchSchema = require * ('/Search');
const noteSchema = require * ('/Note');
const financialsSchema = require * ('/Financials');
const visitSchema = require*('./Visit')

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },

  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  stocks: [stockSchema],
  searches: [searchSchema],
  notes: [noteSchema],
  financials: [financialsSchema],
  visits: [visitSchema],

});

module.exports = mongoose.model('User', UserSchema);
