-- RouteMate Database Schema
-- MySQL 8.0

CREATE DATABASE IF NOT EXISTS routemate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE routemate_db;

-- Users Table
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  profile_image_url VARCHAR(500),
  user_type ENUM('driver', 'passenger', 'both') NOT NULL,
  trust_score DECIMAL(3,2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone_number)
) ENGINE=InnoDB;

-- Vehicles Table
CREATE TABLE vehicles (
  vehicle_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  vehicle_type ENUM('bike', 'car', 'van') NOT NULL,
  make VARCHAR(50),
  model VARCHAR(50),
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  capacity INT NOT NULL,
  fuel_efficiency DECIMAL(5,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Routes Table
CREATE TABLE routes (
  route_id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  start_latitude DECIMAL(10,8) NOT NULL,
  start_longitude DECIMAL(11,8) NOT NULL,
  end_latitude DECIMAL(10,8) NOT NULL,
  end_longitude DECIMAL(11,8) NOT NULL,
  start_address TEXT,
  end_address TEXT,
  estimated_distance DECIMAL(8,2),
  estimated_duration INT,
  departure_time TIME NOT NULL,
  available_seats INT NOT NULL,
  cost_per_passenger DECIMAL(8,2) NOT NULL,
  route_status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  INDEX idx_coordinates (start_latitude, start_longitude, end_latitude, end_longitude),
  INDEX idx_departure_status (departure_time, route_status)
) ENGINE=InnoDB;

-- Ride Requests Table
CREATE TABLE ride_requests (
  request_id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  passenger_id INT NOT NULL,
  pickup_latitude DECIMAL(10,8) NOT NULL,
  pickup_longitude DECIMAL(11,8) NOT NULL,
  pickup_address TEXT,
  passenger_count INT DEFAULT 1,
  request_status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
  estimated_cost DECIMAL(8,2),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User Verifications Table
CREATE TABLE user_verifications (
  verification_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  document_type ENUM('phone', 'national_id', 'address_proof', 'profile_photo', 'driver_license', 'vehicle_photo') NOT NULL,
  document_url VARCHAR(500),
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  trust_points DECIMAL(3,2) DEFAULT 0.00,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_document (user_id, document_type)
) ENGINE=InnoDB;

-- Carbon Savings Table
CREATE TABLE carbon_savings (
  saving_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ride_request_id INT NOT NULL,
  estimated_individual_emission DECIMAL(8,4),
  shared_ride_emission DECIMAL(8,4),
  carbon_saved DECIMAL(8,4),
  distance_traveled DECIMAL(8,2),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (ride_request_id) REFERENCES ride_requests(request_id) ON DELETE CASCADE
) ENGINE=InnoDB;
