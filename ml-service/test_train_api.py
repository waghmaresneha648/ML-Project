
import requests
import json

url = "http://127.0.0.1:8000/general/train"

with open("house_data.csv", "rb") as csv_file:
    response = requests.post(
        url,
        files={"file": ("house_data.csv", csv_file, "text/csv")},
        data={
            "target_column": "price",
            "task": "regression",
            "selected_models": json.dumps([
                "Linear Regression",
                "Decision Tree Regressor",
                "Random Forest Regressor"
            ])
        }
    )

print("Status code:", response.status_code)
print("Response:")
print(response.text)
