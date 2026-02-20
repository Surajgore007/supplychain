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

    const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    const promptText = `Act as a Global Logistics AI Command Center. Analyze the sector: "${target}".
    Provide a hyper-detailed JSON report for an "Anomaly Predictor" dashboard.
    The response must be a single JSON object with:
    {
        "status_summary": "One sentence situational overview",
        "global_news": [
            {"event": "Breaking news headline", "impact": "0-100", "source": "Reuters/AI Logistics"}
        ],
        "active_shipments": [
            {
                "id": "SH-XXXX",
                "origin": {"city": "Name", "x": 0-800, "y": 0-400},
                "destination": {"city": "Name", "x": 0-800, "y": 0-400},
                "status": "Delayed/In Transit/Rerouted",
                "risk_factor": "High/Critical/Stable",
                "original_eta": "YYYY-MM-DD",
                "predicted_anomaly": "Description of potential failure",
                "reroute_recommendation": "Description of the new path",
                "savings": "Estimated % efficiency gain"
            }
        ],
        "system_visual": "Cyberpunk terminal style prompt for a futuristic shipyard map"
    }
    Use realistic x/y coordinates for a map area of 800x400. Generate 5 news items and 4 shipments.
    Return ONLY JSON.`;

    for (const model of MODELS_TO_TRY) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) continue;

            const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
            return res.status(200).json(JSON.parse(text));
        } catch (e) { console.error(e); }
    }
    res.status(500).json({ error: "Intelligence Feed Unavailable" });
}
