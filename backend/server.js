require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const datasetRoutes = require("./routes/datasetRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const mlRoutes = require("./routes/mlRoutes");
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("ML Analytics Platform Backend is running!");
});
app.use("/api/datasets", datasetRoutes);
app.use("/api", predictionRoutes);
app.use("/api", uploadRoutes);
app.use("/api/ml", mlRoutes);
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "PostgreSQL connection successful!",
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});