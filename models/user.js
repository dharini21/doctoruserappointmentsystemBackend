const mongoose = require("mongoose");
const Enum = require("../utils/enum");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  phoneNo: {
    type: Number,
  },
  softDel: {
    type: String,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
  role: { type: String, enum: [Enum.ROLES.ADMIN, Enum.ROLES.USER, Enum.ROLES.DOCTOR], default: Enum.ROLES.USER },
  appointments: [
    {
      doctorId: { type: mongoose.Types.ObjectId, ref: 'doctor' },
      date: { type: Date },
      time: { type: String },
      status: { type: String }
    }
  ]
});

module.exports = mongoose.model("user", userSchema);
