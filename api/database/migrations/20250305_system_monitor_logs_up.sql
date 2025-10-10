-- Creates system monitor logs table for admin connectivity dashboard
CREATE TABLE IF NOT EXISTS system_monitor_logs (
  id BIGSERIAL PRIMARY KEY,
  component VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  latency_ms INTEGER,
  detail JSONB,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_monitor_checked_at
  ON system_monitor_logs (checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_monitor_component
  ON system_monitor_logs (component);

CREATE OR REPLACE FUNCTION system_monitor_retention()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM system_monitor_logs
  WHERE checked_at < NOW() - INTERVAL '7 days';
END;
$$;
