

const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  availableQuantity: {
    type: Number,
    required: true
  },
  uniqueID: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
