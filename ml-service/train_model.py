import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression


# 1. Load the dataset
data = pd.read_csv("house_data.csv")

print("Dataset:")
print(data)


# 2. Select our features
X = data[["area", "bedrooms"]]


# 3. Select our target
y = data["price"]


# 4. Create the ML model
model = LinearRegression()


# 5. Train the model
model.fit(X, y)


# 6. Make a test prediction
prediction = model.predict([[1600, 3]])


print("Predicted price:", prediction[0])
joblib.dump(model, "model.pkl")

print("Model saved successfully!")