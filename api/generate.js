export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { target } = req.body;
    if (!target) {
        return res.status(400).json({ error: 'Target AI System is required' });
    }

    const API_KEY = process.env.GEMINI_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    const promptText = `Act as an AI Ethics & Security Guard. Audit the system: "${target}".
    Detect ethical violations including Bias Drift, Fairness Degradation, and Privacy Leakage.
    Provide a hyper-detailed JSON report for a "Real-Time Ethical Risk Monitor" dashboard.
    The response must be a single JSON object with:
    {
        "overall_integrity": "0-100",
        "risk_status": "Healthy/Degraded/Critical",
        "violations": [
            {
                "type": "Bias Drift/Privacy Leakage/Fairness Degradation",
                "severity": "Critical/High/Medium/Low",
                "component": "Dataset/Model Weights/API Endpoint",
                "description": "Specific detection detail",
                "mitigation": "Recommended corrective action"
            }
        ],
        "metrics": {
            "bias_score": "0-100",
            "fairness_level": "0-100",
            "privacy_integrity": "0-100"
        },
        "visual_prompt": "Futuristic clean digital dashboard monitoring neural networks, ethical shield icon, neon blue and orange"
    }
    Generate 5 significant violations. Return ONLY JSON.`;

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
    res.status(500).json({ error: "Ethical Audit Interface Offline" });
}
