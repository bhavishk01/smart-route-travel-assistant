const touristPlaceRepository = require('../repositories/touristPlaceRepository');

async function getCandidatePlaces(minLat, maxLat, minLng, maxLng) {
    return touristPlaceRepository.findPlacesInBoundingBox(minLat, maxLat, minLng, maxLng);
}

module.exports = { getCandidatePlaces };