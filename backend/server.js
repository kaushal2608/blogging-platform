const express = require("express");
const mysql = require("mysql2/promise");

const app = express();

app.use(express.json());

const PORT = 5000;

const dbConfig = {
    host: process.env.DB_HOST || "database",
    user: process.env.DB_USER || "bloguser",
    password: process.env.DB_PASSWORD || "blogpassword",
    database: process.env.DB_NAME || "blogdb"
};

app.get("/health", async (req, res) => {

    try {

        const connection = await mysql.createConnection(dbConfig);

        await connection.query("SELECT 1");

        await connection.end();

        res.json({
            status: "success",
            message: "Backend API and MySQL are working!"
        });

    } catch (error) {

        res.status(500).json({
            status: "error",
            message: "Backend is running but MySQL is unavailable."
        });

    }
});

app.get("/posts", async (req, res) => {

    try {

        const connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.query(
            "SELECT * FROM posts ORDER BY id DESC"
        );

        await connection.end();

        res.json(rows);

    } catch (error) {

        res.status(500).json({
            error: "Unable to fetch posts"
        });

    }
});

app.listen(PORT, () => {

    console.log(`Backend running on port ${PORT}`);

});