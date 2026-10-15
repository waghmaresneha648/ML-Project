const calculateStatistics = (rows, columns) => {

    const statistics = {};

    columns.forEach((column) => {

        const values = rows
            .map((row) => Number(row[column]))
            .filter((value) => !isNaN(value));

        // Only calculate statistics for numerical columns
        if (values.length === 0) {
            return;
        }

        const sortedValues = [...values].sort((a, b) => a - b);

        const count = values.length;

        const sum = values.reduce(
            (total, value) => total + value,
            0
        );

        const mean = sum / count;

        const minimum = sortedValues[0];

        const maximum = sortedValues[sortedValues.length - 1];

        let median;

        const middle = Math.floor(sortedValues.length / 2);

        if (sortedValues.length % 2 === 0) {
            median =
                (sortedValues[middle - 1] + sortedValues[middle]) / 2;
        } else {
            median = sortedValues[middle];
        }

        statistics[column] = {
            count: count,
            mean: Number(mean.toFixed(2)),
            median: Number(median.toFixed(2)),
            minimum: minimum,
            maximum: maximum
        };
    });

    return statistics;
};

module.exports = {
    calculateStatistics
};