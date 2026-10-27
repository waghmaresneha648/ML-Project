import { useEffect, useState } from "react";

import "./App.css";



function App() {

  const [datasets, setDatasets] = useState([]);



  // House-price prediction states

  const [area, setArea] = useState("");

  const [bedrooms, setBedrooms] = useState("");

  const [prediction, setPrediction] = useState(null);

  const [loading, setLoading] = useState(false);

  const [predictionError, setPredictionError] = useState("");



  // CSV upload and analysis states

  const [selectedFile, setSelectedFile] = useState(null);

  const [datasetAnalysis, setDatasetAnalysis] = useState(null);

  const [uploadLoading, setUploadLoading] = useState(false);

  const [uploadError, setUploadError] = useState("");



  // General ML training states

  const [mlTarget, setMlTarget] = useState("");

  const [mlTask, setMlTask] = useState("auto");

  const [mlRecommendations, setMlRecommendations] = useState(null);

  const [mlTrainingResults, setMlTrainingResults] = useState(null);

  const [mlLoading, setMlLoading] = useState(false);

  const [mlError, setMlError] = useState("");

  const [selectedModels, setSelectedModels] = useState([]);



  useEffect(() => {

    fetch("http://localhost:5000/api/datasets")

      .then((response) => {

        if (!response.ok) {

          throw new Error("Could not load datasets.");

        }

        return response.json();

      })

      .then((data) => {

        setDatasets(Array.isArray(data) ? data : []);

      })

      .catch((error) => {

        console.error("Error fetching datasets:", error);

      });

  }, []);



  const handlePrediction = async (event) => {

    event.preventDefault();

    setPrediction(null);

    setPredictionError("");



    if (

      area.trim() === "" ||

      bedrooms.trim() === "" ||

      Number(area) <= 0 ||

      Number(bedrooms) <= 0

    ) {

      setPredictionError(

        "Enter a valid area and a number of bedrooms greater than zero."

      );

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

      setUploadError("Please select a CSV file first.");

      return;

    }



    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {

      setUploadError("Please select a file with the .csv extension.");

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

      setUploadError(error.message || "Something went wrong during upload.");

    } finally {

      setUploadLoading(false);

    }

  };



  const handleFileSelection = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setDatasetAnalysis(null);
    setUploadError("");
    setMlRecommendations(null);
    setMlTrainingResults(null);
    setMlError("");
    setSelectedModels([]);
  };

  // Ask the backend to recommend suitable models for the uploaded CSV.
  const handleMLRecommendation = async () => {
    if (!selectedFile) {
      setMlError("Please select a CSV file in the Upload and Analyze section first.");
      return;
    }
    if (!mlTarget.trim()) {
      setMlError("Enter the target column you want to predict (for example, price).");
      return;
    }

    setMlLoading(true);
    setMlError("");
    setMlRecommendations(null);
    setMlTrainingResults(null);
    setSelectedModels([]);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("target_column", mlTarget.trim());
      formData.append("task", mlTask);

      const response = await fetch("http://localhost:5000/api/ml/recommend", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not recommend ML models.");
      }
      setMlRecommendations(data);
    } catch (error) {
      setMlError(error.message || "Could not connect to the ML service.");
    } finally {
      setMlLoading(false);
    }
  };

  // Train the models selected by the user.
  const handleMLTraining = async () => {
    if (!selectedFile) {
      setMlError("Please select a CSV file first.");
      return;
    }
    if (!mlTarget.trim()) {
      setMlError("Enter the target column you want to predict.");
      return;
    }
    if (selectedModels.length === 0) {
      setMlError("Select at least one model to train.");
      return;
    }

    setMlLoading(true);
    setMlError("");
    setMlTrainingResults(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("target_column", mlTarget.trim());
      formData.append("task", mlTask);
      formData.append("selected_models", JSON.stringify(selectedModels));

      const response = await fetch("http://localhost:5000/api/ml/train", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Model training failed.");
      }
      setMlTrainingResults(data);
    } catch (error) {
      setMlError(error.message || "Could not connect to the ML service.");
    } finally {
      setMlLoading(false);
    }
  };



  const totalMissingValues =

    datasetAnalysis?.columns?.reduce(

      (total, column) => total + Number(column.missingValues || 0),

      0

    ) ?? 0;



  return (

    <div className="app">

      <header className="navbar">

        <a className="logo" href="#home">

          ML Intelligence Platform

        </a>



        <nav>

          <a href="#dashboard">Dashboard</a>

          <a href="#datasets">Datasets</a>

          <a href="#analysis">Analysis</a>

          <a href="#predictions">Predictions</a>
          <a href="#ml-training">Train Models</a>

          <a href="#about">About</a>

        </nav>

      </header>



      <main>

        <section className="hero" id="home">

          <p className="tag">DATA • ANALYTICS • MACHINE LEARNING</p>



          <h1>

            Turn your data into

            <span> intelligent insights.</span>

          </h1>



          <p className="description">

            Upload a CSV dataset, understand its structure, explore numerical

            statistics, and try a machine learning model through one platform.

          </p>



          <div className="hero-buttons">

            <a className="button-link" href="#analysis">

              Explore Your Data

            </a>

            <a className="button-link secondary-button" href="#predictions">

              Try ML Prediction

            </a>

          </div>

        </section>



        <section className="cards" id="dashboard">

          <div className="card">

            <div className="feature-icon">📊</div>

            <h2>Dataset Exploration</h2>

            <p>

              Upload CSV files and inspect row counts, columns, missing values,

              duplicate rows, and available numerical summaries.

            </p>

          </div>



          <div className="card">

            <div className="feature-icon">🔎</div>

            <h2>Data Analysis</h2>

            <p>

              Review basic statistics such as mean, median, minimum, and

              maximum to better understand your data.

            </p>

          </div>



          <div className="card">

            <div className="feature-icon">🤖</div>

            <h2>Machine Learning</h2>

            <p>

              Try the current house-price prediction model using house area

              and bedroom count as inputs.

            </p>

          </div>

        </section>



        <section className="about-section" id="about">

          <p className="tag">ABOUT THE PROJECT</p>

          <h2>One platform to explore data and experiment with ML</h2>



          <p className="about-description">

            ML Intelligence Platform is a full-stack data analysis and machine

            learning project that connects a React frontend, a Node.js and

            Express backend, a PostgreSQL database, and a Python-based ML

            service.

          </p>



          <div className="about-grid">

            <article className="about-card">

              <h3>01. Upload and inspect</h3>

              <p>

                Upload a CSV file through the website to inspect its structure,

                missing values, duplicate rows, and numerical statistics.

              </p>

            </article>



            <article className="about-card">

              <h3>02. Analyze your data</h3>

              <p>

                View summaries of numeric columns to get an initial

                understanding of the dataset before deciding what to explore

                next.

              </p>

            </article>



            <article className="about-card">

              <h3>03. Run a trained model</h3>

              <p>

                Use the existing house-price model to estimate a house price

                from its area and number of bedrooms.

              </p>

            </article>

          </div>



          <p className="about-note">

            The platform supports CSV analysis, house-price prediction, and a general ML workflow that recommends and trains models for uploaded datasets.

          </p>

        </section>



        <section className="dataset-section" id="datasets">

          <p className="tag">YOUR WORKSPACE</p>

          <h2>Your Datasets</h2>

          <p className="section-description">

            Datasets currently returned by the backend.

          </p>



          {datasets.length === 0 ? (

            <div className="empty-state">

              <p>No datasets found in the dataset list yet.</p>

              <p>

                You can still upload a CSV file below to analyze it.

              </p>

            </div>

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

          <div className="section-heading">

            <p className="tag">DATASET INTELLIGENCE</p>

            <h2>Upload and Analyze a CSV</h2>

            <p>

              Choose a CSV file from your computer. The platform will inspect

              its contents and show a summary of the dataset.

            </p>

          </div>



          <form className="upload-form" onSubmit={handleFileUpload}>

            <label className="file-label" htmlFor="datasetFile">

              Select a CSV file

            </label>



            <input

              id="datasetFile"

              type="file"

              accept=".csv,text/csv"

              onChange={handleFileSelection}

            />



            {selectedFile && (

              <div className="selected-file">

                <span className="file-icon">📄</span>

                <div>

                  <strong>{selectedFile.name}</strong>

                  <p>

                    {(selectedFile.size / 1024).toFixed(2)} KB · Ready to

                    upload

                  </p>

                </div>

              </div>

            )}



            <button

              className="upload-button"

              type="submit"

              disabled={uploadLoading}

            >

              {uploadLoading ? "Analyzing dataset..." : "Upload & Analyze"}

            </button>



            {uploadError && (

              <div className="message error-message" role="alert">

                {uploadError}

              </div>

            )}

          </form>



          {datasetAnalysis && (

            <div className="analysis-result">

              <div className="analysis-header">

                <p className="tag">ANALYSIS COMPLETE</p>

                <h3>Dataset Analysis</h3>

                <p>

                  File:{" "}

                  <strong>

                    {datasetAnalysis.fileName || selectedFile?.name}

                  </strong>

                </p>

              </div>



              <div className="summary-cards">

                <div className="summary-card">

                  <span>Total Rows</span>

                  <strong>{datasetAnalysis.rowCount}</strong>

                </div>



                <div className="summary-card">

                  <span>Total Columns</span>

                  <strong>{datasetAnalysis.columnCount}</strong>

                </div>



                <div className="summary-card">

                  <span>Duplicate Rows</span>

                  <strong>{datasetAnalysis.duplicateRows}</strong>

                </div>



                <div className="summary-card">

                  <span>Missing Values</span>

                  <strong>{totalMissingValues}</strong>

                </div>

              </div>



              <h3 className="result-section-title">Column Details</h3>



              <div className="column-grid">

                {datasetAnalysis.columns?.map((column) => (

                  <div

                    className="column-result"

                    key={column.columnName}

                  >

                    <h4>{column.columnName}</h4>

                    <p>

                      <strong>Data type:</strong> {column.dataType}

                    </p>

                    <p>

                      <strong>Missing values:</strong>{" "}

                      {column.missingValues}

                    </p>

                  </div>

                ))}

              </div>



              <h3 className="result-section-title">Statistical Summary</h3>



              {Object.entries(datasetAnalysis.statistics || {}).length ===

              0 ? (

                <p className="no-statistics">

                  No numerical statistics are available for this dataset.

                </p>

              ) : (

                <div className="statistics-grid">

                  {Object.entries(datasetAnalysis.statistics || {}).map(

                    ([columnName, stats]) => (

                      <div

                        className="statistics-result"

                        key={columnName}

                      >

                        <h4>{columnName}</h4>

                        <p>

                          <span>Count</span>

                          <strong>{stats.count ?? "N/A"}</strong>

                        </p>

                        <p>

                          <span>Mean</span>

                          <strong>{stats.mean ?? "N/A"}</strong>

                        </p>

                        <p>

                          <span>Median</span>

                          <strong>{stats.median ?? "N/A"}</strong>

                        </p>

                        <p>

                          <span>Minimum</span>

                          <strong>{stats.minimum ?? "N/A"}</strong>

                        </p>

                        <p>

                          <span>Maximum</span>

                          <strong>{stats.maximum ?? "N/A"}</strong>

                        </p>

                      </div>

                    )

                  )}

                </div>

              )}

            </div>

          )}

        </section>



        <section className="ml-training-section" id="ml-training">
          <div className="section-heading">
            <p className="tag">GENERAL MACHINE LEARNING</p>
            <h2>Train Your Own ML Models</h2>
            <p>
              Choose a CSV dataset and target column, get model recommendations,
              and train models to compare their performance.
            </p>
          </div>

          <div className="ml-training-card">
            <div className="ml-form-group">
              <label htmlFor="ml-target">Target column</label>
              <input
                id="ml-target"
                type="text"
                value={mlTarget}
                onChange={(event) => {
                  setMlTarget(event.target.value);
                  setMlRecommendations(null);
                  setMlTrainingResults(null);
                  setSelectedModels([]);
                }}
                placeholder="For example: price"
              />
              <small>The column contains the value you want the model to predict.</small>
            </div>

            <div className="ml-form-group">
              <label htmlFor="ml-task">Prediction type</label>
              <select
                id="ml-task"
                value={mlTask}
                onChange={(event) => {
                  setMlTask(event.target.value);
                  setMlRecommendations(null);
                  setMlTrainingResults(null);
                  setSelectedModels([]);
                }}
              >
                <option value="auto">Detect automatically</option>
                <option value="regression">Regression — predict a number</option>
                <option value="classification">Classification — predict a category</option>
              </select>
            </div>

            <p className="ml-file-status">
              {selectedFile
                ? `Selected CSV: ${selectedFile.name}`
                : "First select a CSV file in the Upload and Analyze section above."}
            </p>

            <button
              type="button"
              className="ml-primary-button"
              onClick={handleMLRecommendation}
              disabled={mlLoading || !selectedFile}
            >
              {mlLoading ? "Working..." : "Recommend ML Models"}
            </button>

            {mlError && <p className="ml-error" role="alert">{mlError}</p>}

            {mlRecommendations && (
              <div className="ml-results">
                <h3>Recommended models</h3>
                <p>
                  Detected task:{" "}
                  <strong>{mlRecommendations.task || mlTask}</strong>
                </p>
                {(() => {
                  const models =
                    mlRecommendations.recommended_models ||
                    mlRecommendations.recommendations ||
                    mlRecommendations.models ||
                    [];
                  if (!Array.isArray(models) || models.length === 0) {
                    return (
                      <p>
                        The API responded, but the model list was not in the expected format.
                        Please check the response in the browser console.
                      </p>
                    );
                  }
                  return models.map((model, index) => {
                    const modelName =
                      typeof model === "string"
                        ? model
                        : model.name || model.model_name || model.model;
                    if (!modelName) return null;
                    return (
                      <label className="ml-model-option" key={`${modelName}-${index}`}>
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(modelName)}
                          onChange={(event) => {
                            setSelectedModels((previous) =>
                              event.target.checked
                                ? [...previous, modelName]
                                : previous.filter((name) => name !== modelName)
                            );
                          }}
                        />
                        <span>{modelName}</span>
                      </label>
                    );
                  });
                })()}

                <button
                  type="button"
                  className="ml-primary-button"
                  onClick={handleMLTraining}
                  disabled={mlLoading || selectedModels.length === 0}
                >
                  {mlLoading ? "Training..." : "Train Selected Models"}
                </button>
              </div>
            )}

            {mlTrainingResults && (
              <div className="ml-results">
                <h3>Model training results</h3>
                <pre className="ml-json-results">
                  {JSON.stringify(mlTrainingResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>

        <section className="prediction-section" id="predictions">

          <p className="tag">MACHINE LEARNING</p>

          <h2>House Price Prediction</h2>

          <p className="section-description">

            Enter house details to get an estimate from the trained

            house-price model.

          </p>



          <form className="prediction-form" onSubmit={handlePrediction}>

            <div className="input-group">

              <label htmlFor="area">Area (sq ft)</label>

              <input

                id="area"

                type="number"

                min="1"

                step="any"

                placeholder="Example: 1600"

                value={area}

                onChange={(event) => setArea(event.target.value)}

                required

              />

            </div>



            <div className="input-group">

              <label htmlFor="bedrooms">Number of Bedrooms</label>

              <input

                id="bedrooms"

                type="number"

                min="1"

                step="1"

                placeholder="Example: 3"

                value={bedrooms}

                onChange={(event) => setBedrooms(event.target.value)}

                required

              />

            </div>



            <button type="submit" disabled={loading}>

              {loading ? "Predicting..." : "Predict Price"}

            </button>

          </form>



          {predictionError && (

            <div className="message error-message" role="alert">

              {predictionError}

            </div>

          )}



          {prediction && (

            <div className="prediction-result">

              <p className="tag">PREDICTION RESULT</p>

              <h3>Estimated House Price</h3>

              <p>Area: {prediction.area ?? area} sq ft</p>

              <p>Bedrooms: {prediction.bedrooms ?? bedrooms}</p>

              <h2>

                ₹{prediction.predicted_price} lakh

              </h2>

              {prediction.model && (

                <p>Model used: {prediction.model}</p>

              )}

            </div>

          )}

        </section>



        <section className="status-section">

          <h2>Platform Components</h2>

          <p className="section-description">

            The application uses these components in its full-stack workflow.

          </p>



          <div className="status">

            <span className="dot" />

            React frontend

          </div>

          <div className="status">

            <span className="dot" />

            Node.js and Express backend

          </div>

          <div className="status">

            <span className="dot" />

            PostgreSQL database integration

          </div>

          <div className="status">

            <span className="dot" />

            Python machine learning service

          </div>

        </section>

      </main>



      <footer className="footer">

        <p>ML Intelligence Platform · Data Analysis & Machine Learning</p>

      </footer>

    </div>

  );

}



export default App;
