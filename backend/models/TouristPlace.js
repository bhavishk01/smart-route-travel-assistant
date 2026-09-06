const mongoose = require('mongoose');

const touristPlaceSchema = new mongoose.Schema({
    placeId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    category: {
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
    rating: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        default: '',
    },
    verified: {
        type: Boolean,
        default: false,
    },
    tagRichness: {
        type: Number,
        default: 0,
    },
});

touristPlaceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('TouristPlace', touristPlaceSchema);