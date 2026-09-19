-- database/schema.sql

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS daily_journals;
DROP TABLE IF EXISTS attendances;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

-- 1. Table: users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('siswa', 'guru_pembimbing') NOT NULL,
    nisn VARCHAR(50) NULL COMMENT 'Only for siswa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Table: locations (Master data for school/company locations)
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INT NOT NULL DEFAULT 50 COMMENT 'Radius in meters',
    address TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Table: attendances
CREATE TABLE attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_time TIME NOT NULL,
    check_out_time TIME NULL,
    check_in_latitude DECIMAL(10, 8) NOT NULL,
    check_in_longitude DECIMAL(11, 8) NOT NULL,
    check_out_latitude DECIMAL(10, 8) NULL,
    check_out_longitude DECIMAL(11, 8) NULL,
    check_in_photo_url VARCHAR(255) NULL,
    check_out_photo_url VARCHAR(255) NULL,
    status ENUM('hadir', 'terlambat', 'izin', 'sakit', 'alpa') DEFAULT 'hadir',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT
);

-- 4. Table: daily_journals
CREATE TABLE daily_journals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    activity TEXT NOT NULL,
    reflection TEXT NULL,
    attachment_url VARCHAR(255) NULL,
    status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'submitted',
    feedback TEXT NULL COMMENT 'Feedback from guru_pembimbing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Table: notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- DUMMY SEEDER DATA
-- ==========================================

-- Seed Users
-- Password for all dummy users is 'password123' (using bcrypt hashed representation)
INSERT INTO users (name, email, password, role, nisn) VALUES
('Guru Budi', 'budi@guru.com', '$2b$10$wI/zB8fFhD99xO6z3093..40r/sC5TqF4aV6G3j/nQk4uM5N5u88.', 'guru_pembimbing', NULL),
('Siswa Andi', 'andi@siswa.com', '$2b$10$wI/zB8fFhD99xO6z3093..40r/sC5TqF4aV6G3j/nQk4uM5N5u88.', 'siswa', '1234567890');

-- Seed Locations
-- Example: Monas as the dummy school/company location
INSERT INTO locations (name, latitude, longitude, radius, address) VALUES
('SMK Bina Karya (Lokasi Utama)', -6.175392, 106.827153, 100, 'Jl. Medan Merdeka, Jakarta Pusat');

-- Seed Attendances
INSERT INTO attendances (user_id, location_id, date, check_in_time, check_in_latitude, check_in_longitude, status) VALUES
(2, 1, CURDATE(), '07:30:00', -6.175392, 106.827153, 'hadir');

-- Seed Daily Journals
INSERT INTO daily_journals (user_id, date, activity, status) VALUES
(2, CURDATE(), 'Mempelajari React.js dan membuat komponen UI.', 'submitted');

-- Seed Notifications
INSERT INTO notifications (user_id, title, message) VALUES
(1, 'Jurnal Baru Masuk', 'Siswa Andi telah mensubmit jurnal harian hari ini.');
