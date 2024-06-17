const mongoose = require('mongoose');

// Define a schema for item requests
const itemRequestSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  rollNo: String,
  uniqueID: Number,
  mealType: String,
  itemName: String,
  requestDate: { type: Date, default: Date.now }
});

const ItemRequest = mongoose.model('ItemRequest', itemRequestSchema);

module.exports = ItemRequest;