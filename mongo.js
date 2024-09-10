
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     firstName: {
//         type: String,
//         required: true,
//     },
//     lastName: {
//         type: String,
//         required: true,
//     },
//     rollNo: {
//         type: String,
//         required: true,
//         unique: true, // Roll number should be unique
//     },
//     instituteName: {
//         type: String,
//         required: true,
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true, // Email should be unique
//     },
//     password: {
//         type: String,
//         required: true,
//     },
//     uniqueID: {
//         type: Number,
//         required: true, // No unique constraint here
//     }
// });

// const collection = mongoose.model('collection', userSchema);

// module.exports = collection;
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
        unique: true,
    },
    instituteName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    uniqueID: {
        type: Number,
        required: true,
    },
    otp: {
        type: String,
        required: false, // Optional field to temporarily store the OTP
    },
    otpExpiry: {
        type: Date,
        required: false, // Optional field to store the expiration time of the OTP
    }
});

const collection = mongoose.model('collection', userSchema);

module.exports = collection;
