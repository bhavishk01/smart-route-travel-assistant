const Stay = require('../models/Stay');

async function findStaysInBoundingBox(minLat, maxLat, minLng, maxLng) {
    return Stay.find({
        location: {
            $geoWithin: {
                $box: [
                    [minLng, minLat],
                    [maxLng, maxLat],
                ],
            },
        },
    });
}

module.exports = { findStaysInBoundingBox };