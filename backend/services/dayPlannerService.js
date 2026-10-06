const { kmeans } = require('ml-kmeans');

function clusterPlacesByDay(places, tripDays) {
    if (!tripDays || tripDays <= 1 || places.length <= 1) {
        return null;
    }

    const k = Math.min(tripDays, places.length);

    const lats = places.map((place) => place.latitude);
    const lngs = places.map((place) => place.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const normalize = (value, min, max) => (max === min ? 0 : (value - min) / (max - min));

    const vectors = places.map((place) => [
        normalize(place.latitude, minLat, maxLat),
        normalize(place.longitude, minLng, maxLng),
    ]);

    const result = kmeans(vectors, k, { seed: 42 });

    const groups = {};
    places.forEach((place, index) => {
        const clusterId = result.clusters[index];
        if (!groups[clusterId]) {
            groups[clusterId] = [];
        }
        groups[clusterId].push(place);
    });

    const dayGroups = Object.values(groups).map((groupPlaces) => {
        const avgProgress = groupPlaces.reduce((sum, p) => sum + p.progressKm, 0) / groupPlaces.length;
        const sortedPlaces = [...groupPlaces].sort((a, b) => a.progressKm - b.progressKm);
        return { avgProgress, places: sortedPlaces };
    });

    dayGroups.sort((a, b) => a.avgProgress - b.avgProgress);

    return dayGroups.map((group, index) => ({
        day: index + 1,
        places: group.places.map((place) => ({
            placeId: place.placeId,
            name: place.name,
            category: place.category,
            progressKm: place.progressKm,
        })),
    }));
}

module.exports = { clusterPlacesByDay };