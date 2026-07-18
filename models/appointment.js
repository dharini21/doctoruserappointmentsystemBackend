const mongoose = require('mongoose');
const Enum = require('./../utils/enum.js')
const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor'
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    day: {
        type: String,
        enum: [Enum.DAY.MONDAY, Enum.DAY.TUESDAY, Enum.DAY.WEDNESDAY, Enum.DAY.THURSDAY, Enum.DAY.FRIDAY, Enum.DAY.SATURDAY, Enum.DAY.SUNDAY],
    },
    date: {
        type: Date,
    },
    time: {
        type: String,
    },
    status: {
        type: String,
        enum: [Enum.STATUS.SCHEDULED, Enum.STATUS.COMPLETED, Enum.STATUS.REJECTED, Enum.STATUS.ACCEPTED],
        default: 'SCHEDULED'
    },
    reason: {
        type: String,
    }
},
    { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
