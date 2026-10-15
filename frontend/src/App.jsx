import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [datasets, setDatasets] = useState([]);

  // ML prediction states
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
const [datasetAnalysis, setDatasetAnalysis] = useState(null);
const [uploadLoading, setUploadLoading] = useState(false);
const [uploadError, setUploadError] = useState("");

  // Fetch datasets from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/datasets")
      .then((response) => response.json())
      .then((data) => {
        setDatasets(data);
      })
      .catch((error) => {
        console.error("Error fetching datasets:", error);
      });
  }, []);

  // Send data to our ML backend
  const handlePrediction = async (event) => {
    event.preventDefault();

    setPrediction(null);
    setPredictionError("");

    if (!area || !bedrooms) {
      setPredictionError("Please enter area and number of bedrooms.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          area: Number(area),
          bedrooms: Number(bedrooms),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Prediction failed.");
      }

      setPrediction(data);
    } catch (error) {
      console.error("Prediction error:", error);
      setPredictionError(error.message);
    } finally {
      setLoading(false);
    }
  };
    const handleFileUpload = async (event) => {
    event.preventDefault();

    setDatasetAnalysis(null);
    setUploadError("");

    if (!selectedFile) {
      setUploadError("Please select a CSV file.");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed.");
      }

      setDatasetAnalysis(data);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          ML Intelligence Platform
        </div>

        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#datasets">Datasets</a>
          <a href="#analysis">Analysis</a>
          <a href="#predictions">Predictions</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="tag">DATA • ANALYTICS • MACHINE LEARNING</p>

          <h1>
            Turn your data into
            <span> intelligent insights.</span>
          </h1>

          <p className="description">
            Upload your data, explore patterns, run analysis,
            and generate machine learning predictions from one platform.
          </p>

          <div className="hero-buttons">
            <button>Explore Dataset</button>

            <button className="secondary-button">
              Run Analysis
            </button>
          </div>
        </section>

        {/* DATASETS */}
        <section className="dataset-section" id="datasets">
          <h2>Your Datasets</h2>

          {datasets.length === 0 ? (
            <p>No datasets found.</p>
          ) : (
            <div className="dataset-list">
              {datasets.map((dataset) => (
                <div className="dataset-item" key={dataset.id}>
                  <h3>{dataset.name}</h3>
                  <p>{dataset.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="upload-section" id="analysis">

  <p className="tag">DATASET INTELLIGENCE</p>

  <h2>Upload & Analyze Dataset</h2>

  <p>
    Upload a CSV file and let the platform automatically
    understand your dataset.
  </p>

  <form onSubmit={handleFileUpload}>

    <div className="input-group">

      <label htmlFor="datasetFile">
        Choose CSV File
      </label>

      <input
        id="datasetFile"
        type="file"
        accept=".csv"
        onChange={(event) => {
          setSelectedFile(event.target.files[0]);
          setUploadError("");
        }}
      />

    </div>

    <button type="submit" disabled={uploadLoading}>
      {uploadLoading ? "Analyzing..." : "Upload & Analyze"}
    </button>

  </form>

  {uploadError && (
    <div className="prediction-error">
      {uploadError}
    </div>
  )}

  {datasetAnalysis && (
    <div className="analysis-result">

      <div className="analysis-header">
  <h3>Dataset Analysis</h3>

  <p>
    <strong>{datasetAnalysis.fileName}</strong>
  </p>
</div>

<div className="summary-cards">

  <div className="summary-card">
    <span>Rows</span>
    <strong>{datasetAnalysis.rowCount}</strong>
  </div>

  <div className="summary-card">
    <span>Columns</span>
    <strong>{datasetAnalysis.columnCount}</strong>
  </div>

  <div className="summary-card">
    <span>Duplicate Rows</span>
    <strong>{datasetAnalysis.duplicateRows}</strong>
  </div>

  <div className="summary-card">
    <span>Missing Values</span>
    <strong>
      {datasetAnalysis.columns.reduce(
        (total, column) => total + column.missingValues,
        0
      )}
    </strong>
  </div>

</div>

      <h3>Columns</h3>

      {datasetAnalysis.columns.map((column) => (
        <div className="column-result" key={column.columnName}>

          <strong>{column.columnName}</strong>

          <p>
            Type: {column.dataType}
          </p>

          <p>
            Missing Values: {column.missingValues}
          </p>

        </div>
      ))}

      <h3>Statistical Summary</h3>

      {Object.entries(datasetAnalysis.statistics).map(
        ([columnName, stats]) => (

          <div className="statistics-result" key={columnName}>

            <h4>{columnName}</h4>

            <p>Count: {stats.count}</p>
            <p>Mean: {stats.mean}</p>
            <p>Median: {stats.median}</p>
            <p>Minimum: {stats.minimum}</p>
            <p>Maximum: {stats.maximum}</p>

          </div>

        )
      )}

    </div>
  )}

</section>

        {/* DASHBOARD CARDS */}
        <section className="cards" id="dashboard">
          <div className="card">
            <h2>📊 Datasets</h2>
            <p>
              Upload and manage the datasets used for analysis
              and machine learning.
            </p>
          </div>

          <div className="card">
            <h2>🔎 Data Analysis</h2>
            <p>
              Explore your data and discover useful patterns,
              trends, and relationships.
            </p>
          </div>

          <div className="card">
            <h2>🤖 ML Predictions</h2>
            <p>
              Run machine learning models and get predictions
              directly through the platform.
            </p>
          </div>
        </section>

        {/* ML PREDICTION SECTION */}
        <section className="prediction-section" id="predictions">
          <p className="tag">MACHINE LEARNING</p>

          <h2>House Price Prediction</h2>

          <p>
            Enter the house details and let our trained
            machine learning model estimate the price.
          </p>

          <form onSubmit={handlePrediction}>

            <div className="input-group">
              <label htmlFor="area">
                Area (sq ft)
              </label>

              <input
                id="area"
                type="number"
                placeholder="Example: 1600"
                value={area}
                onChange={(event) => setArea(event.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="bedrooms">
                Number of Bedrooms
              </label>

              <input
                id="bedrooms"
                type="number"
                placeholder="Example: 3"
                value={bedrooms}
                onChange={(event) => setBedrooms(event.target.value)}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Predicting..." : "Predict Price"}
            </button>

          </form>

          {/* ERROR */}
          {predictionError && (
            <div className="prediction-error">
              {predictionError}
            </div>
          )}

          {/* RESULT */}
          {prediction && (
            <div className="prediction-result">
              <h3>Prediction Result</h3>

              <p>
                Area: {prediction.area} sq ft
              </p>

              <p>
                Bedrooms: {prediction.bedrooms}
              </p>

              <h2>
                Predicted Price: ₹{prediction.predicted_price} lakh
              </h2>
            </div>
          )}
        </section>

        {/* PLATFORM STATUS */}
        <section className="status-section">
          <h2>Platform Status</h2>

          <div className="status">
            <span className="dot"></span>
            Frontend is running
          </div>

          <div className="status">
            <span className="dot"></span>
            Backend API is running
          </div>

          <div className="status">
            <span className="dot"></span>
            PostgreSQL database connected
          </div>

          <div className="status">
            <span className="dot"></span>
            ML prediction service is running
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;