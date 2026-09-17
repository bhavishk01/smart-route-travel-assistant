const routeService = require('./routeService');
const recommendationEngine = require('./recommendationEngine');
const costService = require('./costService');
const aiService = require('./aiService');
const { decodePolyline } = require('../utils/polyline');
const itineraryOptimizerService = require('./itineraryOptimizerService');

async function planTrip(tripDetails) {
    const route = await routeService.getRoute(tripDetails.startLocation, tripDetails.destination);

    const routePoints = decodePolyline(route.polyline);

    const recommendedPlaces = await recommendationEngine.findNearbyPlaces(routePoints);

    let recommendedStays = [];

    if (tripDetails.requiresStay) {
        const [destinationLat, destinationLng] = routePoints[routePoints.length - 1];
        recommendedStays = await recommendationEngine.findNearbyStays(destinationLat, destinationLng);
    }

    const cost = costService.calculateCost(tripDetails, route, recommendedStays);

    let placesWithAiInfo = recommendedPlaces;

    try {
        placesWithAiInfo = await aiService.generateTouristInfo(recommendedPlaces, tripDetails.destination);
    } catch (error) {
        console.error('AI Service failed:', error.message, error.cause || '');
        placesWithAiInfo = recommendedPlaces;
    }

    let itinerary = null;

    if (tripDetails.availableTimeHours && tripDetails.availableTimeHours > 0) {
        itinerary = itineraryOptimizerService.optimizeItinerary(
            placesWithAiInfo,
            Math.round(tripDetails.availableTimeHours * 60)
        );
    }

    return {
        trip: tripDetails,
        route,
        recommendedPlaces: placesWithAiInfo,
        recommendedStays,
        cost,
        itinerary,
    };
}

module.exports = { planTrip };