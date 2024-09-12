const mongoose = require('mongoose');
var stockSchema= require('./Stock')
var searchSchema= require('./Search')
const Schema = mongoose.Schema;
const NoteSchema = new Schema({
    symbol: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'public',
      enum: ['public', 'private'],
    },
    createdAt: {
      type: Date,
        default: () => new Date().toLocaleDateString('en-US'),
    },
  });
  module.exports = mongoose.model('Note', NoteSchema);