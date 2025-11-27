#!/bin/bash

# Start Ollama in background
ollama serve &

# Wait for Ollama to start
sleep 10

# Pull required models
ollama pull qwen2.5:0.5b

# Keep the script running to keep the container alive
wait
