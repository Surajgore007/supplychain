export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { target } = req.body;
    if (!target) {
        return res.status(400).json({ error: 'Target sector is required' });
    }

    const API_KEY = process.env.GEMINI_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    // User requested gemini-2.5-flash as the primary working model
    const MODELS_TO_TRY = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro"
    ];

    const promptText = `Generate a simulated supply chain anomaly prediction report for the sector/shipment "${target}".
    Return ONLY a JSON object with this exact structure:
    {
        "summary": "High-level summary of global logistics risks for this sector",
        "anomalies": [
            {
                "type": "Port Congestion/Weather/Cyber Attack/Fuel Spike",
                "severity": "Critical/High/Medium/Low",
                "description": "description of the specific bottleneck",
                "date": "2026-02-20"
            },
            { "type": "...", "severity": "...", "description": "...", "date": "..." },
            { "type": "...", "severity": "...", "description": "...", "date": "..." },
            { "type": "...", "severity": "...", "description": "...", "date": "..." },
            { "type": "...", "severity": "...", "description": "...", "date": "..." }
        ],
        "visual_prompt": "Description of a futuristic cargo ship or automated warehouse in a storm, cyberpunk/digital twin style, high detail"
    }`;

    let lastError = null;

    for (const model of MODELS_TO_TRY) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // If model is not found or not supported, continue to next one
                if (response.status === 404 || data.error?.message?.includes("not found")) {
                    console.warn(`Model ${model} not found, trying next...`);
                    continue;
                }
                throw new Error(data.error?.message || `Gemini API Error: ${response.status}`);
            }

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error("AI returned an empty response.");
            }

            const rawText = data.candidates[0].content.parts[0].text;
            const cleanText = rawText.replace(/```json|```/g, '').trim();

            return res.status(200).json(JSON.parse(cleanText));

        } catch (error) {
            console.error(`Error with model ${model}:`, error.message);
            lastError = error;
        }
    }

    res.status(500).json({ error: lastError?.message || 'All models failed.' });
}
