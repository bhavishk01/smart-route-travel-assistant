require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const TouristPlace = require('../models/TouristPlace');
const Stay = require('../models/Stay');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const touristPlacesRaw = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'tourist_places.json'), 'utf-8')
    );
    const staysRaw = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'stays.json'), 'utf-8')
    );

    let placesInserted = 0;
    let placesFailed = 0;

    for (const place of touristPlacesRaw) {
        try {
            await TouristPlace.updateOne(
                { placeId: place.placeId },
                {
                    placeId: place.placeId,
                    name: place.name,
                    category: place.category,
                    location: { type: 'Point', coordinates: [place.longitude, place.latitude] },
                    verified: place.verified,
                    tagRichness: place.tagRichness,
                },
                { upsert: true }
            );
            placesInserted++;
        } catch (error) {
            placesFailed++;
        }
    }

    let staysInserted = 0;
    let staysFailed = 0;

    for (const stay of staysRaw) {
        try {
            await Stay.updateOne(
                { stayId: stay.stayId },
                {
                    stayId: stay.stayId,
                    name: stay.name,
                    type: stay.type,
                    location: { type: 'Point', coordinates: [stay.longitude, stay.latitude] },
                    pricePerNight: stay.pricePerNight,
                },
                { upsert: true }
            );
            staysInserted++;
        } catch (error) {
            staysFailed++;
        }
    }

    console.log('Tourist places loaded:', placesInserted, 'failed:', placesFailed);
    console.log('Stays loaded:', staysInserted, 'failed:', staysFailed);

    await mongoose.disconnect();
}

run();