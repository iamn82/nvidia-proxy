const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model = 'meta/llama-3.1-405b-instruct', temperature = 0.7, max_tokens = 1024, stream = false } = req.body;

    const nvidiaPayload = {
      model,
      messages,
      temperature,
      max_tokens,
      stream
    };

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nvidiaPayload)
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      response.body.pipe(res);
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/v1/models', (req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "meta/llama-3.1-405b-instruct", object: "model", created: 1686935002, owned_by: "nvidia" },
      { id: "meta/llama-3.1-70b-instruct", object: "model", created: 1686935002, owned_by: "nvidia" }
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: "healthy" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
