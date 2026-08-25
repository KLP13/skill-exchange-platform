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
  bio TEXT NULL,
  profile_photo_url VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  occupation VARCHAR(255) NULL,
  college_name VARCHAR(255) NULL,
  department VARCHAR(255) NULL,
  year_of_study VARCHAR(50) NULL,
  role VARCHAR(50) DEFAULT 'student',
  status VARCHAR(50) DEFAULT 'active',
  reputation_points INT DEFAULT 0,
  credits INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Skills Registry Table
CREATE TABLE IF NOT EXISTS user_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  type ENUM('shared', 'wanted') NOT NULL,
  proficiency VARCHAR(100) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Availability Slots Table
CREATE TABLE IF NOT EXISTS user_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  day_of_week VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
