
from pathlib import Path
import json
import uuid

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "general_models"
MODEL_DIR.mkdir(exist_ok=True)


def recommend_models(data, target_column, task="auto"):
    """Inspect a dataset and recommend algorithms for its target."""

    if not isinstance(data, pd.DataFrame) or data.empty:
        raise ValueError("Please provide a non-empty CSV dataset.")

    if target_column not in data.columns:
        raise ValueError("The selected target column does not exist.")

    if len(data.columns) < 2:
        raise ValueError("At least one feature and one target column are required.")

    if task not in ("auto", "regression", "classification"):
        raise ValueError("Task must be auto, regression, or classification.")

    cleaned = data.dropna(subset=[target_column]).copy()
    target = cleaned[target_column]

    if len(cleaned) < 10:
        raise ValueError("At least 10 valid target rows are required.")

    if target.nunique() < 2:
        raise ValueError("The target column must contain at least two different values.")

    
    
    if task == "auto":
        if pd.api.types.is_numeric_dtype(target):
            task = "regression"
        else:
            task = "classification"
            
    if task == "regression":
        numeric_target = pd.to_numeric(target, errors="coerce")
        if numeric_target.isna().any():
            raise ValueError(
                "Regression requires a numeric target column. "
                "Choose classification for category targets."
            )
        if numeric_target.nunique() < 2:
            raise ValueError("The regression target must vary.")
        task = "regression"

    algorithms = (
        [
            {
                "name": "Linear Regression",
                "reason": "A useful baseline for predicting numeric values "
                          "when relationships are approximately linear.",
                "strength": "Simple and interpretable.",
                "limitation": "May miss complex nonlinear patterns.",
            },
            {
                "name": "Decision Tree Regressor",
                "reason": "Can learn nonlinear patterns and decision rules.",
                "strength": "Easy to explain and supports nonlinear relationships.",
                "limitation": "Can overfit small datasets.",
            },
            {
                "name": "Random Forest Regressor",
                "reason": "Combines multiple trees to model more complex patterns.",
                "strength": "Often a strong choice for structured tabular data.",
                "limitation": "Less interpretable and can require more computation.",
            },
        ]
        if task == "regression"
        else [
            {
                "name": "Logistic Regression",
                "reason": "A useful baseline for predicting categories.",
                "strength": "Fast and relatively interpretable.",
                "limitation": "May struggle with complex nonlinear boundaries.",
            },
            {
                "name": "Decision Tree Classifier",
                "reason": "Learns rules that separate target categories.",
                "strength": "Can model nonlinear patterns and is easy to explain.",
                "limitation": "Can overfit small datasets.",
            },
            {
                "name": "Random Forest Classifier",
                "reason": "Combines multiple trees for category prediction.",
                "strength": "Often effective on structured tabular data.",
                "limitation": "Uses more computation and is less interpretable.",
            },
        ]
    )

    return {
        "task": task,
        "target": target_column,
        "rows_available": int(len(cleaned)),
        "features": [
            column for column in cleaned.columns
            if column != target_column
        ],
        "recommendations": algorithms,
        "recommendation_note": (
            "These are initial recommendations based on the task type, "
            "not guaranteed winners. Compare validation results before choosing."
        ),
    }


def train_general_model(
    data,
    target_column,
    task="auto",
    selected_models=None,
):
    """
    Train the algorithms selected by the user.

    selected_models can be a list of algorithm names.
    If omitted, all recommended algorithms are compared.
    """

    recommendation = recommend_models(data, target_column, task)
    task = recommendation["task"]

    cleaned = data.dropna(subset=[target_column]).copy()
    X = cleaned.drop(columns=[target_column])
    y = cleaned[target_column]

    if X.shape[1] == 0:
        raise ValueError("No feature columns remain after selecting the target.")

    # Convert numeric-looking feature text into numbers when appropriate.
    for column in X.columns:
        if X[column].dtype == "object":
            converted = pd.to_numeric(X[column], errors="coerce")
            if converted.notna().mean() >= 0.8:
                X[column] = converted

    # Remove feature columns that contain no usable values.
    X = X.dropna(axis=1, how="all")
    if X.shape[1] == 0:
        raise ValueError("No usable feature columns were found.")

    label_encoder = None

    if task == "classification":
        y = y.astype(str)
        if y.nunique() < 2:
            raise ValueError("Classification needs at least two target classes.")
        label_encoder = LabelEncoder()
        y = pd.Series(
            label_encoder.fit_transform(y),
            index=y.index,
            name=target_column,
        )
    else:
        y = pd.to_numeric(y, errors="coerce")
        valid = y.notna()
        X = X.loc[valid]
        y = y.loc[valid]
        if len(y) < 10:
            raise ValueError("At least 10 valid numeric target rows are required.")

    numeric_columns = X.select_dtypes(include=["number"]).columns.tolist()
    categorical_columns = X.select_dtypes(exclude=["number"]).columns.tolist()

    transformers = []

    if numeric_columns:
        transformers.append((
            "numeric",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]),
            numeric_columns,
        ))

    if categorical_columns:
        transformers.append((
            "categorical",
            Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("encoder", OneHotEncoder(handle_unknown="ignore")),
            ]),
            categorical_columns,
        ))

    preprocessor = ColumnTransformer(transformers=transformers)

    model_options = (
        {
            "Linear Regression": LinearRegression(),
            "Decision Tree Regressor": DecisionTreeRegressor(
                max_depth=5, random_state=42
            ),
            "Random Forest Regressor": RandomForestRegressor(
                n_estimators=100, random_state=42
            ),
        }
        if task == "regression"
        else {
            "Logistic Regression": LogisticRegression(max_iter=1000),
            "Decision Tree Classifier": DecisionTreeClassifier(
                max_depth=5, random_state=42
            ),
            "Random Forest Classifier": RandomForestClassifier(
                n_estimators=100, random_state=42
            ),
        }
    )

    if selected_models is None:
        selected_models = list(model_options.keys())

    if isinstance(selected_models, str) or not selected_models:
        raise ValueError("Select at least one algorithm from the list.")

    invalid_models = [
        name for name in selected_models if name not in model_options
    ]
    if invalid_models:
        raise ValueError(
            "Unsupported algorithm selection: " + ", ".join(invalid_models)
        )

    selected_models = list(dict.fromkeys(selected_models))

    # Split off test data before comparing algorithms.
    stratify = None
    if task == "classification":
        counts = y.value_counts()
        test_count = max(1, round(len(y) * 0.2))
        train_count = len(y) - test_count
        if (
            counts.min() >= 2
            and test_count >= y.nunique()
            and train_count >= y.nunique()
        ):
            stratify = y

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=stratify,
        )
    except ValueError as error:
        raise ValueError(
            "The dataset cannot be split reliably. Check the number of rows "
            "and the distribution of target classes."
        ) from error

    scoring = (
        "neg_mean_absolute_error"
        if task == "regression"
        else "accuracy"
    )

    comparison = {}
    fitted_candidates = {}

    if task == "classification":
        train_counts = y_train.value_counts()
        cv_splits = min(5, int(train_counts.min()))
    else:
        cv_splits = min(5, len(X_train))

    for name in selected_models:
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("model", model_options[name]),
        ])

        try:
            if cv_splits >= 2:
                scores = cross_val_score(
                    pipeline,
                    X_train,
                    y_train,
                    cv=cv_splits,
                    scoring=scoring,
                    error_score="raise",
                )
                score = float(scores.mean())
                if task == "regression":
                    score = -score
                comparison[name] = {"validation_score": round(score, 4)}
            else:
                comparison[name] = {
                    "validation_score": None,
                    "note": "Not enough examples per class for cross-validation.",
                }

            pipeline.fit(X_train, y_train)
            fitted_candidates[name] = pipeline

        except (ValueError, TypeError) as error:
            comparison[name] = {"error": str(error)}

    if not fitted_candidates:
        raise ValueError(
            "None of the selected algorithms could be trained on this dataset."
        )

    # Evaluate all selected models on the same held-out test set.
    for name, pipeline in fitted_candidates.items():
        predictions = pipeline.predict(X_test)

        if task == "regression":
            comparison[name]["test_mae"] = round(
                float(mean_absolute_error(y_test, predictions)), 4
            )
            comparison[name]["test_rmse"] = round(
                float(mean_squared_error(y_test, predictions) ** 0.5), 4
            )
            comparison[name]["test_r2"] = (
                round(float(r2_score(y_test, predictions)), 4)
                if len(y_test) >= 2
                else None
            )
        else:
            comparison[name]["test_accuracy"] = round(
                float(accuracy_score(y_test, predictions)), 4
            )
            comparison[name]["test_precision_weighted"] = round(
                float(precision_score(
                    y_test, predictions, average="weighted", zero_division=0
                )), 4
            )
            comparison[name]["test_recall_weighted"] = round(
                float(recall_score(
                    y_test, predictions, average="weighted", zero_division=0
                )), 4
            )
            comparison[name]["test_f1_weighted"] = round(
                float(f1_score(
                    y_test, predictions, average="weighted", zero_division=0
                )), 4
            )

    # Choose the best among the successfully evaluated models for reference.
    if task == "regression":
        best_model_name = min(
            fitted_candidates,
            key=lambda name: comparison[name]["test_mae"],
        )
    else:
        best_model_name = max(
            fitted_candidates,
            key=lambda name: comparison[name]["test_accuracy"],
        )

    # Retrain the selected winner on all usable rows and save separately.
    best_model = fitted_candidates[best_model_name]
    best_model.fit(X, y)

    model_id = str(uuid.uuid4())
    model_path = MODEL_DIR / f"{model_id}.joblib"
    joblib.dump(best_model, model_path)

    metadata = {
        "model_id": model_id,
        "selected_model": best_model_name,
        "user_selected_models": selected_models,
        "task": task,
        "target": target_column,
        "features": X.columns.tolist(),
        "feature_types": {
            column: (
                "numeric" if column in numeric_columns else "categorical"
            )
            for column in X.columns
        },
        "target_classes": (
            label_encoder.classes_.tolist()
            if label_encoder is not None
            else None
        ),
        "total_valid_rows": int(len(X)),
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "model_comparison": comparison,
        "saved_model_file": model_path.name,
        "note": (
            "Recommendations are guidance, not guarantees. "
            "Test metrics can vary with small or unrepresentative datasets. "
            "The best model here is selected by test-set performance; "
            "for rigorous model selection, use validation data and keep "
            "the test set for final evaluation."
        ),
    }

    with open(MODEL_DIR / f"{model_id}.json", "w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=4)

    return metadata
