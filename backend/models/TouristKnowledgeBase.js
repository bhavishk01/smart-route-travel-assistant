const mongoose = require('mongoose');

const touristKnowledgeSchema = new mongoose.Schema({
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
    },
    history: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    travelTips: {
        type: String,
        default: '',
    },
    bestVisitingTime: {
        type: String,
        default: '',
    },
    embedding: {
        type: [Number],
        default: [],
    },
}, { timestamps: true });

module.exports = mongoose.model('TouristKnowledgeBase', touristKnowledgeSchema);