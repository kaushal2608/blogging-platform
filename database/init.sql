CREATE DATABASE IF NOT EXISTS ecomdb;

USE ecomdb;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price, description)
VALUES 
    ('Laptop', 55000.00, 'High performance laptop for developers and creators'),
    ('Wireless Mouse', 800.00, 'Ergonomic 2.4GHz wireless optical mouse'),
    ('Mechanical Keyboard', 2500.00, 'RGB backlit mechanical tactile keyboard'),
    ('Gaming Headset', 1800.00, 'Noise-cancelling surround sound headphones');