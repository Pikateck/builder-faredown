-- Floor Enforcement Validation
-- Proves zero accepts below cost floor

-- Main query: Check for any accepted offers below true cost
WITH accepted_sessions AS (
  SELECT 
    e.session_id,
    e.true_cost_usd,
    MAX(CASE 
      WHEN e.event_type = 'accept' THEN e.counter_price 
      WHEN e.event_type = 'offer' AND e.accepted = true THEN e.user_offer 
    END) AS final_price,
    MAX(e.timestamp) AS final_timestamp
  FROM ai.bargain_events e
  WHERE e.accepted = true
    OR e.event_type = 'accept'
  GROUP BY e.session_id, e.true_cost_usd
  HAVING MAX(CASE 
    WHEN e.event_type = 'accept' THEN e.counter_price 
    WHEN e.event_type = 'offer' AND e.accepted = true THEN e.user_offer 
  END) IS NOT NULL
),
floor_violations AS (
  SELECT 
    session_id,
    true_cost_usd,
    final_price,
    final_price - true_cost_usd AS loss_amount,
    final_timestamp
  FROM accepted_sessions
  WHERE final_price < true_cost_usd
)

-- Main result: Count of below-floor accepts (should be 0)
SELECT 
  COUNT(*) AS below_floor_count,
  COALESCE(SUM(loss_amount), 0) AS total_loss_usd,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No accepts below floor'
    ELSE '❌ FAIL: ' || COUNT(*) || ' accepts below floor, total loss $' || ROUND(SUM(loss_amount), 2)
  END AS validation_result
FROM floor_violations;

-- Detailed violations (if any)
SELECT 
  session_id,
  true_cost_usd,
  final_price,
  loss_amount,
  final_timestamp,
  'VIOLATION: $' || ROUND(loss_amount, 2) || ' loss' AS details
FROM floor_violations
ORDER BY loss_amount DESC
LIMIT 10;

-- Summary stats for context
SELECT 
  'Summary Stats' AS metric_type,
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(*) AS total_events,
  SUM(CASE WHEN accepted = true THEN 1 ELSE 0 END) AS total_accepts,
  AVG(CASE WHEN accepted = true THEN counter_price - true_cost_usd END) AS avg_profit_per_accept,
  MIN(timestamp) AS earliest_event,
  MAX(timestamp) AS latest_event
FROM ai.bargain_events
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Recent margin distribution
SELECT 
  CASE 
    WHEN margin_pct < 0 THEN 'Loss'
    WHEN margin_pct < 5 THEN '0-5%'
    WHEN margin_pct < 10 THEN '5-10%'
    WHEN margin_pct < 20 THEN '10-20%'
    WHEN margin_pct < 30 THEN '20-30%'
    ELSE '30%+'
  END AS margin_bucket,
  COUNT(*) AS session_count,
  ROUND(AVG(margin_pct), 2) AS avg_margin_pct
FROM (
  SELECT 
    session_id,
    ((MAX(final_price) - MAX(true_cost_usd)) / MAX(true_cost_usd)) * 100 AS margin_pct
  FROM (
    SELECT 
      e.session_id,
      e.true_cost_usd,
      CASE 
        WHEN e.event_type = 'accept' THEN e.counter_price 
        WHEN e.event_type = 'offer' AND e.accepted = true THEN e.user_offer 
      END AS final_price
    FROM ai.bargain_events e
    WHERE (e.accepted = true OR e.event_type = 'accept')
      AND e.timestamp >= NOW() - INTERVAL '24 hours'
  ) prices
  WHERE final_price IS NOT NULL
  GROUP BY session_id
) margins
GROUP BY 
  CASE 
    WHEN margin_pct < 0 THEN 'Loss'
    WHEN margin_pct < 5 THEN '0-5%'
    WHEN margin_pct < 10 THEN '5-10%'
    WHEN margin_pct < 20 THEN '10-20%'
    WHEN margin_pct < 30 THEN '20-30%'
    ELSE '30%+'
  END
ORDER BY 
  CASE 
    WHEN margin_bucket = 'Loss' THEN 0
    WHEN margin_bucket = '0-5%' THEN 1
    WHEN margin_bucket = '5-10%' THEN 2
    WHEN margin_bucket = '10-20%' THEN 3
    WHEN margin_bucket = '20-30%' THEN 4
    ELSE 5
  END;

-- Alert for high loss rate (should be rare)
WITH recent_sessions AS (
  SELECT 
    session_id,
    true_cost_usd,
    MAX(CASE 
      WHEN event_type = 'accept' THEN counter_price 
      WHEN event_type = 'offer' AND accepted = true THEN user_offer 
    END) AS final_price
  FROM ai.bargain_events
  WHERE timestamp >= NOW() - INTERVAL '1 hour'
    AND (accepted = true OR event_type = 'accept')
  GROUP BY session_id, true_cost_usd
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No recent sessions'
    WHEN SUM(CASE WHEN final_price < true_cost_usd THEN 1 ELSE 0 END) = 0 THEN '✅ No losses in last hour'
    WHEN (SUM(CASE WHEN final_price < true_cost_usd THEN 1 ELSE 0 END)::float / COUNT(*)) > 0.02 THEN 
      '🚨 ALERT: ' || ROUND((SUM(CASE WHEN final_price < true_cost_usd THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 1) || '% loss rate > 2% threshold'
    ELSE '⚠️ ' || SUM(CASE WHEN final_price < true_cost_usd THEN 1 ELSE 0 END) || ' losses in last hour (under threshold)'
  END AS hourly_alert
FROM recent_sessions;
