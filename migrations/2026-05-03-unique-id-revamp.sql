-- Jalankan sekali untuk database lama sebelum pakai versi baru aplikasi.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS email VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30) NULL;

CREATE TABLE IF NOT EXISTS unique_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unique_id VARCHAR(50) NOT NULL UNIQUE,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Isi unique_ids dari data user lama yang sudah punya identifier.
INSERT IGNORE INTO unique_ids (unique_id, is_used)
SELECT unique_id, 1 FROM users WHERE unique_id IS NOT NULL AND unique_id <> '';

-- Hapus kolom legacy bila sudah tidak dipakai.
ALTER TABLE users
  DROP COLUMN IF EXISTS system_id,
  DROP COLUMN IF EXISTS telegram_handle,
  DROP COLUMN IF EXISTS whatsapp_number;

-- Wajibkan kolom baru setelah data terisi.
ALTER TABLE users
  MODIFY COLUMN unique_id VARCHAR(50) NOT NULL,
  MODIFY COLUMN email VARCHAR(120) NOT NULL,
  MODIFY COLUMN phone_number VARCHAR(30) NOT NULL;

ALTER TABLE users
  ADD UNIQUE KEY uniq_users_email (email);

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

ALTER TABLE topup_requests
  ADD COLUMN payment_method ENUM('QRIS','VA') NOT NULL DEFAULT 'QRIS' AFTER amount;

ALTER TABLE users
  ADD COLUMN telegram_username VARCHAR(50) NOT NULL DEFAULT '-' AFTER account_number;
