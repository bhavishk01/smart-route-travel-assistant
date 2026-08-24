const stayRepository = require('../repositories/stayRepository');

async function getCandidateStays(minLat, maxLat, minLng, maxLng) {
    return stayRepository.findStaysInBoundingBox(minLat, maxLat, minLng, maxLng);
}

module.exports = { getCandidateStays };