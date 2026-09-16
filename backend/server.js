const express = require("express");
const mysql = require("mysql2/promise");

const app = express();

app.use(express.json());

const PORT = 5000;

const dbConfig = {
    host: process.env.DB_HOST || "database",
    user: process.env.DB_USER || "ecomuser",
    password: process.env.DB_PASSWORD || "ecompassword",
    database: process.env.DB_NAME || "ecomdb"
};

app.get("/health", async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.query("SELECT 1");
        await connection.end();

        res.json({
            status: "success",
            message: "Backend API and MySQL Database are working!"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Backend is running but MySQL is unavailable.",
            error: error.message
        });
    }
});

app.get("/products", async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(
            "SELECT * FROM products ORDER BY id ASC"
        );
        await connection.end();

        res.json(rows);
    } catch (error) {
        res.status(500).json({
            status: "error",
            error: "Unable to fetch products",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`E-Commerce Backend running on port ${PORT}`);
});