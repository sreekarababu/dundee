const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large base64 image uploads for image editing

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to verify Google token
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: { message: 'Unauthorized: Missing or invalid token format. Please sign in with Google first.' } });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: { message: 'Unauthorized: Token missing. Please sign in with Google first.' } });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        req.user = payload; // Attach user info to request
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ error: { message: 'Unauthorized: Invalid token. Please sign in with Google again.' } });
    }
}

// Proxy endpoint for Gemini API
app.post('/api/gemini/generateContent', verifyToken, async (req, res) => {
    try {
        const { payload: geminiPayload, model } = req.body;
        
        const clientApiKey = req.headers['x-gemini-api-key'];
        const effectiveApiKey = clientApiKey || process.env.GEMINI_API_KEY;

        if (!effectiveApiKey || effectiveApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return res.status(500).json({ error: { message: 'Server configuration error: Gemini API key not provided by client and not set in server/.env' } });
        }

        const modelName = model || 'gemini-3.5-flash';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${effectiveApiKey}`;

        console.log(`[${req.user.email}] generating content with ${modelName}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Gemini API Error:", response.status, errBody);
            let parsedErr;
            try { parsedErr = JSON.parse(errBody); } catch(e) { parsedErr = { message: errBody }; }
            return res.status(response.status).json({ error: parsedErr.error || parsedErr });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Proxy endpoint for Imagen API (if needed)
app.post('/api/gemini/predict', verifyToken, async (req, res) => {
    try {
        const { payload: geminiPayload, model } = req.body;
        
        const clientApiKey = req.headers['x-gemini-api-key'];
        const effectiveApiKey = clientApiKey || process.env.GEMINI_API_KEY;

        if (!effectiveApiKey || effectiveApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return res.status(500).json({ error: { message: 'Server configuration error: Gemini API key not provided by client and not set in server/.env' } });
        }

        const modelName = model || 'imagen-3.0-generate-001';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${effectiveApiKey}`;

        console.log(`[${req.user.email}] predicting with ${modelName}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Gemini API Error:", response.status, errBody);
            return res.status(response.status).json({ error: 'Gemini API Error', details: errBody });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Secure proxy server running on http://localhost:${PORT}`);
});
