# Waste Detection with Local ML Model + Ollama Gemma3

A FastAPI-based microservice that uses local TensorFlow waste classification models and Ollama Gemma3 text model for comprehensive visual waste analysis and recycling classification.

## Features

- **Local ML Inference**: Uses TensorFlow/Keras waste classification model for offline, privacy-preserving image analysis
- **Text Processing**: Uses Gemma3:1b for structured response formatting
- **Waste Detection**: Classifies waste items into 8 categories (paper_cardboard, glass, recyclables, bio_waste, textile_reuse, electronics, battery, residual_waste)
- **Recycling Classification**: Provides German recycling guidance with Pfand information
- **RESTful API**: Simple endpoints for health checks and waste analysis
- **Docker Support**: Easy deployment with Docker Compose
- **Async Processing**: Non-blocking requests with proper error handling

## Architecture

The service uses a hybrid approach:

- **Vision Model**: Local TensorFlow/Keras classification model for waste category detection
- **Text Model**: Ollama Gemma3:1b for formatting detection results into structured JSON
- **German Recycling Knowledge**: Context-aware recycling guidance

## Ollama Integration

This service integrates with [Ollama](https://ollama.ai/), which provides:

- Local inference with no external API calls
- Support for vision-capable models like Moondream
- Support for text models like Gemma3
- REST API access at `http://localhost:11434`
- Easy model management and switching

## API Endpoints

### GET /health
Returns service health status.

**Response:**
```json
{
  "status": "ok"
}
```

### POST /analyze
Analyzes an uploaded image for waste items and provides recycling information.

**Parameters:**
- `image` (file, required): Image file (JPEG, PNG, etc.)
- `user_text` (string, optional): Additional context from user

**Response:**
```json
{
  "detections": [
    {
      "name": "plastic bottle",
      "rough_location": "center"
    }
  ],
  "recycling_plan": [
    {
      "item_name": "plastic bottle",
      "material_type": "PET plastic",
      "category": "plastic",
      "german_bin": "Gelber Sack",
      "is_pfand": true,
      "recycling_instructions": "Rinse and flatten before recycling",
      "reuse_ideas": "Use as planter or storage container",
      "notes_germany": "Return for 0.25€ deposit if applicable"
    }
  ],
  "latency_ms": {
    "detector": 1250.5,
    "reasoner": 890.3,
    "total": 2140.8
  },
  "models": {
    "vision": "moondream",
    "llm": "gemma3:1b"
  }
}
```

## 🇩🇪 Germany-Specific Recycling

This service is specifically tuned for German waste separation standards using an integrated knowledge base of municipal recycling guidelines.

### German Bin System
- **Gelber Sack/Gelbe Tonne**: Plastics, metals, composite packaging
- **Papiertonne**: Paper, cardboard (clean, no grease)
- **Glascontainer**: Glass bottles/jars (separated by color: white/green/brown)
- **Biotonne**: Organic waste, food scraps
- **Restmüll**: General waste, contaminated items
- **Sondermüll**: Batteries, chemicals, electronics

### Key Rules
- **Pfandsystem**: Deposit bottles (0.08-0.25€) must be returned to stores
- **Light Contamination**: Rinse containers but perfect cleaning not required
- **Common Mistakes**: Greasy pizza boxes go to Restmüll, not paper bin

### How It Works
The service uses a two-stage AI pipeline:

1. **Vision Analysis**: Moondream model analyzes the uploaded image to understand waste items and generate natural language descriptions
2. **Structured Formatting**: Gemma3:1b model processes the vision output to format it into structured JSON with German recycling information

A comprehensive German recycling knowledge base ensures accurate bin assignments, Pfand information, and country-specific instructions.

### Example German Output
```bash
curl -X POST \
  -F "image=@german_waste.jpg" \
  http://localhost:8000/analyze
```

Returns structured JSON with bin assignments like "Gelber Sack", deposit information, reuse ideas, and German-specific notes.

## Local Development

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (optional, for local development without Docker)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd llm-service
```

2. Start the services:
```bash
docker-compose up --build
```

This will:
- Launch Ollama service with automatic model setup
- Build and start the FastAPI service
- Expose the API on `http://localhost:8000`
- Ollama available at `http://localhost:11434`
- Models (moondream and gemma3:1b) are automatically pulled on first startup

### Testing

Test the health endpoint:
```bash
curl http://localhost:8000/health
```

Test waste analysis with an image:
```bash
curl -X POST \
  -F "image=@path/to/waste_image.jpg" \
  -F "user_text=This is a photo of my recycling bin" \
  http://localhost:8000/analyze
```

### Development without Docker

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start Ollama service:
```bash
ollama serve
```

3. Pull the required models (this happens automatically in Docker):
```bash
ollama pull moondream
ollama pull gemma3:1b
```

4. Run the FastAPI service:
```bash
uvicorn app.main:app --reload
```

## Alternative Setup: Ollama + vLLM (CPU Compatible)

For CPU-only environments without CUDA GPU, use this alternative setup:

### Requirements
- Ollama (for vision model)
- vLLM with CPU support (mock implementation included)

### Setup Steps

1. Install Ollama:
```bash
# macOS
brew install ollama

# Linux/Windows
curl -fsSL https://ollama.ai/install.sh | sh
```

## Manual Ollama Setup

If you prefer to manage Ollama separately from Docker:

### Requirements
- Ollama installed on your system
- Models pulled manually

### Setup Steps

1. Install Ollama:
```bash
# macOS
brew install ollama

# Linux/Windows
curl -fsSL https://ollama.ai/install.sh | sh
```

2. Start Ollama service:
```bash
ollama serve
```

3. Pull the required models:
```bash
ollama pull moondream
ollama pull gemma3:1b
```

4. Update docker-compose.yml to use external Ollama:
```yaml
services:
  api:
    build: .
    environment:
      - OLLAMA_HOST=http://host.docker.internal:11434  # For macOS
      # - OLLAMA_HOST=http://localhost:11434  # For Linux
    ports:
      - '8000:8000'
```

5. Start only the API service:
```bash
docker-compose up api --build
```

### Why Manual Setup?
- ✅ Full control over Ollama installation
- ✅ Can use system-installed Ollama
- ✅ Easier debugging of model issues
- ✅ Works with existing Ollama setups

## Configuration

- `OLLAMA_HOST`: URL of the Ollama service (default: `http://localhost:11434`)
- Models are automatically pulled on first run via Docker Compose

## Error Handling

The service includes comprehensive error handling:
- Invalid image formats
- LLM service unavailability
- JSON parsing failures
- Network timeouts

All errors return appropriate HTTP status codes with descriptive messages.

## Performance

- Typical detection latency: 1-2 seconds
- Typical reasoning latency: 0.5-1 second
- Total analysis time: 2-3 seconds per request
- Supports concurrent requests via async processing

## Deployment

### Production Deployment

1. Update `docker-compose.yml` for production settings
2. Configure reverse proxy (nginx/Caddy)
3. Set up monitoring and logging
4. Use environment-specific configurations

### Scaling

- The service is stateless and can be scaled horizontally
- Ollama service may need GPU resources for better performance
- Consider using managed Ollama services for production

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure Docker builds pass

## License

[Add your license here]
