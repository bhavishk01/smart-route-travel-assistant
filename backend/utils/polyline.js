function decodePolyline(encoded) {
    let index = 0;
    let lat = 0;
    let lng = 0;
    const points = [];

    while (index < encoded.length) {
        let result = 1;
        let shift = 0;
        let byte;

        do {
            byte = encoded.charCodeAt(index++) - 63 - 1;
            result += byte << shift;
            shift += 5;
        } while (byte >= 0x1f);

        lat += (result & 1) ? ~(result >> 1) : (result >> 1);

        result = 1;
        shift = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63 - 1;
            result += byte << shift;
            shift += 5;
        } while (byte >= 0x1f);

        lng += (result & 1) ? ~(result >> 1) : (result >> 1);

        points.push([lat * 1e-5, lng * 1e-5]);
    }

    return points;
}

module.exports = { decodePolyline };