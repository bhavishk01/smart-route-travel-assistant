const tripPlanningService = require('../services/tripPlanningService');
const tripRepository = require('../repositories/tripRepository');

function validateTripInput(body) {
    const errors = [];

    if (!body.startLocation || typeof body.startLocation !== 'string') {
        errors.push('startLocation is required');
    }
    if (!body.destination || typeof body.destination !== 'string') {
        errors.push('destination is required');
    }
    if (!body.tripDays || body.tripDays < 1) {
        errors.push('tripDays must be at least 1');
    }
    if (typeof body.roundTrip !== 'boolean') {
        errors.push('roundTrip must be true or false');
    }
    if (!body.numberOfTravellers || body.numberOfTravellers < 1) {
        errors.push('numberOfTravellers must be at least 1');
    }
    if (!body.vehicleType || typeof body.vehicleType !== 'string') {
        errors.push('vehicleType is required');
    }
    const validFuelTypes = ['petrol', 'diesel', 'cng', 'electric'];
    if (!body.fuelType || !validFuelTypes.includes(body.fuelType)) {
        errors.push('fuelType must be one of: petrol, diesel, cng, electric');
    }
    if (!body.mileage || body.mileage <= 0) {
        errors.push('mileage must be greater than 0');
    }
    if (!body.fuelPrice || body.fuelPrice <= 0) {
        errors.push('fuelPrice must be greater than 0');
    }
    if (typeof body.requiresStay !== 'boolean') {
        errors.push('requiresStay must be true or false');
    }

    return errors;
}

async function planTrip(req, res) {
    const errors = validateTripInput(req.body);

    if (errors.length > 0) {
        return res.status(400).json({ status: 'error', errors });
    }

    try {
        const result = await tripPlanningService.planTrip(req.body);

        const savedTrip = await tripRepository.saveTrip({
            userId: req.userId,
            startLocation: req.body.startLocation,
            destination: req.body.destination,
            tripDays: req.body.tripDays,
            roundTrip: req.body.roundTrip,
            numberOfTravellers: req.body.numberOfTravellers,
            vehicleType: req.body.vehicleType,
            fuelType: req.body.fuelType,
            mileage: req.body.mileage,
            fuelPrice: req.body.fuelPrice,
            requiresStay: req.body.requiresStay,
            availableTimeHours: req.body.availableTimeHours,
            route: result.route,
            recommendedPlaces: result.recommendedPlaces,
            recommendedStays: result.recommendedStays,
            cost: result.cost,
            itinerary: result.itinerary,
            dayPlan: result.dayPlan,
        });

        res.json({ status: 'ok', tripId: savedTrip._id, ...result });
    } catch (error) {
        res.status(502).json({ status: 'error', message: error.message });
    }
}

async function getHistory(req, res) {
    try {
        const trips = await tripRepository.findTripsByUser(req.userId);
        res.json({ status: 'ok', trips });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function getHistoryDetail(req, res) {
    try {
        const trip = await tripRepository.findTripByIdAndUser(req.params.id, req.userId);

        if (!trip) {
            return res.status(404).json({ status: 'error', message: 'Trip not found' });
        }

        res.json({
            status: 'ok',
            trip: {
                startLocation: trip.startLocation,
                destination: trip.destination,
                tripDays: trip.tripDays,
                roundTrip: trip.roundTrip,
                numberOfTravellers: trip.numberOfTravellers,
                vehicleType: trip.vehicleType,
                fuelType: trip.fuelType,
                mileage: trip.mileage,
                fuelPrice: trip.fuelPrice,
                requiresStay: trip.requiresStay,
            },
            route: trip.route,
            recommendedPlaces: trip.recommendedPlaces,
            recommendedStays: trip.recommendedStays,
            cost: trip.cost,
            itinerary: trip.itinerary,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = { planTrip, getHistory, getHistoryDetail };