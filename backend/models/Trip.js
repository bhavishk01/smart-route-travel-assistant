const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    startLocation: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    tripDays: {
        type: Number,
        required: true,
        min: 1,
    },
    roundTrip: {
        type: Boolean,
        required: true,
    },
    numberOfTravellers: {
        type: Number,
        required: true,
        min: 1,
    },
    vehicleType: {
        type: String,
        required: true,
    },
    fuelType: {
        type: String,
        required: true,
        enum: ['petrol', 'diesel', 'cng', 'electric'],
    },
    mileage: {
        type: Number,
        required: true,
        min: 0.1,
    },
    fuelPrice: {
        type: Number,
        required: true,
        min: 0.1,
    },
    requiresStay: {
        type: Boolean,
        required: true,
    },
    route: {
        distance: Number,
        duration: Number,
        polyline: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Trip', tripSchema);