const mongoose = require('mongoose');

const studentOrderSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },

  rollNo: {
    type: String,
    required: true,
  },
  orders: [
    {
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
    },
],
      uniqueID: {
      type: Number,
      required: true
    },
  totalPrice: {
    type: Number,
    required: true,
  }
});

const StudentOrder = mongoose.model('StudentOrder', studentOrderSchema);

module.exports = StudentOrder;
