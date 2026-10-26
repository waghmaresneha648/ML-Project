
import pandas as pd

from general_trainer import recommend_models, train_general_model


# Create temporary sample student data in memory.
# This does not modify any of your existing CSV files.
data = pd.DataFrame({
    "study_hours": list(range(1, 61)),
    "attendance": [60 + (i * 7) % 41 for i in range(60)],
    "study_style": [
        "Visual" if i % 2 == 0 else "Reading"
        for i in range(60)
    ],
})

# Example 1: Predict a numerical score (regression).
data["final_score"] = [
    min(100, 20 + hours * 1.1 + attendance * 0.35)
    for hours, attendance in zip(
        data["study_hours"], data["attendance"]
    )
]

print("\n========== REGRESSION TEST ==========")

recommendation = recommend_models(data, "final_score")

print("Detected task:", recommendation["task"])
print("Recommended algorithms:")

for item in recommendation["recommendations"]:
    print("-", item["name"], ":", item["reason"])

result = train_general_model(
    data=data,
    target_column="final_score",
    task="regression",
    selected_models=["Linear Regression", "Random Forest Regressor"],
)

print("\nTraining completed!")
print("Selected reference model:", result["selected_model"])
print("Comparison results:", result["model_comparison"])
print("Saved model ID:", result["model_id"])


# Example 2: Predict a category (classification).
data["pass_status"] = [
    "Pass" if score >= 60 else "Needs Improvement"
    for score in data["final_score"]
]

print("\n========== CLASSIFICATION TEST ==========")

recommendation = recommend_models(data, "pass_status")

print("Detected task:", recommendation["task"])
print("Recommended algorithms:")

for item in recommendation["recommendations"]:
    print("-", item["name"], ":", item["reason"])

result = train_general_model(
    data=data,
    target_column="pass_status",
    task="classification",
    selected_models=[
        "Decision Tree Classifier",
        "Random Forest Classifier",
    ],
)

print("\nTraining completed!")
print("Selected reference model:", result["selected_model"])
print("Comparison results:", result["model_comparison"])
print("Saved model ID:", result["model_id"])

print("\nAll test steps finished.")
