"""
FastAPI Backend Service for Civic Issue Detection & Severity Prediction

This service loads a pre-trained multi-output CNN model and performs
inference on uploaded images to predict:
- Issue type: [pothole, garbage, broken_streetlight, waterlogging]
- Severity:   [low, medium, high]

Usage:
    uvicorn main:app --reload

API Endpoints:
    POST /predict  - Upload image and get predictions
    GET  /health   - Service health check
"""

import os
import io
from typing import Dict, Any
import numpy as np
from PIL import Image
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# -------------------------
# Configuration
# -------------------------
MODEL_PATH = "civic_issue_severity_model.h5"
MODEL_INPUT_SIZE = (224, 224)  # (height, width)

# Class name mappings (must match training)
ISSUE_CLASSES = ["pothole", "garbage", "broken_streetlight", "waterlogging"]
SEVERITY_CLASSES = ["low", "medium", "high"]

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}

# Global model variable (loaded at startup)
model: tf.keras.Model = None


# -------------------------
# Response Models
# -------------------------
class PredictionResponse(BaseModel):
    """Response model for /predict endpoint."""
    issue_type: str
    severity: str
    confidence: float


class HealthResponse(BaseModel):
    """Response model for /health endpoint."""
    status: str
    model_loaded: bool


# -------------------------
# FastAPI App Setup
# -------------------------
app = FastAPI(
    title="Civic Issue Detection API",
    description="AI-powered civic issue classification and severity prediction",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Model Loading (Startup)
# -------------------------
@app.on_event("startup")
async def load_model():
    """
    Load the pre-trained Keras model once at application startup.
    This ensures efficient inference without reloading per request.
    """
    global model

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}\n"
            "Please ensure civic_issue_severity_model.h5 exists in the project root."
        )

    try:
        print(f"Loading model from {MODEL_PATH}...")
        model = tf.keras.models.load_model(MODEL_PATH)
        print("Model loaded successfully!")
        print(f"Model input shape: {model.input_shape}")
        print(f"Model outputs: {[out.name for out in model.outputs]}")
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {e}")


# -------------------------
# Image Preprocessing
# -------------------------
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess uploaded image for model inference.

    Steps:
    1. Read image from bytes
    2. Convert to RGB (handles RGBA, grayscale, etc.)
    3. Resize to model input size (224x224)
    4. Normalize pixel values to [0, 1]
    5. Expand dimensions to match model input shape [1, 224, 224, 3]

    Args:
        image_bytes: Raw image file bytes

    Returns:
        Preprocessed image array ready for model inference
    """
    try:
        # Read image from bytes
        image = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB (handles RGBA, grayscale, etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize to model input size
        image = image.resize(MODEL_INPUT_SIZE, Image.Resampling.LANCZOS)

        # Convert PIL Image to numpy array
        img_array = np.array(image, dtype=np.float32)

        # Normalize pixel values to [0, 1]
        img_array = img_array / 255.0

        # Expand dimensions: [224, 224, 3] -> [1, 224, 224, 3]
        img_array = np.expand_dims(img_array, axis=0)

        return img_array

    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {e}")


# -------------------------
# Prediction Logic
# -------------------------
def predict_issue_and_severity(image_array: np.ndarray) -> Dict[str, Any]:
    """
    Run model inference and extract issue type, severity, and confidence.

    The model outputs two heads:
    - issue_output: [batch, 4] softmax probabilities
    - severity_output: [batch, 3] softmax probabilities

    Args:
        image_array: Preprocessed image array [1, 224, 224, 3]

    Returns:
        Dictionary with issue_type, severity, and confidence
    """
    global model

    if model is None:
        raise RuntimeError("Model not loaded. Please restart the service.")

    try:
        # Run inference
        predictions = model.predict(image_array, verbose=0)

        # Extract outputs (assuming model has named outputs)
        # If model outputs are ordered, use: issue_pred, severity_pred = predictions
        # For named outputs (as in our training script):
        if isinstance(predictions, dict):
            issue_probs = predictions["issue_output"][0]  # [4]
            severity_probs = predictions["severity_output"][0]  # [3]
        else:
            # Fallback: assume first output is issue, second is severity
            issue_probs = predictions[0][0]
            severity_probs = predictions[1][0]

        # Get predicted class indices
        issue_idx = np.argmax(issue_probs)
        severity_idx = np.argmax(severity_probs)

        # Get class names
        issue_type = ISSUE_CLASSES[issue_idx]
        severity = SEVERITY_CLASSES[severity_idx]

        # Confidence is the maximum softmax probability from issue type output
        confidence = float(issue_probs[issue_idx])

        # Optional: include severity confidence
        severity_confidence = float(severity_probs[severity_idx])

        return {
            "issue_type": issue_type,
            "severity": severity,
            "confidence": confidence,
            "severity_confidence": severity_confidence,  # Optional extra info
        }

    except Exception as e:
        raise RuntimeError(f"Model inference failed: {e}")


# -------------------------
# API Endpoints
# -------------------------
@app.post("/predict", response_model=PredictionResponse)
async def predict_issue(file: UploadFile = File(...)) -> PredictionResponse:
    """
    POST /predict

    Accepts an image file upload and returns:
    - Issue type classification
    - Severity prediction
    - Confidence score

    Args:
        file: Uploaded image file (multipart/form-data)

    Returns:
        JSON response with predictions

    Raises:
        HTTPException: For invalid file types or processing errors
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1]
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    try:
        # Read uploaded file
        image_bytes = await file.read()

        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file uploaded",
            )

        # Preprocess image
        image_array = preprocess_image(image_bytes)

        # Run prediction
        result = predict_issue_and_severity(image_array)

        # Return response (exclude optional severity_confidence from main response)
        return PredictionResponse(
            issue_type=result["issue_type"],
            severity=result["severity"],
            confidence=result["confidence"],
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image processing error: {str(e)}",
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model inference error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    GET /health

    Health check endpoint to verify service status and model availability.

    Returns:
        JSON response with service status
    """
    model_loaded = model is not None

    return HealthResponse(
        status="healthy" if model_loaded else "model_not_loaded",
        model_loaded=model_loaded,
    )


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Civic Issue Detection API",
        "version": "1.0.0",
        "endpoints": {
            "predict": "POST /predict - Upload image for classification",
            "health": "GET /health - Service health check",
        },
    }


# -------------------------
# Main Entry Point
# -------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
