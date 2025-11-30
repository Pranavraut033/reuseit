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
    result_hash: str


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


async def generate_ai_enhancements(category: str, result_hash: str) -> Dict[str, any]:
    """Generate AI enhancements for a waste category."""
    # Create cache key
    cache_key = f"ai_enhancements:{hash(category + result_hash)}"

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
The user is trying to recycle something in this category.

Generate a JSON with:

extra_facts: 3–6 surprising, true, verifiable facts about {category} reuse (time-scale, energy/CO₂, reverse trivia, or counterintuitive stats).
simplified_summary: 1 sentence under 80 words explaining {category} reuse.
motivation_text: 1 uplifting, action-oriented sentence tied to real environmental benefits.
"""

        print(f"Prompt prepared for category: {user_input}")

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
            print(f"LLM response received: {llm_response}")
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
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                print(f"Raw response: {llm_response}")
                raise HTTPException(
                    status_code=500, detail="Failed to parse LLM response"
                )
        else:
            print(f"LLM API error: {response.status_code}")
            raise HTTPException(
                status_code=response.status_code, detail="LLM API error"
            )

    except Exception as e:
        print(f"AI enhancements failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI enhancement failed: {str(e)}")


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


@app.post("/enhance", response_model=AIEnhancementResponse)
async def enhance_waste_info(request: AIEnhancementRequest):
    """Generate AI enhancements for waste recycling information."""
    enhancements = await generate_ai_enhancements(request.category, request.result_hash)
    return AIEnhancementResponse(**enhancements)


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
