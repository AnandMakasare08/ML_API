import gdown
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import io

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow.lite as tflite

app = Flask(__name__)
CORS(app)

MODEL_PATH = "plant_model.tflite"
FILE_ID = "1lfEs9qA0WCltRud__cQLS2ErMI9ws53b"

if not os.path.exists(MODEL_PATH):
    print("⬇️ Downloading TFLite model from Google Drive...")
    url = f"https://drive.google.com/uc?id={FILE_ID}"

    gdown.download(url, MODEL_PATH, quiet=False, fuzzy=True)

    if not os.path.exists(MODEL_PATH) or os.path.getsize(MODEL_PATH) < 1000:
        print("❌ Model download failed!")
        raise Exception("Model download failed — check Google Drive permissions")

    print("✅ Model downloaded successfully!")

# ✅ Fixed — using tflite.Interpreter not tf.lite.Interpreter
print("⏳ Loading TFLite model...")
interpreter = tflite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
print("✅ Model ready!")

CLASS_NAMES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy',
    'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy',
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
    'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
    'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
]

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((128, 128))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Plant Disease Detection API is running 🌱"})

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    try:
        image = request.files["image"].read()
        img_array = preprocess_image(image)

        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        predictions = interpreter.get_tensor(output_details[0]['index'])

        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0])) * 100
        label = CLASS_NAMES[predicted_index]

        return jsonify({
            "label": label,
            "confidence": round(confidence, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)