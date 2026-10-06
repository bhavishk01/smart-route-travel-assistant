const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    startLocation: { type: String, required: true },
    destination: { type: String, required: true },
    tripDays: { type: Number, required: true, min: 1 },
    roundTrip: { type: Boolean, required: true },
    numberOfTravellers: { type: Number, required: true, min: 1 },
    vehicleType: { type: String, required: true },
    fuelType: { type: String, required: true },
    mileage: { type: Number, required: true, min: 0.1 },
    fuelPrice: { type: Number, required: true, min: 0.1 },
    requiresStay: { type: Boolean, required: true },
    availableTimeHours: { type: Number },
    route: { type: mongoose.Schema.Types.Mixed },
    recommendedPlaces: { type: mongoose.Schema.Types.Mixed },
    recommendedStays: { type: mongoose.Schema.Types.Mixed },
    cost: { type: mongoose.Schema.Types.Mixed },
    itinerary: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);