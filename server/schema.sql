-- Create Skillmate Database
CREATE DATABASE IF NOT EXISTS skillmate_db;
USE skillmate_db;

-- Users Table supporting Local Credentials & Google OAuth
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NULL,          -- Hashed password (NULL for Google-only users)
  google_id VARCHAR(255) UNIQUE NULL,   -- Google's unique account ID
  credits INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
