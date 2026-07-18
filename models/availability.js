const mongoose = require('mongoose');
const availabilitySchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor'
    },
    slots: [{
        day: {
            type: String
        },
        date: {
            type: Date
        },
        time: {
            startTime: {
                type: String
            },
            endTime: {
                type: String
            }
        },
        availabilityCount: { type: Number, default: 0 },
        isAvailable: {
            type: Boolean
        }
    }]
})

module.exports = mongoose.model('Availability', availabilitySchema);
