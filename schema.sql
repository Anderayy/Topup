CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unique_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone_number VARCHAR(30) NOT NULL,
  bank_name VARCHAR(50) NOT NULL,
  account_number VARCHAR(30) NOT NULL,
  telegram_username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS unique_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unique_id VARCHAR(50) NOT NULL UNIQUE,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS topup_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bank_name VARCHAR(50) NOT NULL,
  account_number VARCHAR(30) NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('QRIS','VA') NOT NULL DEFAULT 'QRIS',
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  gateway_ref_id VARCHAR(255) NULL,
  gateway_transaction_id VARCHAR(255) NULL,
  gateway_status VARCHAR(50) NULL,
  qris_string TEXT NULL,
  gateway_payload JSON NULL,
  callback_received_at TIMESTAMP NULL,
  notes TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  UNIQUE KEY uniq_topup_gateway_ref_id (gateway_ref_id),
  CONSTRAINT fk_topup_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_withdrawal_callbacks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  gateway_ref_id VARCHAR(255) NULL,
  gateway_status VARCHAR(50) NULL,
  payload JSON NOT NULL,
  callback_received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_withdrawal_gateway_ref_id (gateway_ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(80) NULL,
  detail TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_audit_created_at (created_at),
  INDEX idx_admin_audit_admin_id (admin_id),
  CONSTRAINT fk_admin_audit_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
