const touristPlaceService = require('./touristPlaceService');
const { haversineDistanceKm, getBoundingBox, getPointBoundingBox } = require('../utils/geoUtils');
const stayService = require('./stayService');

const BOUNDING_BOX_BUFFER_KM = 10;
const BASE_CORRIDOR_KM = 5;
const MAX_CORRIDOR_KM = 15;
const CORRIDOR_STEP_KM = 5;
const DESIRED_CANDIDATE_COUNT = 8;
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

function computeCumulativeDistances(routePoints) {
    const cumulative = [0];
    for (let i = 1; i < routePoints.length; i++) {
        const [lat1, lng1] = routePoints[i - 1];
        const [lat2, lng2] = routePoints[i];
        const segmentDistance = haversineDistanceKm(lat1, lng1, lat2, lng2);
        cumulative.push(cumulative[i - 1] + segmentDistance);
    }
    return cumulative;
}

function distanceFromRouteWithProgress(placeLat, placeLng, routePoints, cumulativeDistances) {
    let minDistance = Infinity;
    let closestIndex = 0;

    routePoints.forEach(([routeLat, routeLng], index) => {
        const distance = haversineDistanceKm(placeLat, placeLng, routeLat, routeLng);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
    });

    return {
        distanceFromRouteKm: minDistance,
        progressKm: cumulativeDistances[closestIndex],
    };
}

function calculateDetour(originLat, originLng, destLat, destLng, placeLat, placeLng) {
    const directDistance = haversineDistanceKm(originLat, originLng, destLat, destLng);
    const toPlaceDistance = haversineDistanceKm(originLat, originLng, placeLat, placeLng);
    const fromPlaceDistance = haversineDistanceKm(placeLat, placeLng, destLat, destLng);

    const detourKm = toPlaceDistance + fromPlaceDistance - directDistance;
    const deviationPercent = directDistance === 0 ? 0 : (detourKm / directDistance) * 100;

    return {
        detourKm: Number(Math.max(detourKm, 0).toFixed(2)),
        deviationPercent: Number(Math.max(deviationPercent, 0).toFixed(1)),
    };
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

function spreadAlongRoute(places, desiredCount, totalRouteKm) {
    if (totalRouteKm === 0 || places.length <= desiredCount) {
        return [...places].sort((a, b) => a.progressKm - b.progressKm);
    }

    const numSegments = desiredCount;
    const segmentLength = totalRouteKm / numSegments;
    const segments = Array.from({ length: numSegments }, () => []);

    places.forEach((place) => {
        let segmentIndex = Math.floor(place.progressKm / segmentLength);
        if (segmentIndex >= numSegments) segmentIndex = numSegments - 1;
        if (segmentIndex < 0) segmentIndex = 0;
        segments[segmentIndex].push(place);
    });

    segments.forEach((segmentPlaces) => {
        segmentPlaces.sort((a, b) => {
            const scoreA = a.distanceFromRouteKm - qualityScore(a) * 0.5;
            const scoreB = b.distanceFromRouteKm - qualityScore(b) * 0.5;
            return scoreA - scoreB;
        });
    });

    const chosen = [];
    const chosenIds = new Set();

    segments.forEach((segmentPlaces) => {
        if (segmentPlaces.length > 0) {
            chosen.push(segmentPlaces[0]);
            chosenIds.add(segmentPlaces[0].placeId);
        }
    });

    let round = 1;
    while (chosen.length < desiredCount && round < 10) {
        let addedThisRound = false;

        for (const segmentPlaces of segments) {
            if (chosen.length >= desiredCount) break;
            const candidate = segmentPlaces[round];
            if (candidate && !chosenIds.has(candidate.placeId)) {
                chosen.push(candidate);
                chosenIds.add(candidate.placeId);
                addedThisRound = true;
            }
        }

        if (!addedThisRound) break;
        round++;
    }

    if (chosen.length < desiredCount) {
        const remaining = rankPlaces(places.filter((place) => !chosenIds.has(place.placeId)));
        for (const place of remaining) {
            if (chosen.length >= desiredCount) break;
            chosen.push(place);
        }
    }

    return chosen.sort((a, b) => a.progressKm - b.progressKm);
}

function generateExplanation(place) {
    const reasons = [];

    if (place.distanceFromRouteKm <= 0.5) {
        reasons.push("it's right along your route, barely any detour needed");
    } else {
        reasons.push(`it's a short detour of about ${place.detourKm} km off your route`);
    }

    if (place.verified) {
        reasons.push('it\'s a well-known spot with plenty of verified information');
    } else if (place.tagRichness >= 2) {
        reasons.push('we have good details about it to help you plan your visit');
    } else {
        reasons.push('it looks like a hidden gem, with less online info but potentially a great find');
    }

    return {
        summary: `We picked this because ${reasons.join(', and ')}.`,
        factors: {
            distanceFromRouteKm: place.distanceFromRouteKm,
            detourKm: place.detourKm,
            verified: place.verified,
            tagRichness: place.tagRichness,
            qualityScore: (place.verified ? 2 : 0) + place.tagRichness,
        },
    };
}

async function findNearbyPlaces(routePoints) {
    const cumulativeDistances = computeCumulativeDistances(routePoints);
    const totalRouteKm = cumulativeDistances[cumulativeDistances.length - 1];

    const [originLat, originLng] = routePoints[0];
    const [destLat, destLng] = routePoints[routePoints.length - 1];

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
            const { distanceFromRouteKm, progressKm } = distanceFromRouteWithProgress(
                lat,
                lng,
                routePoints,
                cumulativeDistances
            );
            const { detourKm, deviationPercent } = calculateDetour(
                originLat,
                originLng,
                destLat,
                destLng,
                lat,
                lng
            );

            return {
                placeId: place.placeId,
                name: place.name,
                category: place.category,
                rating: place.rating,
                verified: place.verified,
                tagRichness: place.tagRichness,
                latitude: lat,
                longitude: lng,
                distanceFromRouteKm: Number(distanceFromRouteKm.toFixed(2)),
                progressKm: Number(progressKm.toFixed(2)),
                detourKm,
                deviationPercent,
            };
        });

        const withinCorridor = withDistance.filter((place) => place.distanceFromRouteKm <= radius);
        bestAttempt = withinCorridor;

        if (withinCorridor.length >= DESIRED_CANDIDATE_COUNT) {
            const selected = spreadAlongRoute(withinCorridor, DESIRED_CANDIDATE_COUNT, totalRouteKm);
            return selected.map((place) => ({ ...place, explanation: generateExplanation(place) }));
        }

        radius += CORRIDOR_STEP_KM;
    }

    const selected = spreadAlongRoute(bestAttempt, DESIRED_CANDIDATE_COUNT, totalRouteKm);
    return selected.map((place) => ({ ...place, explanation: generateExplanation(place) }));
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