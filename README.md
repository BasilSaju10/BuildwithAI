# 🍎 Fruit Stage Detector

## Problem Statement
Identifying the ripeness and condition of fruits can be subjective and challenging for consumers. Incorrect assessments often lead to premature consumption of unripe fruit or avoidable food waste when overripe fruit is discarded.

## Project Description
**Fruit Stage Detector** is an AI-powered web application designed to help users accurately assess fruit ripeness in real-time. By leveraging the power of **Google Gemini AI**, the app analyzes images captured via webcam or uploaded from a device to provide:
- **Fruit Identification**: Automatically recognizes the type of fruit.
- **Ripeness Classification**: Assigns a ripeness stage from 1 (Unripe) to 7 (Rotten).
- **Condition Assessment**: Categorizes the fruit as Fresh, Ripe, Overripe, or Rotten.
- **Smart Suggestions**: Provides actionable advice like "Eat now," "Use for smoothies," or "Discard."

## Google AI Usage

### Tools / Models Used
- **Google Gemini 1.5 Flash**: Primary model for fast, efficient multimodal analysis.
- **Google Gemini 2.5 Flash / 2.0 Flash**: High-performance fallback models for enhanced reliability.
- **Google Generative AI SDK**: Used for seamless integration with the Gemini API.

### How Google AI Was Used
The application utilizes Gemini's **Multimodal (Vision)** capabilities. When a user captures or uploads an image, the backend sends the image data along with a structured prompt to the Gemini API. Gemini analyzes the visual cues (color, texture, spots) to return a structured JSON response containing the fruit's identity and ripeness details.

## Proof of Google AI Usage
The application successfully integrates with Gemini API to provide real-time analysis.

![AI Proof](proof/screenshot1.png)

## Screenshots
### Main Interface
![App Screenshot](screenshots/screenshot1.png)

## Demo Video
[Watch Demo](https://github.com/BasilSaju10/Fruit-Stage-Detector) *(Placeholder: Add your screen recording link here)*

## Installation Steps

### 1. Clone the repository
```bash
git clone https://github.com/BasilSaju10/Fruit-Stage-Detector.git
cd fruit-stage-detector
```

### 2. Install dependencies
```bash
# It is recommended to use a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
```

### 4. Run the application
```bash
python backend/app.py
```
Open **http://127.0.0.1:5000** in your browser.
