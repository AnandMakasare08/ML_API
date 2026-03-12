# 🌿 Plant Disease Detection — Setup Guide

## 📁 Project Structure
```
plant_disease_backend/
├── app.py               ← Flask API
├── requirements.txt     ← Python dependencies
├── render.yaml          ← Render config
└── model.h5             ← Your Keras model (you add this)
```

---

## 🖥️ Step 1: Test Locally First

```bash
# Install dependencies
pip install -r requirements.txt

# Put your model.h5 in the same folder as app.py

# Run Flask locally
python app.py

# Test it works (in another terminal)
curl -X POST http://localhost:5000/predict \
  -F "image=@your_leaf_photo.jpg"
```

---

## 🚀 Step 2: Deploy to Render (Free)

1. Push your backend folder to a **GitHub repo**
   - Include: `app.py`, `requirements.txt`, `render.yaml`, `model.h5`

2. Go to **https://render.com** → Sign up free

3. Click **"New +"** → **"Web Service"**

4. Connect your GitHub repo

5. Fill in settings:
   - **Name:** plant-disease-api
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free

6. Click **"Create Web Service"**

7. Wait ~3 mins for deployment

8. Your API URL will be:
   `https://plant-disease-api.onrender.com`

---

## 📱 Step 3: Connect React Native

1. Copy `PlantDiseaseScreen.jsx` into your Expo project

2. Install image picker:
```bash
npx expo install expo-image-picker
```

3. Open `PlantDiseaseScreen.jsx` and replace:
```js
const API_URL = "https://your-app-name.onrender.com/predict";
// ↓ with your actual Render URL
const API_URL = "https://plant-disease-api.onrender.com/predict";
```

4. Import and use in your app:
```js
import PlantDiseaseScreen from './PlantDiseaseScreen';
```

---

## ⚠️ Important Notes

- **model.h5 file size:** Render free tier has 512MB RAM.
  If your model is large (>200MB), consider using `model.tflite` 
  converted to a lighter format, or upgrade to a paid tier.

- **Cold starts:** Render free tier sleeps after 15 mins of inactivity.
  First request may take 30-60 seconds to wake up. Show a loading spinner!

- **Image normalization:** The backend divides pixel values by 255.0
  Make sure this matches how you trained your model.
  If you used a different normalization (e.g. [-1, 1]), update app.py:
  ```python
  img_array = (np.array(img) / 127.5) - 1.0  # for [-1, 1] range
  ```

---

## 🧪 Test the API

Once deployed, test via browser or Postman:
- GET  `https://your-app.onrender.com/`         → Health check
- POST `https://your-app.onrender.com/predict`  → Send image, get prediction
