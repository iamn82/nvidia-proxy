from flask import Flask, request, jsonify, Response
import requests
import os
import json

app = Flask(__name__)

# NVIDIA NIM API configuration
NVIDIA_API_KEY = os.environ.get('NVIDIA_API_KEY', '')
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    try:
        data = request.json
        
        # Extract OpenAI format parameters
        messages = data.get('messages', [])
        model = data.get('model', 'meta/llama-3.1-405b-instruct')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1024)
        stream = data.get('stream', False)
        
        # Convert to NVIDIA NIM format
        nvidia_payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Make request to NVIDIA NIM
        nvidia_response = requests.post(
            f"{NVIDIA_BASE_URL}/chat/completions",
            headers=headers,
            json=nvidia_payload,
            stream=stream
        )
        
        if stream:
            def generate():
                for line in nvidia_response.iter_lines():
                    if line:
                        yield line + b'\n'
            
            return Response(generate(), content_type='text/event-stream')
        else:
            return jsonify(nvidia_response.json()), nvidia_response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/v1/models', methods=['GET'])
def list_models():
    """Return available models"""
    return jsonify({
        "object": "list",
        "data": [
            {
                "id": "meta/llama-3.1-405b-instruct",
                "object": "model",
                "created": 1686935002,
                "owned_by": "nvidia"
            },
            {
                "id": "meta/llama-3.1-70b-instruct",
                "object": "model",
                "created": 1686935002,
                "owned_by": "nvidia"
            }
        ]
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
