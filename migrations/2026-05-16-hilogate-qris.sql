ALTER TABLE topup_requests
  ADD COLUMN IF NOT EXISTS gateway_ref_id VARCHAR(255) NULL AFTER payment_method,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(255) NULL AFTER gateway_ref_id,
  ADD COLUMN IF NOT EXISTS gateway_status VARCHAR(50) NULL AFTER gateway_transaction_id,
  ADD COLUMN IF NOT EXISTS qris_string TEXT NULL AFTER gateway_status,
  ADD COLUMN IF NOT EXISTS gateway_payload JSON NULL AFTER qris_string,
  ADD COLUMN IF NOT EXISTS callback_received_at TIMESTAMP NULL AFTER gateway_payload;

ALTER TABLE topup_requests
  ADD UNIQUE KEY uniq_topup_gateway_ref_id (gateway_ref_id);

CREATE TABLE IF NOT EXISTS payment_withdrawal_callbacks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  gateway_ref_id VARCHAR(255) NULL,
  gateway_status VARCHAR(50) NULL,
  payload JSON NOT NULL,
  callback_received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_withdrawal_gateway_ref_id (gateway_ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
