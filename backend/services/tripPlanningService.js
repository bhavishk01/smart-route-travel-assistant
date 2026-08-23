const routeService = require('./routeService');

async function planTrip(tripDetails) {
    const route = await routeService.getRoute(tripDetails.startLocation, tripDetails.destination);

    return {
        trip: tripDetails,
        route,
    };
}

module.exports = { planTrip };