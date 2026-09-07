const touristPlaceService = require('./touristPlaceService');
const { haversineDistanceKm, getBoundingBox, getPointBoundingBox } = require('../utils/geoUtils');
const stayService = require('./stayService');
const { kmeans } = require('ml-kmeans');

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

function diversifyByCluster(places, desiredCount) {
    if (places.length <= desiredCount) {
        return places;
    }

    const categories = [...new Set(places.map((place) => place.category))];

    const lats = places.map((place) => place.latitude);
    const lngs = places.map((place) => place.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const normalize = (value, min, max) => (max === min ? 0 : (value - min) / (max - min));

    const vectors = places.map((place) => {
        const categoryVector = categories.map((cat) => (place.category === cat ? 1 : 0));
        return [
            normalize(place.latitude, minLat, maxLat),
            normalize(place.longitude, minLng, maxLng),
            ...categoryVector,
        ];
    });

    const k = Math.min(desiredCount, places.length);
    const result = kmeans(vectors, k, { seed: 42 });

    const clusterGroups = {};
    places.forEach((place, index) => {
        const clusterId = result.clusters[index];
        if (!clusterGroups[clusterId]) {
            clusterGroups[clusterId] = [];
        }
        clusterGroups[clusterId].push(place);
    });

    const representatives = Object.values(clusterGroups).map((group) =>
        group.reduce((closest, place) =>
            place.distanceFromRouteKm < closest.distanceFromRouteKm ? place : closest
        )
    );

    return representatives.sort((a, b) => a.distanceFromRouteKm - b.distanceFromRouteKm);
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
            console.log(`Clustering input: ${qualified.length} qualified places`);
            return diversifyByCluster(rankPlaces(qualified), DESIRED_CANDIDATE_COUNT);
        }

        radius += CORRIDOR_STEP_KM;
    }

    console.log(`Clustering input: ${bestAttempt.length} places (fallback)`);
    return diversifyByCluster(rankPlaces(bestAttempt), DESIRED_CANDIDATE_COUNT);
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