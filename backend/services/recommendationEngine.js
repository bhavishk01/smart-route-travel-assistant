const touristPlaceService = require('./touristPlaceService');
const { haversineDistanceKm, getBoundingBox, getPointBoundingBox } = require('../utils/geoUtils');
const stayService = require('./stayService');

const CORRIDOR_RADIUS_KM = 5;
const BOUNDING_BOX_BUFFER_KM = 10;

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

async function findNearbyPlaces(routePoints) {
    const box = getBoundingBox(routePoints, BOUNDING_BOX_BUFFER_KM);

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
            latitude: lat,
            longitude: lng,
            distanceFromRouteKm: Number(distanceKm.toFixed(2)),
        };
    });

    const withinCorridor = withDistance.filter(
        (place) => place.distanceFromRouteKm <= CORRIDOR_RADIUS_KM
    );

    withinCorridor.sort((a, b) => {
        const scoreA = a.distanceFromRouteKm - a.rating * 0.5;
        const scoreB = b.distanceFromRouteKm - b.rating * 0.5;
        return scoreA - scoreB;
    });

    return withinCorridor;
}

const STAY_SEARCH_RADIUS_KM = 8;

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