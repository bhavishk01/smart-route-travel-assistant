function calculateFuelCost(distanceMeters, roundTrip, mileage, fuelPrice) {
    const distanceKm = distanceMeters / 1000;
    const totalDistanceKm = roundTrip ? distanceKm * 2 : distanceKm;
    const litresNeeded = totalDistanceKm / mileage;
    return litresNeeded * fuelPrice;
}

function calculateStayCost(requiresStay, recommendedStays, tripDays) {
    if (!requiresStay || recommendedStays.length === 0) {
        return 0;
    }

    const cheapestStay = recommendedStays.reduce((cheapest, stay) =>
        stay.pricePerNight < cheapest.pricePerNight ? stay : cheapest
    );

    return cheapestStay.pricePerNight * tripDays;
}

function calculateCost(tripDetails, route, recommendedStays) {
    const fuelCost = calculateFuelCost(
        route.distanceMeters,
        tripDetails.roundTrip,
        tripDetails.mileage,
        tripDetails.fuelPrice
    );

    const stayCost = calculateStayCost(
        tripDetails.requiresStay,
        recommendedStays,
        tripDetails.tripDays
    );

    const totalCost = fuelCost + stayCost;
    const costPerPerson = totalCost / tripDetails.numberOfTravellers;

    return {
        estimatedFuelCost: Number(fuelCost.toFixed(2)),
        estimatedStayCost: Number(stayCost.toFixed(2)),
        estimatedTotalCost: Number(totalCost.toFixed(2)),
        estimatedCostPerPerson: Number(costPerPerson.toFixed(2)),
        note: 'Costs are estimates based on the fuel price and stay rates you provided/found, and may vary with real-time changes.',
    };
}

module.exports = { calculateCost };