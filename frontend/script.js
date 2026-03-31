// Elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const btnText = document.querySelector('.btn-text');
const spinner = document.querySelector('.spinner');
const autoCaptureToggle = document.getElementById('auto-capture-toggle');
const photoUpload = document.getElementById('photo-upload');
const uploadPreview = document.getElementById('upload-preview');
const cameraToggleBtn = document.getElementById('camera-toggle-btn');

const resultsData = document.getElementById('results-data');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');

const resFruit = document.getElementById('res-fruit');
const resStage = document.getElementById('res-stage');
const resCondition = document.getElementById('res-condition');
const resConfidence = document.getElementById('res-confidence');
const resSuggestion = document.getElementById('res-suggestion');

// State
let isWebcamInitialized = false;
let uploadedImageBase64 = null; // stores uploaded image base64
let autoCaptureInterval = null;
const API_URL = '/analyze';

// Initialize Webcam
function setupWebcam() {
    return new Promise(async (resolve) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false 
            });
            video.srcObject = stream;
            isWebcamInitialized = true;
            resolve(true);
        } catch (err) {
            console.error("Error accessing webcam:", err);
            showError("Webcam access denied or unavailable. Please allow camera permissions.");
            captureBtn.disabled = true;
            resolve(false);
        }
    });
}

// Start app
setupWebcam();

// Main capture function
async function captureAndAnalyze() {
    // If an image was uploaded, use that instead of webcam
    if (uploadedImageBase64) {
        setLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: uploadedImageBase64 })
            });
            const data = await response.json();
            if (response.ok && !data.error) {
                updateResults(data);
            } else {
                showError(data.error || "Analysis failed. Please try again.");
            }
        } catch (err) {
            console.error("API Error:", err);
            showError("Ensure the backend API is running at " + API_URL);
        } finally {
            setLoading(false);
        }
        return;
    }

    if (!isWebcamInitialized) return;

    // Set UI to loading state
    setLoading(true);

    try {
        // Draw video frame to canvas
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get Base64 image
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

        // Send to API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageBase64 })
        });

        const data = await response.json();

        if (response.ok && !data.error) {
            updateResults(data);
        } else {
            showError(data.error || "Analysis failed. Please try again.");
        }
    } catch (err) {
        console.error("API Error:", err);
        showError("Ensure the backend API is running at " + API_URL);
    } finally {
        setLoading(false);
    }
}

// UI State Management
function setLoading(isLoading) {
    if (isLoading) {
        captureBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        
        resultsData.classList.add('hidden');
        errorState.classList.add('hidden');
        loadingState.classList.remove('hidden');
    } else {
        // Only re-enable capture if camera is on OR we have an uploaded image
        if (cameraOn || uploadedImageBase64) {
            captureBtn.disabled = false;
        }
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        
        loadingState.classList.add('hidden');
    }
}

function updateResults(data) {
    resultsData.classList.remove('hidden');
    errorState.classList.add('hidden');

    // Add pulse animation
    [resFruit, resStage, resCondition, resConfidence, resSuggestion].forEach(el => {
        el.classList.remove('pulse-update');
        // Trigger reflow
        void el.offsetWidth;
        el.classList.add('pulse-update');
    });

    const stageMap = {
        1: "Stage 1 - Fully Green / Unripe",
        2: "Stage 2 - Early Stage",
        3: "Stage 3 - Turning Color",
        4: "Stage 4 - Ripe / Ready",
        5: "Stage 5 - Overripe / Spotty",
        6: "Stage 6 - Very Overripe",
        7: "Stage 7 - Rotten"
    };

    // Safely update DOM
    resFruit.textContent = data.fruit || "Unknown Fruit";
    resStage.textContent = stageMap[data.stage] || `Stage ${data.stage}`;
    resCondition.textContent = data.condition || "--";
    resConfidence.textContent = `${data.confidence || "--"}%`;
    resSuggestion.textContent = data.suggestion || "--";

    // Speech synthesis for suggestion
    speak(data.suggestion);
}

function showError(msg) {
    resultsData.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorMessage.textContent = msg;
}

// Speech functionality
function speak(text) {
    if ('speechSynthesis' in window && text) {
        // Only speak if user has interacted with the document (browser policy)
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// Event Listeners
captureBtn.addEventListener('click', captureAndAnalyze);

autoCaptureToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        autoCaptureInterval = setInterval(captureAndAnalyze, 5000);
    } else {
        clearInterval(autoCaptureInterval);
    }
});

// Photo Upload Handler
photoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        uploadedImageBase64 = evt.target.result; // full data URL

        // Show the uploaded image preview, hide the webcam
        uploadPreview.src = uploadedImageBase64;
        uploadPreview.style.display = 'block';
        video.style.display = 'none';

        // Auto-analyze the uploaded photo
        captureAndAnalyze();
    };
    reader.readAsDataURL(file);

    // Reset file input so same file can be re-selected
    e.target.value = '';
});

// Camera Toggle Handler
let cameraOn = true;

cameraToggleBtn.addEventListener('click', async () => {
    if (cameraOn) {
        // Turn OFF camera — stop all tracks
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        video.style.display = 'none';
        isWebcamInitialized = false;
        cameraOn = false;
        captureBtn.disabled = true;
        cameraToggleBtn.textContent = '📷 Turn On Camera';
        cameraToggleBtn.classList.add('cam-off');
    } else {
        // Turn ON camera — restart stream
        video.style.display = 'block';
        uploadPreview.style.display = 'none';
        uploadedImageBase64 = null;
        const success = await setupWebcam();
        if (success) captureBtn.disabled = false;
        cameraOn = true;
        cameraToggleBtn.textContent = '📷 Turn Off Camera';
        cameraToggleBtn.classList.remove('cam-off');
    }
});
