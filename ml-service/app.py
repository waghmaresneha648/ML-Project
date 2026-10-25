from pathlib import Path
import json
import math

import joblib
import pandas as pd
from flask import Flask, request, jsonify


app = Flask(__name__)

# Locate the files in this folder
BASE_DIR = Path(__file__).resolve().parent

MODEL_FILE = BASE_DIR / "model.pkl"
MODEL_NAME_FILE = BASE_DIR / "best_model_name.pkl"
METRICS_FILE = BASE_DIR / "model_metrics.json"

# Load the trained model
model = joblib.load(MODEL_FILE)

# Load the actual selected model name, if available
if MODEL_NAME_FILE.exists():
    model_name = joblib.load(MODEL_NAME_FILE)
else:
    model_name = type(model).__name__


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "ML Service is running!",
        "model": model_name
    })


@app.route("/model-info", methods=["GET"])
def model_info():
    # Read the evaluation results created by train_model.py
    if not METRICS_FILE.exists():
        return jsonify({
            "error": "Model evaluation results not found.",
            "instruction": "Run python train_model.py first."
        }), 404

    with open(METRICS_FILE, "r", encoding="utf-8") as file:
        metrics = json.load(file)

    return jsonify(metrics)


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Please send a valid JSON object."
        }), 400

    try:
        area = float(data["area"])
        bedrooms = float(data["bedrooms"])
    except (KeyError, TypeError, ValueError):
        return jsonify({
            "error": "Provide numeric area and bedrooms values."
        }), 400

    if (
        not math.isfinite(area)
        or not math.isfinite(bedrooms)
        or area <= 0
        or bedrooms <= 0
    ):
        return jsonify({
            "error": "Area and bedrooms must be positive numbers."
        }), 400

    # Use named columns to match the model's training features
    input_data = pd.DataFrame(
        [[area, bedrooms]],
        columns=["area", "bedrooms"]
    )

    prediction = model.predict(input_data)

    return jsonify({
        "area": area,
        "bedrooms": bedrooms,
        "predicted_price": round(float(prediction[0]), 2),
        "model": model_name
    })


if __name__ == "__main__":
    app.run(port=8000, debug=True)
