const TouristPlace = require('../models/TouristPlace');

async function findPlacesInBoundingBox(minLat, maxLat, minLng, maxLng) {
    return TouristPlace.find({
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

module.exports = { findPlacesInBoundingBox };