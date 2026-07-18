const mongoose = require('mongoose');
const Enum = require('../utils/enum.js');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNo: {
        type: Number,
    },
    password: {
        type: String
    },
    address: {
        type: String
    },
    role: { type: String, enum: [Enum.ROLES.ADMIN, Enum.ROLES.USER, Enum.ROLES.DOCTOR], default: Enum.ROLES.ADMIN },
})

module.exports = mongoose.model('admin', adminSchema)
