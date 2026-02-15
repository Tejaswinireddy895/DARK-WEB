"""
API Tests

Unit tests for FastAPI endpoints.
"""

import sys
from pathlib import Path
import pytest

# Add project root
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class TestAPIEndpoints:
    """Test suite for API endpoints."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "endpoints" in data
    
    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_categories_endpoint(self, client):
        """Test categories endpoint."""
        response = client.get("/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) == 7
    
    def test_metrics_endpoint(self, client):
        """Test metrics endpoint."""
        response = client.get("/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "num_categories" in data
    
    def test_predict_empty_text(self, client):
        """Test prediction with empty text returns error."""
        response = client.post("/predict", json={"text": ""})
        # Should fail validation
        assert response.status_code == 422
    
    def test_predict_valid_text_format(self, client):
        """Test prediction request format is valid."""
        # Note: This test might fail if model is not trained
        # We're testing the request format, not the model
        response = client.post(
            "/predict",
            json={
                "text": "Test text for prediction",
                "model_type": "baseline"
            }
        )
        # Either success (200) or model not found (503)
        assert response.status_code in [200, 503]


@pytest.fixture
def client():
    """Create test client."""
    from fastapi.testclient import TestClient
    from api.main import app
    return TestClient(app)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
