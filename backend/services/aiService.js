const { GoogleGenAI } = require('@google/genai');
const touristKnowledgeRepository = require('../repositories/touristKnowledgeRepository');

let ai = null;

function getClient() {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai;
}

async function generateFromGemini(places) {
    const placeList = places
        .map((place) => `${place.name} (${place.category})`)
        .join(', ');

    const prompt = `You are a travel guide assistant. For each of the following tourist places in India, provide a short history, a short description, one practical travel tip, and the best time to visit. Places: ${placeList}. Respond ONLY with a valid JSON array, no markdown formatting, no code fences. Each element must have exactly these keys: "name", "history", "description", "travelTips", "bestVisitingTime". Keep each text field to 2-3 sentences.`;

    const response = await getClient().models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
    });

    let rawText = response.text.trim();

    if (rawText.startsWith('```')) {
        rawText = rawText.replace(/```json|```/g, '').trim();
    }

    return JSON.parse(rawText);
}

async function generateTouristInfo(places) {
    const topPlaces = places.slice(0, 5);

    if (topPlaces.length === 0) {
        return [];
    }

    const resultsByPlaceId = {};
    const placesToGenerate = [];

    for (const place of topPlaces) {
        const cached = await touristKnowledgeRepository.findByPlaceId(place.placeId);
        if (cached) {
            console.log(`Cache hit: ${place.name}`);
            resultsByPlaceId[place.placeId] = {
                ...place,
                history: cached.history,
                description: cached.description,
                travelTips: cached.travelTips,
                bestVisitingTime: cached.bestVisitingTime,
            };
        } else {
            console.log(`Cache miss: ${place.name}`);
            placesToGenerate.push(place);
        }
    }

    if (placesToGenerate.length > 0) {
        const generated = await generateFromGemini(placesToGenerate);

        for (const place of placesToGenerate) {
            const match = generated.find((item) => item.name === place.name);
            const enrichedPlace = {
                ...place,
                history: match ? match.history : '',
                description: match ? match.description : '',
                travelTips: match ? match.travelTips : '',
                bestVisitingTime: match ? match.bestVisitingTime : '',
            };
            resultsByPlaceId[place.placeId] = enrichedPlace;

            await touristKnowledgeRepository.save({
                placeId: place.placeId,
                name: place.name,
                category: place.category,
                history: enrichedPlace.history,
                description: enrichedPlace.description,
                travelTips: enrichedPlace.travelTips,
                bestVisitingTime: enrichedPlace.bestVisitingTime,
            });
        }
    }

    return topPlaces.map((place) => resultsByPlaceId[place.placeId]);
}

module.exports = { generateTouristInfo };