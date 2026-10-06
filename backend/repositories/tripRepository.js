const Trip = require('../models/Trip');

async function saveTrip(tripData) {
    return Trip.create(tripData);
}

async function findTripsByUser(userId) {
    return Trip.find({ userId })
        .select('startLocation destination tripDays roundTrip createdAt route cost')
        .sort({ createdAt: -1 });
}

async function findTripByIdAndUser(tripId, userId) {
    return Trip.findOne({ _id: tripId, userId });
}

module.exports = { saveTrip, findTripsByUser, findTripByIdAndUser };