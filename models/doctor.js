const mongoose = require('mongoose')
const Enum = require('../utils/enum.js')
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  phoneNo: {
    type: String,
  },
  email: {
    unique: true,
    type: String,
  },
  hospitalName: {
    type: String
  },
  specialist: {
    type: String
  },
  experience: {
    type: Number
  },
  password: {
    type: String,
  },
  role: { type: String, enum: [Enum.ROLES.ADMIN, Enum.ROLES.USER, Enum.ROLES.DOCTOR], default: Enum.ROLES.DOCTOR },
  address: {
    location: {
      type: String
    }
  },
  userAppointments: [
    {
      userId: { type: mongoose.Types.ObjectId, ref: 'user' },
      date: { type: Date },
      time: { type: String },
      status: { type: String }
    }
  ],
  userRatings: [
    {
      appointmentId: { type: mongoose.Types.ObjectId, ref: 'appointment' },
      userId: { type: mongoose.Types.ObjectId, ref: 'user' },
      rating: { type: Number },
      review: { type: String }
    }
  ]
})
module.exports = mongoose.model('doctor', doctorSchema)