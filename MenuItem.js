

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
  },
  imageUrl: {
    type: String,  // The Cloudinary URL of the uploaded image
    required: true // Ensuring that the image URL is saved
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
