const predictHousePrice = async (area, bedrooms) => {
    try {
        const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                area: area,
                bedrooms: bedrooms
            })
        });

        if (!response.ok) {
            throw new Error(`Python ML service returned ${response.status}`);
        }

        const result = await response.json();

        return result;

    } catch (error) {
        console.error("Error connecting to ML service:", error.message);
        throw error;
    }
};

module.exports = {
    predictHousePrice
};