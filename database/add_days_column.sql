-- Add days column to routes table
-- This column will store comma-separated days when the route is active

USE routemate_db;

ALTER TABLE routes 
ADD COLUMN days VARCHAR(50) NOT NULL DEFAULT 'MON,TUE,WED,THU,FRI' 
AFTER departure_time;

-- Add index for days column for efficient filtering
ALTER TABLE routes 
ADD INDEX idx_days (days);