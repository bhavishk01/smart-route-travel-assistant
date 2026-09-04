async function getSummary(placeName, locationHint) {
    const query = locationHint ? `${placeName}, ${locationHint}` : placeName;

    try {
        const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
            {
                headers: {
                    'User-Agent': 'SmartTravelAssistant-StudentProject/1.0',
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.type === 'disambiguation') {
            return null;
        }

        return data.extract || null;
    } catch (error) {
        return null;
    }
}

module.exports = { getSummary };