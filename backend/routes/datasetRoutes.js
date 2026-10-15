const express = require("express");
const pool = require("../config/database");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM datasets ORDER BY id ASC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching datasets:", error.message);

        res.status(500).json({
            message: "Failed to fetch datasets"
        });
    }
});
router.post("/", async (req, res) => {
    try {
        const { name, description } = req.body;
                if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Dataset name is required"
            });
        }

        const result = await pool.query(
            "INSERT INTO datasets (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating dataset:", error.message);

        res.status(500).json({
            message: "Failed to create dataset"
        });
    }
});
module.exports = router;
