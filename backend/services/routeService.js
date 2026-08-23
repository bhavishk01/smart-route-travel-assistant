async function getRoute(origin, destination) {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
            origin: { address: origin },
            destination: { address: destination },
            travelMode: 'DRIVE',
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Route request failed');
    }

    if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found between the given locations');
    }

    const route = data.routes[0];

    return {
        distanceMeters: route.distanceMeters,
        durationSeconds: parseInt(route.duration, 10),
        polyline: route.polyline.encodedPolyline,
    };
}

module.exports = { getRoute };