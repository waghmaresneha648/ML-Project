
import requests

url = "http://localhost:5000/api/ml/train"
csv_path = "house_data.csv"

try:
    with open(csv_path, "rb") as csv_file:
        files = {
            "file": ("house_data.csv", csv_file, "text/csv")
        }

        data = {
            "target_column": "price",
            "task": "regression",
            "selected_models": '["Linear Regression", "Decision Tree Regressor", "Random Forest Regressor"]'
        }

        response = requests.post(
            url,
            files=files,
            data=data,
            timeout=120
        )

    print("HTTP Status:", response.status_code)
    print("Training results:")
    print(response.text)

except requests.exceptions.RequestException as error:
    print("Request failed:", error)
except FileNotFoundError:
    print("Could not find house_data.csv in the ml-service folder.")
