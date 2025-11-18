const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// NVIDIA NIM Configuration - YOUR API KEY HERE
const NIM_API_KEY = "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";
const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";

// Convert OpenAI format to NVIDIA NIM format
function convertOpenAIToNIM(openaiData) {
    return {
        "messages": openaiData.messages || [],
        "model": openaiData.model || "mistralai/mistral-7b-instruct-v0.3",
        "temperature": openaiData.temperature || 0.7,
        "max_tokens": openaiData.max_tokens || 1024,
        "top_p": openaiData.top_p || 0.9,
        "stream": openaiData.stream || false
    };
}

// Chat completions endpoint
app.post('/v1/chat/completions', async (req, res) => {
    try {
        console.log('Received request:', JSON.stringify(req.body, null, 2));
        
        const openaiData = req.body;
        
        // Convert to NIM format
        const nimData = convertOpenAIToNIM(openaiData);
        
        console.log('Converted to NIM format:', JSON.stringify(nimData, null, 2));

        const headers = {
            'Authorization': `Bearer ${NIM_API_KEY}`,
            'Content-Type': 'application/json'
        };

        console.log('Making request to NVIDIA NIM...');
        const response = await axios.post(
            `${NIM_BASE_URL}/chat/completions`,
            nimData,
            { 
                headers, 
                timeout: 120000 
            }
        );

        console.log('NVIDIA response received');
        res.json(response.data);
        
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        res.status(error.response?.status || 500).json({
            error: 'Proxy error',
            details: error.response?.data || error.message
        });
    }
});

// Models list endpoint
app.get('/v1/models', (req, res) => {
    const models = {
        "object": "list",
        "data": [
            {
                "id": "mistralai/mistral-7b-instruct-v0.3",
                "object": "model",
                "created": 1677610602,
                "owned_by": "mistralai"
            },
            {
                "id": "meta/llama-3.1-8b-instruct", 
                "object": "model",
                "created": 1677610602,
                "owned_by": "meta"
            },
            {
                "id": "nvidia/llama-3.1-nemotron-70b-instruct",
                "object": "model",
                "created": 1677610602,
                "owned_by": "nvidia"
            },
            {
                "id": "google/gemma-2-9b-it",
                "object": "model",
                "created": 1677610602,
                "owned_by": "google"
            },
            {
                "id": "microsoft/phi-3-mini-128k-instruct",
                "object": "model",
                "created": 1677610602,
                "owned_by": "microsoft"
            }
        ]
    };
    res.json(models);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'NVIDIA NIM Proxy',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'NVIDIA NIM Proxy for Janitor AI',
        endpoints: {
            chat: 'POST /v1/chat/completions',
            models: 'GET /v1/models',
            health: 'GET /health'
        },
        supported_models: [
            "mistralai/mistral-7b-instruct-v0.3",
            "meta/llama-3.1-8b-instruct",
            "nvidia/llama-3.1-nemotron-70b-instruct",
            "google/gemma-2-9b-it"
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🚀 NVIDIA NIM Proxy running on port ${PORT}`);
    console.log(`🔗 Base URL: http://localhost:${PORT}`);
    console.log(`🔑 API Key configured: ${NIM_API_KEY ? 'Yes' : 'No'}`);
});
