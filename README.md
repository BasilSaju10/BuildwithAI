# 🍎 Fruit Stage Detector

An AI-powered web application that uses your webcam and **Google Gemini 1.5 Flash** to analyze the ripeness and condition of any fruit in real-time.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)

## ✨ Features
- **Real-time Webcam Analysis**: Identify fruits and detect their ripeness stage (1-7).
- **Photo Upload**: Analyze existing fruit images from your device.
- **Smart Model Fallback**: Automatically switches between Gemini models (2.5, 2.0, 1.5) to handle quota limits.
- **Modern UI**: A sleek, dark-themed responsive interface with glassmorphism effects.
- **Voice Feedback**: Speaks the analysis results aloud.

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python, Flask, Flask-CORS
- **AI**: Google Generative AI (Gemini API)

## 🚀 Local Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/fruit-stage-detector.git
   cd fruit-stage-detector
   ```

2. **Install Dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
   ```

4. **Run the Application**
   ```bash
   python backend/app.py
   ```
   Open `http://127.0.0.1:5000` in your browser.

## 🌐 Deployment

This project is configured for easy deployment on **[Render](https://render.com)** or **Railway**.
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `gunicorn --chdir backend wsgi:app`

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
