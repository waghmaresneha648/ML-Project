from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)


# Load the trained ML model
model = joblib.load("model.pkl")


@app.route("/")
def home():
    return jsonify({
        "message": "ML Service is running!"
    })


@app.route("/predict", methods=["POST"])
def predict():

    # Get data sent by the user
    data = request.get_json()

    area = data["area"]
    bedrooms = data["bedrooms"]

    # Give the data to our ML model
    prediction = model.predict([[area, bedrooms]])

    # Send prediction back
    return jsonify({
        "area": area,
        "bedrooms": bedrooms,
        "predicted_price": round(float(prediction[0]), 2)
    })


if __name__ == "__main__":
    app.run(port=8000, debug=True)