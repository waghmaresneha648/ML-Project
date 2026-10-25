from pathlib import Path
import json

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# Find files inside the ml-service folder
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "house_data.csv"
MODEL_FILE = BASE_DIR / "model.pkl"
MODEL_NAME_FILE = BASE_DIR / "best_model_name.pkl"
METRICS_FILE = BASE_DIR / "model_metrics.json"


def main():
    # 1. Load the dataset
    data = pd.read_csv(DATA_FILE)

    required_columns = ["area", "bedrooms", "price"]

    if not all(column in data.columns for column in required_columns):
        raise ValueError(
            "house_data.csv must contain area, bedrooms, and price columns."
        )

    data = data[required_columns].apply(pd.to_numeric, errors="coerce")
    data = data.dropna()

    if len(data) < 5:
        raise ValueError("At least 5 valid rows are required to train the model.")

    X = data[["area", "bedrooms"]]
    y = data["price"]

    # 2. Split data into training and testing portions
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    # 3. Define the models we want to compare
    models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(
            max_depth=3,
            random_state=42
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=100,
            max_depth=3,
            random_state=42
        )
    }

    # 4. Compare models using cross-validation on training data
    number_of_splits = min(5, len(X_train))

    if number_of_splits < 2:
        raise ValueError("Not enough training rows for cross-validation.")

    cross_validation = KFold(
        n_splits=number_of_splits,
        shuffle=True,
        random_state=42
    )

    model_results = {}

    print("\n--- Model Comparison ---")

    for name, model in models.items():
        scores = cross_val_score(
            model,
            X_train,
            y_train,
            cv=cross_validation,
            scoring="neg_mean_absolute_error"
        )

        average_mae = float(-scores.mean())
        model_results[name] = average_mae

        print(f"{name}: Cross-validation MAE = {average_mae:.2f}")

    # Lower MAE means smaller average prediction errors
    best_model_name = min(model_results, key=model_results.get)
    best_model = models[best_model_name]

    # 5. Evaluate the selected model on the separate test set
    best_model.fit(X_train, y_train)
    test_predictions = best_model.predict(X_test)

    test_mae = float(mean_absolute_error(y_test, test_predictions))
    test_rmse = float(mean_squared_error(y_test, test_predictions) ** 0.5)

    # R² is not meaningful with fewer than two test samples
    if len(y_test) >= 2:
        test_r2 = float(r2_score(y_test, test_predictions))
    else:
        test_r2 = None

    print("\n--- Selected Model ---")
    print(f"Best Model: {best_model_name}")
    print(f"Test MAE: {test_mae:.2f}")
    print(f"Test RMSE: {test_rmse:.2f}")

    if test_r2 is not None:
        print(f"Test R²: {test_r2:.4f}")
    else:
        print("Test R²: Not available (fewer than 2 test rows)")

    # 6. Train the selected model on all valid rows for future predictions
    best_model.fit(X, y)

    # 7. Save the trained model and its name
    joblib.dump(best_model, MODEL_FILE)
    joblib.dump(best_model_name, MODEL_NAME_FILE)

    # 8. Save evaluation information as JSON for the API
    metrics = {
        "selected_model": best_model_name,
        "test_mae": round(test_mae, 4),
        "test_rmse": round(test_rmse, 4),
        "test_r2": round(test_r2, 4) if test_r2 is not None else None,
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "total_valid_rows": int(len(data)),
        "features": ["area", "bedrooms"],
        "target": "price",
        "cross_validation_mae": {
            name: round(score, 4)
            for name, score in model_results.items()
        },
        "note": (
            "Evaluation uses a small dataset. Metrics are preliminary "
            "and may not reflect real-world performance."
        )
    }

    with open(METRICS_FILE, "w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=4)

    print(f"\nSaved trained model to: {MODEL_FILE}")
    print(f"Saved model name to: {MODEL_NAME_FILE}")
    print(f"Saved evaluation results to: {METRICS_FILE}")


if __name__ == "__main__":
    main()