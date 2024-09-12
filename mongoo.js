

// const mongoose = require('mongoose');

// // Define a schema for user data
// const userSchema = new mongoose.Schema({
//   firstName: {
//     type: String,
//     required: true
//   },
//   lastName: {
//     type: String,
//     required: true
//   },
//   instituteName: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true // Make email unique
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   uniqueID: {
//     type: Number,
//     required: true,
//     unique: true // Make uniqueID unique
//   }
// });

// // Create a model using the schema
// const User = mongoose.model('admin', userSchema);

// module.exports = User;
const mongoose = require('mongoose');

// Define a schema for user data
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  instituteName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  uniqueID: {
    type: Number,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: false
  },
  otpExpires: {
    type: Date,
    required: false
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

// Create a model using the schema
const User = mongoose.model('admin', userSchema);

module.exports = User;
