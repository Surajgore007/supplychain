export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { target } = req.body;
    if (!target) {
        return res.status(400).json({ error: 'Target System required' });
    }

    const API_KEY = process.env.GEMINI_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'Missing GEMINI_KEY' });
    }

    const promptText = `Act as an AI Ethical Monitor. Analyze: "${target}".
    Generate a high-fidelity "Real-Time Monitoring Session" dataset.
    Provide a single JSON object with:
    {
        "baseline_integrity": "0-100",
        "drilldown": {
            "bias_drift_trend": [number, number, number, number, number],
            "fairness_subgroups": [
                {"group": "Gender", "status": "Stable/Degraded", "score": 85},
                {"group": "Age", "status": "Stable/Degraded", "score": 92},
                {"group": "Ethnicity", "status": "Stable/Degraded", "score": 74},
                {"group": "Geo-Location", "status": "Stable/Degraded", "score": 89}
            ]
        },
        "live_stream_packets": [
            {"id": "PX-001", "module": "Input Filter", "status": "PASS", "detail": "Privacy mask active"},
            {"id": "PX-002", "module": "Model Inference", "status": "FAIL", "detail": "Bias threshold exceeded"},
            {"id": "PX-003", "module": "Output Buffer", "status": "PASS", "detail": "No leakage detected"},
            {"id": "PX-004", "module": "Embedding Space", "status": "PASS", "detail": "Centroid stable"},
            {"id": "PX-005", "module": "Weight Audit", "status": "FAIL", "detail": "Fairness degradation in sub-layer 4"}
        ],
        "risk_alerts": [
            {"type": "Bias Drift", "impact": "High", "desc": "Significant shift in prediction parity for Group C"},
            {"type": "Privacy Leakage", "impact": "Critical", "desc": "Potential PII pattern detected in inference log B"}
        ],
        "visual_prompt": "Abstract representation of a digital brain being scanned by a green laser grid, ethical symbols, tech style"
    }
    The bias_drift_trend should be 5 numbers representing a timeline of ethics health.
    Return ONLY JSON.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        res.status(200).json(JSON.parse(text));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
