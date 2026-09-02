const { GoogleGenAI } = require('@google/genai');

let ai = null;

function getClient() {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai;
}

async function generateTouristInfo(places) {
    const topPlaces = places.slice(0, 5);

    if (topPlaces.length === 0) {
        return [];
    }

    const placeList = topPlaces
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

    let aiData;
    try {
        aiData = JSON.parse(rawText);
    } catch (error) {
        throw new Error('AI response was not valid JSON');
    }

    return topPlaces.map((place) => {
        const match = aiData.find((item) => item.name === place.name);
        return {
            ...place,
            history: match ? match.history : '',
            description: match ? match.description : '',
            travelTips: match ? match.travelTips : '',
            bestVisitingTime: match ? match.bestVisitingTime : '',
        };
    });
}

module.exports = { generateTouristInfo };