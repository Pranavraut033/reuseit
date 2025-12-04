#!/bin/bash

# Start Ollama in background
ollama serve &

# Wait for Ollama to start
sleep 10

# Pull required models
ollama pull qwen3:0.6b

# Keep the script running to keep the container alive
wait
