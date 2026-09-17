const VISIT_TIME_MINUTES = {
    Museum: 60,
    Gallery: 45,
    Viewpoint: 20,
    Zoo: 90,
    'Theme Park': 120,
    Attraction: 45,
    'Historic Site': 30,
    Artwork: 10,
};

const DEFAULT_VISIT_TIME_MINUTES = 30;
const ASSUMED_DETOUR_SPEED_KMH = 30;

function estimateTimeCost(place) {
    const visitTime = VISIT_TIME_MINUTES[place.category] || DEFAULT_VISIT_TIME_MINUTES;
    const detourTime = (place.detourKm / ASSUMED_DETOUR_SPEED_KMH) * 60;
    return Math.round(visitTime + detourTime);
}

function estimateValue(place) {
    const qualityBonus = (place.verified ? 2 : 0) + place.tagRichness;
    return 1 + qualityBonus;
}

function optimizeItinerary(places, timeBudgetMinutes) {
    const items = places.map((place) => ({
        place,
        timeCost: estimateTimeCost(place),
        value: estimateValue(place),
    }));

    const n = items.length;
    let bestValue = -1;
    let bestSubset = [];

    const totalCombinations = 1 << n;

    for (let mask = 0; mask < totalCombinations; mask++) {
        let totalTime = 0;
        let totalValue = 0;
        const subset = [];

        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                totalTime += items[i].timeCost;
                totalValue += items[i].value;
                subset.push(items[i]);
            }
        }

        if (totalTime <= timeBudgetMinutes && totalValue > bestValue) {
            bestValue = totalValue;
            bestSubset = subset;
        }
    }

    return {
        selectedPlaces: bestSubset.map((item) => ({
            placeId: item.place.placeId,
            name: item.place.name,
            category: item.place.category,
            estimatedVisitMinutes: VISIT_TIME_MINUTES[item.place.category] || DEFAULT_VISIT_TIME_MINUTES,
            estimatedDetourMinutes: Math.round((item.place.detourKm / ASSUMED_DETOUR_SPEED_KMH) * 60),
            totalTimeMinutes: item.timeCost,
        })),
        totalTimeMinutes: bestSubset.reduce((sum, item) => sum + item.timeCost, 0),
        totalValue: bestValue < 0 ? 0 : bestValue,
        timeBudgetMinutes,
    };
}

module.exports = { optimizeItinerary };