CREATE DATABASE IF NOT EXISTS pallas_playground;
USE pallas_playground;

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_email VARCHAR(150) NOT NULL,
    buyer_phone VARCHAR(20),
    university ENUM('UWC', 'CPUT', 'UCT', 'Northlink', 'Other') NOT NULL,
    referral_artist VARCHAR(100),
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    ticket_price DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'used', 'refunded', 'transferred') DEFAULT 'active',
    qr_code_data TEXT,
    refund_deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artist_name VARCHAR(100) UNIQUE NOT NULL,
    song_count INT DEFAULT 0,
    set_time VARCHAR(50),
    contact_email VARCHAR(150),
    total_referrals INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competition entries table
CREATE TABLE IF NOT EXISTS competition_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instagram_user VARCHAR(100),
    post_url VARCHAR(255),
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('ticket_sale', 'refund', 'artist_payment'),
    amount DECIMAL(10,2),
    description TEXT,
    related_ticket_id INT,
    related_artist_id INT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'failed'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample artists
INSERT IGNORE INTO artists (artist_name, song_count, set_time) VALUES
('Artist One', 3, '19:00-19:30'),
('Artist Two', 2, '19:30-20:00'),
('Artist Three', 4, '20:00-20:45'),
('Artist Four', 3, '20:45-21:15');