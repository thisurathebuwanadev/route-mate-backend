-- Add role column to users table
USE routemate_db;

ALTER TABLE users 
ADD COLUMN role ENUM('ADMIN', 'PASSENGER', 'DRIVER') NOT NULL DEFAULT 'PASSENGER' 
AFTER user_type;

-- Update existing users based on user_type
UPDATE users SET role = 'DRIVER' WHERE user_type = 'driver';
UPDATE users SET role = 'PASSENGER' WHERE user_type = 'passenger';
UPDATE users SET role = 'DRIVER' WHERE user_type = 'both';

-- Add index for role column
ALTER TABLE users ADD INDEX idx_role (role);