const routeService = require('./routeService');
const recommendationEngine = require('./recommendationEngine');
const { decodePolyline } = require('../utils/polyline');

async function planTrip(tripDetails) {
    const route = await routeService.getRoute(tripDetails.startLocation, tripDetails.destination);

    const routePoints = decodePolyline(route.polyline);

    const recommendedPlaces = await recommendationEngine.findNearbyPlaces(routePoints);

    let recommendedStays = [];

    if (tripDetails.requiresStay) {
        const [destinationLat, destinationLng] = routePoints[routePoints.length - 1];
        recommendedStays = await recommendationEngine.findNearbyStays(destinationLat, destinationLng);
    }

    return {
        trip: tripDetails,
        route,
        recommendedPlaces,
        recommendedStays,
    };
}

module.exports = { planTrip };