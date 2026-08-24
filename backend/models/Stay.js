const mongoose = require('mongoose');

const staySchema = new mongoose.Schema({
    stayId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    pricePerNight: {
        type: Number,
        required: true,
        min: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
});

staySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Stay', staySchema);