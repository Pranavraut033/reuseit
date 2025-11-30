from fastapi import FastAPI, HTTPException
import httpx
import os
import json
import redis
from typing import Optional, Dict
from pydantic import BaseModel

app = FastAPI(title="Waste AI Enhancements", version="1.0.0")

# Ollama endpoint for text processing
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = None


class AIEnhancementRequest(BaseModel):
    category: str
    recycling_info: str


class AIEnhancementResponse(BaseModel):
    extra_facts: list[str]
    simplified_summary: str
    motivation_text: str


@app.on_event("startup")
async def startup():
    """Initialize Redis client."""
    global redis_client
    try:
        redis_client = redis.from_url(REDIS_URL)
        redis_client.ping()
        print(f"Redis connected successfully at {REDIS_URL}")
    except Exception as e:
        print(f"WARNING: Failed to connect to Redis: {e}")
        redis_client = None


async def generate_ai_enhancements(
    category: str, recycling_info: str
) -> Dict[str, any]:
    """Generate AI enhancements for a waste category."""
    # Create cache key
    cache_key = f"ai_enhancements:{hash(category + recycling_info)}"

    # Check cache first
    if redis_client:
        try:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                print(f"Cache hit for AI enhancements")
                return json.loads(cached_result)
        except Exception as e:
            print(f"Cache read error: {e}")

    try:
        # Load prompt
        with open("app/prompts/recycle_prompt.txt", "r") as f:
            system_prompt = f.read()

        user_input = f"""
Category: {category}
Recycling Info: {recycling_info}

Generate educational content and motivation.
"""

        # Call Ollama
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": "qwen2.5:0.5b",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_input},
                    ],
                    "stream": False,
                    "format": "json",
                },
            )

        if response.status_code == 200:
            result = response.json()
            llm_response = result.get("message", {}).get("content", "{}")

            try:
                parsed_response = json.loads(llm_response)
                validated_response = validate_ai_response(parsed_response)

                # Cache the response
                if redis_client and cache_key:
                    try:
                        redis_client.setex(
                            cache_key, 1800, json.dumps(validated_response)
                        )
                        print(f"Cached AI enhancements response")
                    except Exception as e:
                        print(f"Cache write error: {e}")

                return validated_response
            except json.JSONDecodeError:
                print(f"JSON parse error, using fallback")
                return generate_fallback_enhancements(category)
        else:
            print(f"LLM API error: {response.status_code}, using fallback")
            return generate_fallback_enhancements(category)

    except Exception as e:
        print(f"AI enhancements failed: {e}, using fallback")
        return generate_fallback_enhancements(category)


def validate_ai_response(llm_response: any) -> Dict[str, any]:
    """Validate AI response."""
    if not isinstance(llm_response, dict):
        return {
            "extra_facts": [],
            "simplified_summary": "AI content unavailable",
            "motivation_text": "Keep up the great work!",
        }

    return {
        "extra_facts": (
            llm_response.get("extra_facts", [])
            if isinstance(llm_response.get("extra_facts"), list)
            else []
        ),
        "simplified_summary": (
            llm_response.get("simplified_summary", "AI content unavailable")
            if isinstance(llm_response.get("simplified_summary"), str)
            else "AI content unavailable"
        ),
        "motivation_text": (
            llm_response.get("motivation_text", "Keep up the great work!")
            if isinstance(llm_response.get("motivation_text"), str)
            else "Keep up the great work!"
        ),
    }


def generate_fallback_enhancements(category: str) -> Dict[str, any]:
    """Generate fallback AI enhancements."""
    fallbacks = {
        "paper_cardboard": {
            "extra_facts": [
                "Paper recycling saves energy",
                "Recycled paper can be reused multiple times",
            ],
            "simplified_summary": "Paper and cardboard waste includes newspapers and packaging. Recycling helps save trees.",
            "motivation_text": "Your paper recycling makes a real difference for our forests!",
        },
        "glass": {
            "extra_facts": [
                "Glass can be recycled forever",
                "Recycling glass saves energy",
            ],
            "simplified_summary": "Glass waste includes bottles and jars. Glass recycling conserves natural resources.",
            "motivation_text": "Recycling glass helps preserve our planet's resources!",
        },
        "recyclables": {
            "extra_facts": [
                "Plastic recycling reduces pollution",
                "Recycling saves manufacturing energy",
            ],
            "simplified_summary": "Recyclables include plastic bottles and metal cans. Proper recycling reduces waste.",
            "motivation_text": "Your recycling efforts help create a cleaner environment!",
        },
        "bio_waste": {
            "extra_facts": [
                "Composting reduces methane",
                "Food waste creates nutrient-rich soil",
            ],
            "simplified_summary": "Bio waste includes food scraps and organic materials. Composting creates healthy soil.",
            "motivation_text": "Composting food waste helps reduce greenhouse gases!",
        },
        "textile_reuse": {
            "extra_facts": [
                "Textile reuse saves water",
                "Fashion industry impacts environment",
            ],
            "simplified_summary": "Textile waste includes clothing and fabrics. Reusing textiles conserves resources.",
            "motivation_text": "Reusing clothes helps reduce fashion's environmental impact!",
        },
        "electronics": {
            "extra_facts": [
                "E-waste contains valuable metals",
                "Proper recycling prevents pollution",
            ],
            "simplified_summary": "Electronic waste includes old devices. Proper recycling recovers valuable materials.",
            "motivation_text": "Recycling electronics helps recover precious resources!",
        },
        "battery": {
            "extra_facts": [
                "Batteries contain heavy metals",
                "Proper disposal prevents contamination",
            ],
            "simplified_summary": "Battery waste includes all types of batteries. Safe disposal protects the environment.",
            "motivation_text": "Proper battery recycling keeps our environment safe!",
        },
        "residual_waste": {
            "extra_facts": [
                "Reducing waste saves landfill space",
                "Better recycling minimizes residual waste",
            ],
            "simplified_summary": "Residual waste includes non-recyclable materials. Minimizing this waste helps the planet.",
            "motivation_text": "Reducing residual waste helps preserve our planet!",
        },
    }

    return fallbacks.get(
        category,
        {
            "extra_facts": [],
            "simplified_summary": "This waste requires proper disposal to protect the environment.",
            "motivation_text": "Every small action helps protect our planet!",
        },
    )


@app.post("/enhance", response_model=AIEnhancementResponse)
async def enhance_waste_info(request: AIEnhancementRequest):
    """Generate AI enhancements for waste recycling information."""
    try:
        enhancements = await generate_ai_enhancements(
            request.category, request.recycling_info
        )
        return AIEnhancementResponse(**enhancements)
    except Exception as e:
        print(f"Enhancement failed: {e}")
        # Return fallback
        fallback = generate_fallback_enhancements(request.category)
        return AIEnhancementResponse(**fallback)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    redis_status = False
    if redis_client:
        try:
            redis_client.ping()
            redis_status = True
        except:
            redis_status = False

    return {
        "status": "ok",
        "redis_connected": redis_status,
    }
