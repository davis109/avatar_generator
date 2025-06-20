# AI Avatar Generator

A full-stack web application that generates stylized avatars using the Segmind Stable Diffusion API.

## Features

- Upload and preview images
- Choose from multiple avatar styles (Anime, Cyberpunk, Fantasy, Business)
- Real-time avatar generation
- Download and share generated avatars
- Modern, responsive UI with Chakra UI

## Setup

### Backend (FastAPI)

1. Create a virtual environment and activate it:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the `backend` directory with:
```
SEGMIND_API_KEY=your_api_key_here
CORS_ORIGIN=http://localhost:5173
```

4. Start the backend server:
```bash
uvicorn main:app --reload
```

### Frontend (React)

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

## API Integration

The application uses the Segmind Stable Diffusion API for avatar generation. Make sure to:
1. Sign up at https://segmind.com
2. Get your API key
3. Add it to the backend's `.env` file

## Available Styles

- Anime: Anime-style portrait with vibrant colors
- Cyberpunk: Futuristic portrait with neon aesthetics
- Fantasy: Magical and ethereal portrait
- Business: Professional corporate-style portrait

## Error Handling

The application includes error handling for:
- Invalid file types
- API failures
- Network issues
- Browser compatibility (Web Share API)

## Contributing

Feel free to submit issues and enhancement requests! 