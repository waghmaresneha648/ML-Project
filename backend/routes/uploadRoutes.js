const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");
const { calculateStatistics } = require("../services/datasetAnalysisService");
const router = express.Router();

// Store uploaded files temporarily in memory
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a CSV file."
            });
        }

        const rows = [];

        const stream = Readable.from(req.file.buffer);

        stream
            .pipe(csv())
            .on("data", (row) => {
                rows.push(row);
            })
            .on("end", () => {

                const columns = rows.length > 0
                    ? Object.keys(rows[0])
                    : [];

                // Find data type and missing values for each column
                const columnAnalysis = columns.map((column) => {

                    let missingValues = 0;
                    let numericValues = 0;
                    let textValues = 0;

                    rows.forEach((row) => {
                        const value = row[column];

                        if (
                            value === undefined ||
                            value === null ||
                            value.toString().trim() === ""
                        ) {
                            missingValues++;
                        } else if (!isNaN(Number(value))) {
                            numericValues++;
                        } else {
                            textValues++;
                        }
                    });

                    let dataType = "text";

                    if (numericValues > textValues) {
                        dataType = "number";
                    }

                    return {
                        columnName: column,
                        dataType: dataType,
                        missingValues: missingValues
                    };
                });

                // Find duplicate rows
                const uniqueRows = new Set(
                    rows.map((row) => JSON.stringify(row))
                );

                const duplicateRows = rows.length - uniqueRows.size;
                const statistics = calculateStatistics(rows, columns);

                res.json({
                    message: "CSV analyzed successfully!",
                    fileName: req.file.originalname,
                    fileSize: req.file.size,

                    rowCount: rows.length,
                    columnCount: columns.length,

                    columns: columnAnalysis,

                    duplicateRows: duplicateRows,
                    statistics: statistics
                });
            })
            .on("error", (error) => {

                console.error(
                    "CSV parsing error:",
                    error.message
                );

                res.status(500).json({
                    message: "Unable to read CSV file.",
                    error: error.message
                });
            });

    } catch (error) {

        console.error(
            "Upload error:",
            error.message
        );

        res.status(500).json({
            message: "File upload failed.",
            error: error.message
        });
    }
});

module.exports = router;