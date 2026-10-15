const express = require("express");

const router = express.Router();

const { predictHousePrice } = require("../services/mlService");


router.post("/predict", async (req, res) => {

    try {

        const { area, bedrooms } = req.body;

        if (area === undefined || bedrooms === undefined) {
            return res.status(400).json({
                message: "Area and bedrooms are required"
            });
        }

        const result = await predictHousePrice(area, bedrooms);

        res.json(result);

    } catch (error) {

        console.error("Prediction error:", error.message);

        res.status(500).json({
            message: "Unable to get prediction from ML service",
            error: error.message
        });
    }
});


module.exports = router;