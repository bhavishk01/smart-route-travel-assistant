const tripPlanningService = require('../services/tripPlanningService');

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
        res.json({ status: 'ok', ...result });
    } catch (error) {
        res.status(502).json({ status: 'error', message: error.message });
    }
}

module.exports = { planTrip };