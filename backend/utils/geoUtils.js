function haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function getBoundingBox(routePoints, bufferKm) {
    const lats = routePoints.map((point) => point[0]);
    const lngs = routePoints.map((point) => point[1]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latBuffer = bufferKm / 111;
    const avgLat = (minLat + maxLat) / 2;
    const lngBuffer = bufferKm / (111 * Math.cos((avgLat * Math.PI) / 180));

    return {
        minLat: minLat - latBuffer,
        maxLat: maxLat + latBuffer,
        minLng: minLng - lngBuffer,
        maxLng: maxLng + lngBuffer,
    };
}

function getPointBoundingBox(lat, lng, bufferKm) {
    const latBuffer = bufferKm / 111;
    const lngBuffer = bufferKm / (111 * Math.cos((lat * Math.PI) / 180));

    return {
        minLat: lat - latBuffer,
        maxLat: lat + latBuffer,
        minLng: lng - lngBuffer,
        maxLng: lng + lngBuffer,
    };
}

module.exports = { haversineDistanceKm, getBoundingBox, getPointBoundingBox };