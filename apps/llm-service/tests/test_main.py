import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import json
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "redis_connected" in data


@patch("app.main.redis_client")
@patch("app.main.httpx.AsyncClient")
@pytest.mark.asyncio
async def test_enhance_success(mock_httpx_client, mock_redis):
    """Test successful AI enhancement."""
    # Mock Redis
    mock_redis.ping.return_value = True
    mock_redis.get.return_value = None  # No cache hit
    mock_redis.setex.return_value = True

    # Mock HTTPX response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "message": {
            "content": json.dumps(
                {
                    "extra_facts": ["Fact 1", "Fact 2"],
                    "simplified_summary": "Test summary",
                    "motivation_text": "Test motivation",
                }
            )
        }
    }

    # Mock the async client
    mock_client_instance = MagicMock()
    mock_client_instance.post = AsyncMock(return_value=mock_response)
    mock_httpx_client.return_value.__aenter__.return_value = mock_client_instance
    mock_httpx_client.return_value.__aexit__.return_value = None

    response = client.post(
        "/enhance", json={"category": "plastic", "result_hash": "test123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "extra_facts" in data
    assert "simplified_summary" in data
    assert "motivation_text" in data


@patch("app.main.redis_client")
@patch("app.main.httpx.AsyncClient")
@pytest.mark.asyncio
async def test_enhance_ollama_error(mock_httpx_client, mock_redis):
    """Test handling of Ollama API error."""
    # Mock Redis
    mock_redis.ping.return_value = True
    mock_redis.get.return_value = None

    # Mock HTTPX response with error
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_client_instance = MagicMock()
    mock_client_instance.post = AsyncMock(return_value=mock_response)
    mock_httpx_client.return_value.__aenter__.return_value = mock_client_instance
    mock_httpx_client.return_value.__aexit__.return_value = None

    response = client.post(
        "/enhance", json={"category": "plastic", "result_hash": "test123"}
    )
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data


@patch("app.main.redis_client")
@patch("app.main.httpx.AsyncClient")
@pytest.mark.asyncio
async def test_enhance_invalid_json(mock_httpx_client, mock_redis):
    """Test handling of invalid JSON response from Ollama."""
    # Mock Redis
    mock_redis.ping.return_value = True
    mock_redis.get.return_value = None

    # Mock HTTPX response with invalid JSON
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"message": {"content": "invalid json"}}
    mock_client_instance = MagicMock()
    mock_client_instance.post = AsyncMock(return_value=mock_response)
    mock_httpx_client.return_value.__aenter__.return_value = mock_client_instance
    mock_httpx_client.return_value.__aexit__.return_value = None

    response = client.post(
        "/enhance", json={"category": "plastic", "result_hash": "test123"}
    )
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data


def test_validate_ai_response():
    """Test the validate_ai_response function."""
    from app.main import validate_ai_response

    # Valid response
    valid = {
        "extra_facts": ["fact1", "fact2"],
        "simplified_summary": "summary",
        "motivation_text": "motivation",
    }
    result = validate_ai_response(valid)
    assert result == valid

    # Invalid response
    invalid = "not a dict"
    result = validate_ai_response(invalid)
    assert result["extra_facts"] == []
    assert result["simplified_summary"] == "AI content unavailable"
    assert result["motivation_text"] == "Keep up the great work!"
