import os
import json
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
import io
from PIL import Image

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

# Path to the frontend directory
front_end_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

@app.route('/')
def index():
    return send_from_directory(front_end_dir, 'index.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory(front_end_dir, path)

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("WARNING: GEMINI_API_KEY not found in environment.")

# Set up the generation config
generation_config = {
  "temperature": 0.4,
  "top_p": 1,
  "top_k": 32,
  "max_output_tokens": 1024,
}

# Dynamically fetch available models
print("--- Available Gemini Models ---")
available_models = []
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
            available_models.append(m.name)
except Exception as e:
    print("Warning: Could not fetch models list:", e)

# Select best model — prefer multimodal (vision) flash models
preferred_models = [
    "models/gemini-2.5-flash",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-lite",
    "models/gemini-1.5-flash",
    "models/gemini-flash-latest",
]
selected_model_name = None

for pm in preferred_models:
    if pm in available_models:
        selected_model_name = pm
        break

if not selected_model_name and available_models:
    selected_model_name = available_models[0]
elif not selected_model_name:
    print("ERROR: No valid Gemini model found or API key restricted. Using fallback.")
    selected_model_name = "models/gemini-1.5-flash"

# Strip 'models/' prefix if present for GenerativeModel arg
clean_model_name = selected_model_name.replace("models/", "") if selected_model_name.startswith("models/") else selected_model_name
print(f"--- Initializing Selected Model: {clean_model_name} ---")

model = genai.GenerativeModel(
  model_name=clean_model_name,
  generation_config=generation_config,
)

@app.route('/analyze', methods=['POST'])
def analyze_fruit():
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided. Must be a base64 string."}), 400
        
        # Remove data URIs (e.g., 'data:image/jpeg;base64,') if it was passed by mistake
        base64_str = data['image']
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
            
        decoded_image = base64.b64decode(base64_str)
        
        # Load the image robustly using PIL
        img = Image.open(io.BytesIO(decoded_image))
        
        prompt = """
        Analyze this fruit image. First, identify the type of fruit. Then classify its ripeness stage from 1 to 7:
          1: Fully Green / Unripe
          2: Early Stage / Turning
          3: Almost Ripe
          4: Ripe (Ready to Eat)
          5: Overripe / Spotty
          6: Significantly Overripe
          7: Rotten
        Also return condition (Fresh, Ripe, Overripe, Rotten), confidence percentage (integer 0-100), and a short suggestion (e.g., "Eat now", "Use for smoothies", "Discard").
        Respond in JSON format with exactly these five keys: "fruit", "stage", "condition", "confidence", "suggestion". 
        If it's not a fruit or no fruit is detected, return an error message in a JSON key "error".
        """
        
        # Identify models to try: started with selected_model_name, then others in preferred
        models_to_try = []
        if selected_model_name:
            models_to_try.append(selected_model_name)
        for pm in preferred_models:
            if pm in available_models and pm not in models_to_try:
                models_to_try.append(pm)
        
        last_error = None
        for model_name in models_to_try:
            try:
                clean_name = model_name.replace("models/", "") if model_name.startswith("models/") else model_name
                print(f"--- Attempting Analysis with: {clean_name} ---")
                
                # Initialize model for this attempt
                current_model = genai.GenerativeModel(
                    model_name=clean_name,
                    generation_config=generation_config
                )
                
                response = current_model.generate_content([prompt, img])
                response_text = response.text.strip()
                
                # Robustly strip markdown code fences if present
                if response_text.startswith("```"):
                    lines = response_text.splitlines()
                    lines = lines[1:] if lines[0].startswith("```") else lines
                    if lines and lines[-1].strip() == "```":
                        lines = lines[:-1]
                    response_text = "\n".join(lines).strip()
                
                # Parse text into JSON to ensure it's valid
                parsed_json = json.loads(response_text)
                return jsonify(parsed_json), 200
                
            except Exception as e:
                err_msg = str(e)
                print(f"Warning: Model {model_name} failed: {err_msg}")
                last_error = err_msg
                # If it's a quota issue (429), try next
                if "429" in err_msg or "quota" in err_msg.lower():
                    continue
                else:
                    # For other errors, we might still want to try another model 
                    # but if it's an image error it might persist. We'll fallback anyway.
                    continue
        
        # If we reach here, all models failed
        return jsonify({"error": f"All models failed. Last error: {last_error}"}), 500

    except Exception as e:
        print("Error during analysis handler:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start the Flask app
    app.run(host="127.0.0.1", port=5000, debug=True)
