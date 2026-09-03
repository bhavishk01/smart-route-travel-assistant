const TouristKnowledgeBase = require('../models/TouristKnowledgeBase');

async function findByPlaceId(placeId) {
    return TouristKnowledgeBase.findOne({ placeId });
}

async function save(entry) {
    return TouristKnowledgeBase.updateOne(
        { placeId: entry.placeId },
        entry,
        { upsert: true }
    );
}

module.exports = { findByPlaceId, save };