from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
from typing import Optional
import base64
from io import BytesIO
from PIL import Image
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API config
SEGMIND_API_KEY = os.getenv("SEGMIND_API_KEY", "SG_14ad6b22f5e1342e")
SEGMIND_API_URL = "https://api.segmind.com/v1/potraitsd1.5-txt2img"

# Style prompts
STYLE_PROMPTS = {
    "anime": "portrait photo of anime character, highly detailed face, beautiful lighting, studio ghibli style, professional photography",
    "cyberpunk": "portrait photo of cyberpunk character, detailed face, neon lighting, futuristic, professional studio photography",
    "fantasy": "portrait photo of fantasy character, detailed face, ethereal lighting, mystical atmosphere, professional photography",
    "business": "professional headshot portrait, business attire, neutral background, studio lighting, professional photography"
}

@app.post("/generate-avatar")
async def generate_avatar(file: UploadFile, style: str):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    if style not in STYLE_PROMPTS:
        raise HTTPException(status_code=400, detail="Invalid style selected")

    try:
        contents = await file.read()
        logger.info(f"File read successfully, size: {len(contents)} bytes")

        image = Image.open(BytesIO(contents))
        logger.info(f"Image opened successfully, format: {image.format}, size: {image.size}")

        # Convert image to base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        logger.info("Image converted to base64 successfully")

        # Compose prompt
        prompt = f"{STYLE_PROMPTS[style]}, masterpiece, best quality"
        logger.info(f"Using prompt: {prompt}")

        # Prepare request to Segmind
        headers = {
            "x-api-key": SEGMIND_API_KEY,
            "Content-Type": "application/json"
        }

        payload = {
            "prompt": prompt,
            "negative_prompt": "ugly, blurry, deformed, low quality",
            "image": img_str,
            "samples": 1,
            "num_inference_steps": 20,
            "guidance_scale": 7.0,
            "strength": 0.7,
            "img_width": 512,
            "img_height": 768,
            "base64": True
        }

        logger.info("Sending request to Segmind API...")
        response = requests.post(SEGMIND_API_URL, headers=headers, json=payload, timeout=30)
        logger.info(f"Segmind API response status code: {response.status_code}")

        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="Rate limit exceeded on Segmind API.")
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired API key.")
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="The requested model endpoint is not available.")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        data = response.json()
        image_base64 = data.get("images", [None])[0]
        if not image_base64:
            raise HTTPException(status_code=500, detail="Segmind API returned no image.")

        return {"image_base64": image_base64}

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/rate-limit-status")
def rate_limit_status():
    return {"status": "no rate limit logic on backend"}
