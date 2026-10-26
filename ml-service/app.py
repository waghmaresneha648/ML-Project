
from pathlib import Path
import json
import math
import uuid

import joblib
import pandas as pd
from flask import Flask, request, jsonify

from general_trainer import recommend_models, train_general_model


app = Flask(__name__)

# Locate existing house-price model files
BASE_DIR = Path(__file__).resolve().parent

MODEL_FILE = BASE_DIR / "model.pkl"
MODEL_NAME_FILE = BASE_DIR / "best_model_name.pkl"
METRICS_FILE = BASE_DIR / "model_metrics.json"

# Load the existing house-price model
model = joblib.load(MODEL_FILE)

if MODEL_NAME_FILE.exists():
    model_name = joblib.load(MODEL_NAME_FILE)
else:
    model_name = type(model).__name__


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "ML Service is running!",
        "model": model_name,
        "general_ml_enabled": True
    })


@app.route("/model-info", methods=["GET"])
def model_info():
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


# Read and validate an uploaded CSV file
def read_uploaded_csv():
    uploaded_file = request.files.get("file")

    if uploaded_file is None or not uploaded_file.filename:
        return None, (
            jsonify({"error": "Please upload a CSV file using the 'file' field."}),
            400
        )

    if not uploaded_file.filename.lower().endswith(".csv"):
        return None, (
            jsonify({"error": "Only CSV files are supported."}),
            400
        )

    try:
        data = pd.read_csv(uploaded_file)

        if data.empty:
            return None, (
                jsonify({"error": "The uploaded CSV has no data rows."}),
                400
            )

        if len(data.columns) < 2:
            return None, (
                jsonify({
                    "error": "The CSV must contain at least one feature column and one target column."
                }),
                400
            )

        if data.columns.duplicated().any():
            return None, (
                jsonify({"error": "The CSV contains duplicate column names."}),
                400
            )

        return data, None

    except Exception:
        return None, (
            jsonify({
                "error": "Could not read this CSV. Check that it is a valid CSV file."
            }),
            400
        )


# Recommend suitable ML algorithms for a CSV target column
@app.route("/general/recommend", methods=["POST"])
def general_recommend():
    data, error = read_uploaded_csv()

    if error:
        return error

    target_column = request.form.get("target_column", "").strip()
    task = request.form.get("task", "auto").strip().lower()

    if target_column not in data.columns:
        return jsonify({
            "error": "Choose a valid target_column from the CSV.",
            "available_columns": list(data.columns)
        }), 400

    if task not in ("auto", "classification", "regression"):
        return jsonify({
            "error": "Task must be auto, classification, or regression."
        }), 400

    try:
        result = recommend_models(
            data=data,
            target_column=target_column,
            task=task
        )
        return jsonify(result)

    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400

    except Exception:
        app.logger.exception("General ML recommendation failed")
        return jsonify({
            "error": "Could not recommend models for this dataset."
        }), 500


# Train and compare selected general-purpose ML algorithms
@app.route("/general/train", methods=["POST"])
def general_train():
    data, error = read_uploaded_csv()

    if error:
        return error

    target_column = request.form.get("target_column", "").strip()
    task = request.form.get("task", "auto").strip().lower()
    selected_models_text = request.form.get("selected_models", "").strip()

    if target_column not in data.columns:
        return jsonify({
            "error": "Choose a valid target_column from the CSV.",
            "available_columns": list(data.columns)
        }), 400

    if task not in ("auto", "classification", "regression"):
        return jsonify({
            "error": "Task must be auto, classification, or regression."
        }), 400

    selected_models = None

    if selected_models_text:
        try:
            selected_models = json.loads(selected_models_text)

            if (
                not isinstance(selected_models, list)
                or not all(isinstance(name, str) for name in selected_models)
            ):
                raise ValueError
        except (json.JSONDecodeError, ValueError):
            return jsonify({
                "error": "selected_models must be a JSON list of model names."
            }), 400

    try:
        result = train_general_model(
            data=data,
            target_column=target_column,
            task=task,
            selected_models=selected_models
        )

        return jsonify(result), 200

    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400

    except Exception:
        app.logger.exception("General ML training failed")
        return jsonify({
            "error": "Training failed. Check the ML service terminal for details."
        }), 500


if __name__ == "__main__":
    app.run(port=8000, debug=True)

