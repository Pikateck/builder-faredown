-- Drops system monitor objects created for admin connectivity dashboard
DROP FUNCTION IF EXISTS system_monitor_retention();
DROP TABLE IF EXISTS system_monitor_logs;
