
const express = require("express");
const multer = require("multer");

const router = express.Router();

// Keep the uploaded CSV in memory temporarily.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // Maximum 20 MB
    },
});

// Address of your Python Flask ML service.
const ML_SERVICE_URL = "http://127.0.0.1:8000";

// Helper: forward the CSV file and settings to Flask.
async function forwardToMLService(endpoint, req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a CSV file using the field name 'file'.",
            });
        }

        const formData = new FormData();

        formData.append(
            "file",
            new Blob([req.file.buffer], { type: "text/csv" }),
            req.file.originalname
        );

        formData.append(
            "target_column",
            req.body.target_column || ""
        );

        formData.append(
            "task",
            req.body.task || "auto"
        );

        if (req.body.selected_models) {
            formData.append(
                "selected_models",
                req.body.selected_models
            );
        }

        const response = await fetch(
            `${ML_SERVICE_URL}${endpoint}`,
            {
                method: "POST",
                body: formData,
            }
        );

        const result = await response.json();

        return res.status(response.status).json(result);
    } catch (error) {
        console.error("ML service error:", error.message);

        return res.status(502).json({
            success: false,
            message:
                "Could not communicate with the Python ML service. Check that Flask is running on port 8000.",
        });
    }
}

// Route 1: Recommend suitable ML models for a CSV dataset.
router.post(
    "/recommend",
    upload.single("file"),
    (req, res) =>
        forwardToMLService("/general/recommend", req, res)
);

// Route 2: Train and compare ML models for a CSV dataset.
router.post(
    "/train",
    upload.single("file"),
    (req, res) =>
        forwardToMLService("/general/train", req, res)
);

module.exports = router;

