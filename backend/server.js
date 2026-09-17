const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "ecomuser",
    password: process.env.DB_PASSWORD || "ecompassword",
    database: process.env.DB_NAME || "ecomdb",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Database connection pool
const pool = mysql.createPool(dbConfig);

// Base route
app.get("/", (req, res) => {
    res.json({
        service: "E-Commerce Backend API",
        status: "running",
        tier: "Application Tier (Node.js/Express)",
        endpoints: ["/health", "/products", "/info"]
    });
});

// Health check endpoint verifying MySQL connectivity
app.get("/health", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 as is_alive, NOW() as db_time");
        res.json({
            status: "success",
            message: "Backend API and MySQL Database are fully connected!",
            database_host: dbConfig.host,
            database_name: dbConfig.database,
            db_time: rows[0].db_time
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Backend is running, but MySQL connection failed.",
            database_host: dbConfig.host,
            error: error.message
        });
    }
});

// Fetch product catalog
app.get("/products", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, price, category, description, stock, created_at FROM products ORDER BY id ASC"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch products from MySQL database.",
            error: error.message
        });
    }
});

// Add new product
app.post("/products", async (req, res) => {
    const { name, price, category, description, stock } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: "Product name and price are required." });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO products (name, price, category, description, stock) VALUES (?, ?, ?, ?, ?)",
            [name, price, category || "General", description || "", stock || 10]
        );
        res.status(201).json({
            status: "success",
            message: "Product created successfully!",
            productId: result.insertId
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to create product in database.",
            error: error.message
        });
    }
});

// System info endpoint
app.get("/info", (req, res) => {
    res.json({
        app: "Cloud E-Commerce Platform",
        version: "1.0.0",
        node_version: process.version,
        env: {
            DB_HOST: dbConfig.host,
            DB_NAME: dbConfig.database,
            DB_USER: dbConfig.user,
            PORT: PORT
        }
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`===========================================`);
    console.log(`E-Commerce Backend running on port ${PORT}`);
    console.log(`Target MySQL DB Host: ${dbConfig.host}`);
    console.log(`===========================================`);
});