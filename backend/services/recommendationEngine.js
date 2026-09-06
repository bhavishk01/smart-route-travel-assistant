const touristPlaceService = require('./touristPlaceService');
const { haversineDistanceKm, getBoundingBox, getPointBoundingBox } = require('../utils/geoUtils');
const stayService = require('./stayService');

const BOUNDING_BOX_BUFFER_KM = 10;
const BASE_CORRIDOR_KM = 5;
const MAX_CORRIDOR_KM = 15;
const CORRIDOR_STEP_KM = 5;
const MIN_QUALITY_SCORE = 1;
const DESIRED_CANDIDATE_COUNT = 5;
const STAY_SEARCH_RADIUS_KM = 8;

function distanceFromRoute(placeLat, placeLng, routePoints) {
    let minDistance = Infinity;

    for (const [routeLat, routeLng] of routePoints) {
        const distance = haversineDistanceKm(placeLat, placeLng, routeLat, routeLng);
        if (distance < minDistance) {
            minDistance = distance;
        }
    }

    return minDistance;
}

function qualityScore(place) {
    return (place.verified ? 2 : 0) + place.tagRichness;
}

function rankPlaces(places) {
    return [...places].sort((a, b) => {
        const scoreA = a.distanceFromRouteKm - qualityScore(a) * 0.5;
        const scoreB = b.distanceFromRouteKm - qualityScore(b) * 0.5;
        return scoreA - scoreB;
    });
}

async function findNearbyPlaces(routePoints) {
    let radius = BASE_CORRIDOR_KM;
    let bestAttempt = [];

    while (radius <= MAX_CORRIDOR_KM) {
        const box = getBoundingBox(routePoints, BOUNDING_BOX_BUFFER_KM + radius);
        const candidates = await touristPlaceService.getCandidatePlaces(
            box.minLat,
            box.maxLat,
            box.minLng,
            box.maxLng
        );

        const withDistance = candidates.map((place) => {
            const [lng, lat] = place.location.coordinates;
            const distanceKm = distanceFromRoute(lat, lng, routePoints);

            return {
                placeId: place.placeId,
                name: place.name,
                category: place.category,
                rating: place.rating,
                verified: place.verified,
                tagRichness: place.tagRichness,
                latitude: lat,
                longitude: lng,
                distanceFromRouteKm: Number(distanceKm.toFixed(2)),
            };
        });

        const withinCorridor = withDistance.filter(
            (place) => place.distanceFromRouteKm <= radius
        );

        const qualified = withinCorridor.filter(
            (place) => qualityScore(place) >= MIN_QUALITY_SCORE
        );

        bestAttempt = withinCorridor;

        if (qualified.length >= DESIRED_CANDIDATE_COUNT) {
            return rankPlaces(qualified);
        }

        radius += CORRIDOR_STEP_KM;
    }

    return rankPlaces(bestAttempt);
}

async function findNearbyStays(destinationLat, destinationLng) {
    const box = getPointBoundingBox(destinationLat, destinationLng, STAY_SEARCH_RADIUS_KM);

    const candidates = await stayService.getCandidateStays(
        box.minLat,
        box.maxLat,
        box.minLng,
        box.maxLng
    );

    const withDistance = candidates.map((stay) => {
        const [lng, lat] = stay.location.coordinates;
        const distanceKm = haversineDistanceKm(lat, lng, destinationLat, destinationLng);

        return {
            stayId: stay.stayId,
            name: stay.name,
            type: stay.type,
            pricePerNight: stay.pricePerNight,
            rating: stay.rating,
            latitude: lat,
            longitude: lng,
            distanceFromDestinationKm: Number(distanceKm.toFixed(2)),
        };
    });

    const withinRadius = withDistance.filter(
        (stay) => stay.distanceFromDestinationKm <= STAY_SEARCH_RADIUS_KM
    );

    withinRadius.sort((a, b) => {
        const scoreA = a.distanceFromDestinationKm - a.rating * 0.5;
        const scoreB = b.distanceFromDestinationKm - b.rating * 0.5;
        return scoreA - scoreB;
    });

    return withinRadius;
}

module.exports = { findNearbyPlaces, findNearbyStays };