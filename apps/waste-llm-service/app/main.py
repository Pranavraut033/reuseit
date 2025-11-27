from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from PIL import Image
import base64
import io
import time
import httpx
import os
import json
import numpy as np
import tensorflow as tf
from typing import Optional, List, Dict

app = FastAPI(title="Waste Detection with Local ML Model", version="1.0.0")

# Ollama endpoint for text processing
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Waste detection classes
WASTE_CLASSES = [
    "paper_cardboard",
    "glass",
    "recyclables",
    "bio_waste",
    "textile_reuse",
    "electronics",
    "battery",
    "residual_waste",
]


# Load German recycling knowledge from JSON
def load_recycling_knowledge():
    """Load recycling knowledge from JSON file."""
    try:
        with open(
            "app/knowledge/german_recycling_knowledge.json", "r", encoding="utf-8"
        ) as f:
            knowledge = json.load(f)
        return knowledge
    except FileNotFoundError:
        print("WARNING: german_recycling_knowledge.json not found, using fallback")
        return None
    except json.JSONDecodeError as e:
        print(f"WARNING: Error parsing knowledge JSON: {e}, using fallback")
        return None


# Load knowledge base
KNOWLEDGE_BASE = load_recycling_knowledge()

# German recycling mapping (fallback if JSON fails)
GERMAN_RECYCLING = {}


def initialize_recycling_mapping():
    """Initialize the recycling mapping from JSON knowledge base."""
    global GERMAN_RECYCLING

    if KNOWLEDGE_BASE:
        # Map waste classes to bins based on knowledge
        bin_mapping = {
            "paper_cardboard": "Papiertonne",
            "glass": "Glascontainer",
            "recyclables": "Gelber Sack / Gelbe Tonne",
            "bio_waste": "Biotonne",
            "textile_reuse": "Textilcontainer",
            "electronics": "Sondermüll",
            "battery": "Sondermüll",
            "residual_waste": "Restmüll",
        }

        for waste_class, bin_name in bin_mapping.items():
            if bin_name in KNOWLEDGE_BASE["bins"]:
                bin_info = KNOWLEDGE_BASE["bins"][bin_name]
                notes = []
                if bin_info.get("accepted"):
                    notes.extend(
                        [f"Accepted: {', '.join(bin_info['accepted'][:2])}..."]
                    )
                if bin_info.get("notAccepted"):
                    notes.extend(
                        [f"Not accepted: {', '.join(bin_info['notAccepted'][:2])}..."]
                    )
                if bin_info.get("notes"):
                    notes.extend(bin_info["notes"])

                GERMAN_RECYCLING[waste_class] = {
                    "bin": bin_name,
                    "notes": " ".join(notes) if notes else f"Items for {bin_name}",
                }
            else:
                GERMAN_RECYCLING[waste_class] = {
                    "bin": bin_name,
                    "notes": f"Items for {bin_name}",
                }
    else:
        # Fallback mapping
        GERMAN_RECYCLING.update(
            {
                "paper_cardboard": {
                    "bin": "Papiertonne",
                    "notes": "Clean cardboard and paper, remove tape and staples",
                },
                "glass": {
                    "bin": "Glascontainer",
                    "notes": "Separate by color: white/green/brown, remove lids",
                },
                "recyclables": {
                    "bin": "Gelber Sack",
                    "notes": "Plastic bottles, metal cans, and other recyclables with recycling symbol",
                },
                "bio_waste": {
                    "bin": "Biotonne",
                    "notes": "Organic waste and food scraps",
                },
                "textile_reuse": {
                    "bin": "Altkleidercontainer",
                    "notes": "Reusable textiles, take to clothing collection points",
                },
                "electronics": {
                    "bin": "Elektroschrott",
                    "notes": "Take to recycling center or electronics retailer",
                },
                "battery": {
                    "bin": "Batteriesammelstelle",
                    "notes": "Return to collection points at retailers",
                },
                "residual_waste": {
                    "bin": "Restmüll",
                    "notes": "Non-recyclable waste",
                },
            }
        )


# Initialize the mapping
initialize_recycling_mapping()

# Global model variable
detection_model = None


@app.on_event("startup")
async def load_model():
    """Load the TensorFlow object detection model on startup."""
    global detection_model
    model_path = "/app/models/object_detection_model.keras"
    try:
        detection_model = tf.keras.models.load_model(model_path)
        print(f"DEBUG: Object detection model loaded successfully from {model_path}")
        print(f"DEBUG: Model input shape: {detection_model.input_shape}")
        print(f"DEBUG: Model output names: {detection_model.output_names}")
    except Exception as e:
        print(f"WARNING: Failed to load object detection model from {model_path}: {e}")
        print("WARNING: Using fallback detection logic")
        detection_model = None


def format_knowledge_for_llm() -> str:
    """Format the JSON knowledge base into readable text for the LLM."""
    if not KNOWLEDGE_BASE:
        return "German recycling knowledge not available."

    kb = KNOWLEDGE_BASE
    formatted = []

    # Add waste classes
    formatted.append("WASTE CLASSES:")
    formatted.append(", ".join(kb["wasteClasses"]))
    formatted.append("")

    # Add bin information
    formatted.append("RECYCLING BINS:")
    for bin_name, bin_info in kb["bins"].items():
        formatted.append(f"• {bin_name}:")
        if bin_info.get("accepted"):
            formatted.append("  ACCEPTED:")
            for item in bin_info["accepted"]:
                formatted.append(f"    - {item}")
        if bin_info.get("notAccepted"):
            formatted.append("  NOT ACCEPTED:")
            for item in bin_info["notAccepted"]:
                formatted.append(f"    - {item}")
        if bin_info.get("notes"):
            formatted.append("  NOTES:")
            for note in bin_info["notes"]:
                formatted.append(f"    - {note}")
        formatted.append("")

    # Add Pfand system
    if kb.get("pfandSystem"):
        pfand = kb["pfandSystem"]
        formatted.append("PFAND (DEPOSIT) SYSTEM:")
        formatted.append(pfand["description"])
        formatted.append("AMOUNTS:")
        for amount, items in pfand["amounts"].items():
            formatted.append(f"  {amount}: {items}")
        formatted.append("HOW TO RETURN:")
        for step in pfand["howToReturn"]:
            formatted.append(f"  - {step}")
        formatted.append("")

    # Add contamination rules
    if kb.get("contaminationRules"):
        formatted.append("CONTAMINATION RULES:")
        for rule in kb["contaminationRules"]:
            formatted.append(f"• {rule}")
        formatted.append("")

    # Add common mistakes
    if kb.get("commonMistakes"):
        formatted.append("COMMON MISTAKES:")
        for mistake in kb["commonMistakes"]:
            formatted.append(f"• {mistake['item']} → {mistake['correctBin']}")
            formatted.append(f"  Reason: {mistake['reason']}")
        formatted.append("")

    # Add municipal variations
    if kb.get("municipalVariations"):
        formatted.append("MUNICIPAL VARIATIONS:")
        for variation in kb["municipalVariations"]:
            formatted.append(f"• {variation}")
        formatted.append("")

    return "\n".join(formatted)


async def generate_recycling_plan(
    detections: List[Dict], user_text: Optional[str] = None
) -> List[Dict]:
    """Generate recycling plan using Ollama LLM with German recycling knowledge."""
    try:
        # Load prompts
        with open("app/prompts/recycle_prompt.txt", "r") as f:
            system_prompt = f.read()

        # Load and format knowledge base
        knowledge_base = format_knowledge_for_llm()

        # Format detections for LLM
        detection_text = "\n".join(
            [
                f"- {d['name']} (confidence: {d['confidence']:.2f}, bbox: {d['bbox']})"
                for d in detections
            ]
        )

        user_input = f"""
Detected waste items:
{detection_text}

{f"User notes: {user_text}" if user_text else ""}

German recycling knowledge:
{knowledge_base}
"""

        # Call Ollama using chat API for better structured responses
        async with httpx.AsyncClient(timeout=30.0) as client:
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
            llm_response = result.get("message", {}).get("content", "[]")
            print(f"DEBUG: LLM raw response: {llm_response}")

            # Parse JSON response
            try:
                parsed_response = json.loads(llm_response)
                # Validate and sanitize the LLM response
                validated_response = validate_llm_response(parsed_response, detections)
                return validated_response
            except json.JSONDecodeError as e:
                print(f"DEBUG: JSON parse error: {e}, using fallback")
                return generate_fallback_recycling_plan(detections)
        else:
            print(f"DEBUG: LLM API error: {response.status_code}, using fallback")
            return generate_fallback_recycling_plan(detections)

    except Exception as e:
        print(f"DEBUG: LLM generation failed: {e}, using fallback")
        return generate_fallback_recycling_plan(detections)


def generate_fallback_recycling_plan(detections: List[Dict]) -> List[Dict]:
    """Generate basic recycling plan using static mapping when LLM fails."""
    recycling_plan = []
    for detection in detections:
        class_name = detection["name"]
        recycling_info = GERMAN_RECYCLING.get(
            class_name, GERMAN_RECYCLING["residual_waste"]
        )
        recycling_plan.append(
            {
                "item_name": class_name,
                "material_type": "detected",
                "category": class_name,
                "german_bin": recycling_info["bin"],
                "is_pfand": False,
                "recycling_instructions": recycling_info["notes"],
                "reuse_ideas": "Check local reuse centers",
                "notes_germany": f"Detected with {detection['confidence']:.2f} confidence at bbox {detection['bbox']}",
            }
        )
    return recycling_plan


def validate_llm_response(llm_response: any, detections: List[Dict]) -> List[Dict]:
    """Validate and sanitize LLM response to ensure all required fields are present."""
    if not isinstance(llm_response, list):
        print(f"DEBUG: LLM response is not a list, using fallback")
        return generate_fallback_recycling_plan(detections)

    validated_plan = []
    for item in llm_response:
        if not isinstance(item, dict):
            continue

        # Validate and provide defaults for all required fields
        validated_item = {
            "item_name": item.get("item_name") or "Unknown Item",
            "material_type": item.get("material_type") or "Unknown Material",
            "category": item.get("category") or "residual",
            "german_bin": item.get("german_bin") or "Restmüll",
            "is_pfand": item.get("is_pfand", False),
            "recycling_instructions": item.get("recycling_instructions")
            or "Please check local recycling guidelines",
            "reuse_ideas": item.get("reuse_ideas") or "Check local reuse centers",
            "notes_germany": item.get("notes_germany")
            or "Follow local German recycling regulations",
        }
        validated_plan.append(validated_item)

    # If no valid items were found, use fallback
    if not validated_plan:
        print(f"DEBUG: No valid items in LLM response, using fallback")
        return generate_fallback_recycling_plan(detections)

    return validated_plan


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "model_loaded": detection_model is not None}


def detect_waste_objects(image: Image.Image) -> List[Dict]:
    """Run object detection on the image and return detected waste items."""
    if detection_model is None:
        print("DEBUG: Model not loaded, returning fallback detection")
        return [
            {
                "name": "unknown",
                "confidence": 0.1,
                "bbox": [0, 0, 320, 320],
                "class_id": 7,  # battery (last class)
            }
        ]

    try:
        # Preprocess image
        img_array = np.array(image)
        if img_array.shape[-1] == 4:  # Remove alpha channel if present
            img_array = img_array[:, :, :3]

        # Resize to model input size (320x320 based on metadata)
        img_resized = tf.image.resize(img_array, [320, 320])
        img_normalized = img_resized / 255.0  # Normalize to [0, 1]
        img_batch = np.expand_dims(img_normalized, axis=0)

        # Run inference
        predictions = detection_model.predict(img_batch, verbose=0)

        # Extract predictions (object detection model has multiple outputs)
        bbox_pred = predictions["bbox"][0]  # [x_min, y_min, x_max, y_max] normalized
        class_pred = predictions["class"][0]  # Class probabilities

        # Get the predicted class
        predicted_class_idx = int(np.argmax(class_pred))
        confidence = float(class_pred[predicted_class_idx])
        predicted_class = WASTE_CLASSES[predicted_class_idx]

        # Denormalize bounding box coordinates to original image size
        orig_h, orig_w = img_array.shape[:2]
        # Ensure bbox coordinates are within valid range
        x_min = max(0, min(int(bbox_pred[0] * orig_w), orig_w - 1))
        y_min = max(0, min(int(bbox_pred[1] * orig_h), orig_h - 1))
        x_max = max(x_min + 1, min(int(bbox_pred[2] * orig_w), orig_w))
        y_max = max(y_min + 1, min(int(bbox_pred[3] * orig_h), orig_h))

        print(
            f"DEBUG: Object detection - Class: {predicted_class}, Confidence: {confidence:.3f}"
        )
        print(f"DEBUG: Raw bbox: {bbox_pred}, Image size: {orig_w}x{orig_h}")
        print(f"DEBUG: Denormalized bbox: [{x_min}, {y_min}, {x_max}, {y_max}]")

        # Return detection result
        detections = [
            {
                "name": predicted_class,
                "confidence": confidence,
                "bbox": [x_min, y_min, x_max, y_max],
                "class_id": predicted_class_idx,
            }
        ]

        return detections

    except Exception as e:
        print(f"DEBUG: Error in detect_waste_objects: {e}")
        import traceback

        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        # Return fallback detection
        return [
            {
                "name": "unknown",
                "confidence": 0.1,
                "bbox": [0, 0, 320, 320],
                "class_id": 7,  # battery
            }
        ]


async def query_ollama_vision(image_base64: str, prompt: str) -> dict:
    """Query Ollama moondream model with an image and prompt"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": "moondream:latest",
                    "messages": [
                        {"role": "user", "content": prompt, "images": [image_base64]}
                    ],
                    "stream": False,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Ollama unavailable: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Ollama error: {e.response.text}",
            )


async def query_ollama_text(prompt: str) -> dict:
    """Query Ollama qwen2.5 model for text generation"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": "qwen2.5:0.5b",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
                timeout=120.0,
            )
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Ollama unavailable: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Ollama error: {e.response.text}",
            )


@app.post("/analyze")
async def analyze_waste(
    image: UploadFile = File(...), user_text: Optional[str] = Form(None)
):
    """
    Analyze waste in the uploaded image using Ollama vision model.
    """
    print("DEBUG: /analyze endpoint called")
    start_time = time.perf_counter()

    # Validate image
    if not image.content_type.startswith("image/"):
        print(f"DEBUG: Invalid content type: {image.content_type}")
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    print("DEBUG: Image validation passed")
    # Read and encode image
    try:
        image_data = await image.read()
        print(f"DEBUG: Read {len(image_data)} bytes of image data")
        img = Image.open(io.BytesIO(image_data))
        # Convert to RGB if necessary
        if img.mode != "RGB":
            img = img.convert("RGB")
        # Encode to base64
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        print(f"DEBUG: Image encoded to base64, length: {len(image_base64)}")
    except Exception as e:
        print(f"DEBUG: Image processing failed: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    print("DEBUG: Image processing completed")

    try:
        # Use local TensorFlow model for waste detection
        detection_start = time.perf_counter()
        detections = detect_waste_objects(img)
        detection_time = (time.perf_counter() - detection_start) * 1000
        print(
            f"DEBUG: Local detection completed in {detection_time:.2f}ms: {detections}"
        )

        # Use qwen2.5:0.5b to format the detection results into structured recycling plan
        analysis_start = time.perf_counter()

        # Generate recycling plan using LLM with timeout protection
        try:
            recycling_plan = await generate_recycling_plan(detections, user_text)
            print("DEBUG: LLM recycling plan generated successfully")
        except Exception as e:
            print(f"DEBUG: LLM call failed ({type(e).__name__}): {e}, using fallback")
            recycling_plan = generate_fallback_recycling_plan(detections)

        analysis_time = time.perf_counter() - analysis_start

        return {
            "detections": detections,
            "recycling_plan": recycling_plan,
            "latency_ms": {
                "detector": detection_time,
                "reasoner": analysis_time,
                "total": (time.perf_counter() - start_time) * 1000,
            },
            "models": {"vision": "local_tensorflow", "llm": "qwen2.5:0.5b"},
        }

    except Exception as e:
        print(f"DEBUG: Exception occurred: {type(e).__name__}: {str(e)}")
        import traceback

        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        # Return fallback response on error
        return {
            "detections": [],
            "recycling_plan": [
                {
                    "item_name": "error occurred",
                    "material_type": "unknown",
                    "category": "unknown",
                    "german_bin": "Restmüll",
                    "is_pfand": False,
                    "recycling_instructions": "Service temporarily unavailable",
                    "reuse_ideas": "Check back later",
                    "notes_germany": f"Error: {str(e)}",
                }
            ],
            "latency_ms": {
                "detector": 0,
                "reasoner": 0,
                "total": (time.perf_counter() - start_time) * 1000,
            },
            "models": {"vision": "local_tensorflow", "llm": "qwen2.5:0.5b"},
            "error": str(e),
        }
