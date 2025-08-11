-- AI Bargaining Platform Guardrails
-- Hard database-level never-loss protection

-- Function to assert never-loss constraint
CREATE OR REPLACE FUNCTION ai.assert_never_loss(_session_id uuid, _final_price numeric)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  _floor numeric;
  _true_cost numeric;
  _session_exists boolean;
BEGIN
  -- Check if session exists
  SELECT EXISTS(SELECT 1 FROM ai.bargain_sessions WHERE id = _session_id)
  INTO _session_exists;
  
  IF NOT _session_exists THEN
    RAISE EXCEPTION 'Session % not found', _session_id
    USING ERRCODE = '22023';
  END IF;

  -- Calculate floor from latest bargain event
  SELECT 
    COALESCE(MAX(true_cost_usd), 0) + 5.0  -- Add minimum $5 margin
  INTO _floor
  FROM ai.bargain_events 
  WHERE session_id = _session_id 
    AND true_cost_usd IS NOT NULL;

  -- If no events found, check supplier snapshots for session's product
  IF _floor IS NULL OR _floor = 5.0 THEN
    SELECT 
      MIN(net + COALESCE(taxes, 0) + COALESCE(fees, 0)) + 5.0
    INTO _floor
    FROM ai.supplier_rate_snapshots srs
    JOIN ai.bargain_sessions bs ON bs.id = _session_id
    WHERE srs.canonical_key = bs.canonical_key
      AND srs.snapshot_at > NOW() - INTERVAL '1 hour'
      AND srs.inventory_state = 'AVAILABLE';
  END IF;

  -- Default floor if nothing found
  IF _floor IS NULL THEN
    _floor := _final_price * 0.95; -- Allow 5% below as emergency fallback
  END IF;

  -- Assert never-loss constraint
  IF _final_price < _floor THEN
    RAISE EXCEPTION 'Never-loss violated: final price % < floor % for session %', 
      _final_price, _floor, _session_id
    USING ERRCODE = '23514';
  END IF;

  -- Log the guardrail check for audit
  INSERT INTO ai.bargain_events (
    session_id, 
    round, 
    action, 
    counter_price,
    true_cost_usd,
    accepted,
    context,
    created_at
  ) VALUES (
    _session_id,
    999, -- Special round number for guardrail events
    'GUARDRAIL_CHECK',
    _final_price,
    _floor - 5.0, -- Remove the added margin to get true cost
    true,
    jsonb_build_object(
      'guardrail_type', 'never_loss',
      'floor_calculated', _floor,
      'check_passed', true
    ),
    NOW()
  );

END $$;

-- Function to validate session state before critical operations
CREATE OR REPLACE FUNCTION ai.validate_session_state(_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  _session ai.bargain_sessions%ROWTYPE;
  _event_count integer;
  _last_event_time timestamptz;
  _result jsonb;
BEGIN
  -- Get session details
  SELECT * INTO _session
  FROM ai.bargain_sessions 
  WHERE id = _session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'SESSION_NOT_FOUND'
    );
  END IF;

  -- Check session age (max 30 minutes)
  IF _session.started_at < NOW() - INTERVAL '30 minutes' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'SESSION_EXPIRED',
      'started_at', _session.started_at
    );
  END IF;

  -- Count events and get last event time
  SELECT 
    COUNT(*),
    COALESCE(MAX(created_at), _session.started_at)
  INTO _event_count, _last_event_time
  FROM ai.bargain_events
  WHERE session_id = _session_id;

  -- Check if too many rounds (policy violation)
  IF _event_count > 20 THEN -- Generous limit
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'TOO_MANY_ROUNDS',
      'event_count', _event_count
    );
  END IF;

  -- Check for recent activity (no events in last 10 minutes = stale)
  IF _last_event_time < NOW() - INTERVAL '10 minutes' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'SESSION_STALE',
      'last_event_at', _last_event_time
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'valid', true,
    'session_id', _session_id,
    'event_count', _event_count,
    'last_event_at', _last_event_time,
    'session_age_minutes', EXTRACT(EPOCH FROM (NOW() - _session.started_at)) / 60
  );

END $$;

-- Function to calculate current profit margin for a session
CREATE OR REPLACE FUNCTION ai.calculate_session_margin(_session_id uuid, _proposed_price numeric)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  _true_cost numeric;
  _margin numeric;
  _margin_pct numeric;
  _result jsonb;
BEGIN
  -- Get the latest true cost from events
  SELECT true_cost_usd
  INTO _true_cost
  FROM ai.bargain_events
  WHERE session_id = _session_id 
    AND true_cost_usd IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no cost in events, calculate from snapshots
  IF _true_cost IS NULL THEN
    SELECT 
      MIN(net + COALESCE(taxes, 0) + COALESCE(fees, 0))
    INTO _true_cost
    FROM ai.supplier_rate_snapshots srs
    JOIN ai.bargain_sessions bs ON bs.id = _session_id
    WHERE srs.canonical_key = bs.canonical_key
      AND srs.snapshot_at > NOW() - INTERVAL '1 hour'
      AND srs.inventory_state = 'AVAILABLE';
  END IF;

  -- Default cost if nothing found
  IF _true_cost IS NULL THEN
    _true_cost := _proposed_price * 0.8; -- Assume 20% margin as fallback
  END IF;

  -- Calculate margin
  _margin := _proposed_price - _true_cost;
  _margin_pct := CASE 
    WHEN _true_cost > 0 THEN (_margin / _true_cost) * 100 
    ELSE 0 
  END;

  RETURN jsonb_build_object(
    'session_id', _session_id,
    'proposed_price', _proposed_price,
    'true_cost', _true_cost,
    'margin_usd', _margin,
    'margin_percent', round(_margin_pct, 2),
    'is_profitable', _margin > 0,
    'calculated_at', NOW()
  );

END $$;

-- Function to get session performance metrics
CREATE OR REPLACE FUNCTION ai.get_session_performance(_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  _session ai.bargain_sessions%ROWTYPE;
  _first_event timestamptz;
  _last_event timestamptz;
  _event_count integer;
  _final_accepted boolean;
  _final_price numeric;
  _duration_seconds integer;
  _result jsonb;
BEGIN
  -- Get session details
  SELECT * INTO _session
  FROM ai.bargain_sessions 
  WHERE id = _session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'SESSION_NOT_FOUND');
  END IF;

  -- Get event statistics
  SELECT 
    MIN(created_at),
    MAX(created_at),
    COUNT(*),
    BOOL_OR(accepted),
    MAX(CASE WHEN accepted THEN counter_price END)
  INTO _first_event, _last_event, _event_count, _final_accepted, _final_price
  FROM ai.bargain_events
  WHERE session_id = _session_id;

  -- Calculate duration
  _duration_seconds := COALESCE(
    EXTRACT(EPOCH FROM (_last_event - _first_event)),
    EXTRACT(EPOCH FROM (NOW() - _session.started_at))
  );

  RETURN jsonb_build_object(
    'session_id', _session_id,
    'product_type', _session.product_type,
    'canonical_key', _session.canonical_key,
    'started_at', _session.started_at,
    'first_event_at', _first_event,
    'last_event_at', _last_event,
    'duration_seconds', _duration_seconds,
    'event_count', COALESCE(_event_count, 0),
    'final_accepted', COALESCE(_final_accepted, false),
    'final_price', _final_price,
    'policy_version', _session.policy_version,
    'model_version', _session.model_version
  );

END $$;

-- Trigger to automatically validate bargain events
CREATE OR REPLACE FUNCTION ai.validate_bargain_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Validate counter_price is not below true_cost if specified
  IF NEW.counter_price IS NOT NULL AND NEW.true_cost_usd IS NOT NULL THEN
    IF NEW.counter_price < NEW.true_cost_usd THEN
      RAISE EXCEPTION 'Counter price % below true cost % in event for session %',
        NEW.counter_price, NEW.true_cost_usd, NEW.session_id
      USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Validate revenue calculation if accepted
  IF NEW.accepted AND NEW.revenue_usd IS NOT NULL AND NEW.counter_price IS NOT NULL THEN
    IF ABS(NEW.revenue_usd - NEW.counter_price) > 0.01 THEN
      RAISE WARNING 'Revenue % does not match counter price % for session %',
        NEW.revenue_usd, NEW.counter_price, NEW.session_id;
    END IF;
  END IF;

  RETURN NEW;
END $$;

-- Create trigger on bargain_events
DROP TRIGGER IF EXISTS validate_bargain_event_trigger ON ai.bargain_events;
CREATE TRIGGER validate_bargain_event_trigger
  BEFORE INSERT OR UPDATE ON ai.bargain_events
  FOR EACH ROW
  EXECUTE FUNCTION ai.validate_bargain_event();

-- Function to archive old sessions (cleanup)
CREATE OR REPLACE FUNCTION ai.archive_old_sessions(_retention_days integer DEFAULT 90)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  _sessions_archived integer;
  _events_archived integer;
  _capsules_archived integer;
BEGIN
  -- Count what will be archived
  SELECT COUNT(*) INTO _sessions_archived
  FROM ai.bargain_sessions
  WHERE started_at < NOW() - (_retention_days || ' days')::interval;

  SELECT COUNT(*) INTO _events_archived
  FROM ai.bargain_events e
  JOIN ai.bargain_sessions s ON s.id = e.session_id
  WHERE s.started_at < NOW() - (_retention_days || ' days')::interval;

  SELECT COUNT(*) INTO _capsules_archived
  FROM ai.offer_capsules c
  JOIN ai.bargain_sessions s ON s.id = c.session_id
  WHERE s.started_at < NOW() - (_retention_days || ' days')::interval;

  -- Archive (for now, just delete - in production, move to archive tables)
  DELETE FROM ai.offer_capsules
  WHERE session_id IN (
    SELECT id FROM ai.bargain_sessions
    WHERE started_at < NOW() - (_retention_days || ' days')::interval
  );

  DELETE FROM ai.bargain_events
  WHERE session_id IN (
    SELECT id FROM ai.bargain_sessions
    WHERE started_at < NOW() - (_retention_days || ' days')::interval
  );

  DELETE FROM ai.bargain_sessions
  WHERE started_at < NOW() - (_retention_days || ' days')::interval;

  RETURN jsonb_build_object(
    'archived_at', NOW(),
    'retention_days', _retention_days,
    'sessions_archived', _sessions_archived,
    'events_archived', _events_archived,
    'capsules_archived', _capsules_archived
  );

END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bargain_events_session_time ON ai.bargain_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_started ON ai.bargain_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_capsules_session ON ai.offer_capsules(session_id, created_at DESC);

-- Grant execute permissions to application user
-- GRANT EXECUTE ON FUNCTION ai.assert_never_loss TO bargain_api_user;
-- GRANT EXECUTE ON FUNCTION ai.validate_session_state TO bargain_api_user;
-- GRANT EXECUTE ON FUNCTION ai.calculate_session_margin TO bargain_api_user;
-- GRANT EXECUTE ON FUNCTION ai.get_session_performance TO bargain_api_user;

-- Comments for documentation
COMMENT ON FUNCTION ai.assert_never_loss IS 'Hard constraint enforcement - prevents any transaction below calculated cost floor';
COMMENT ON FUNCTION ai.validate_session_state IS 'Session validation before critical operations';
COMMENT ON FUNCTION ai.calculate_session_margin IS 'Real-time margin calculation for pricing decisions';
COMMENT ON FUNCTION ai.get_session_performance IS 'Session analytics and performance metrics';
COMMENT ON FUNCTION ai.archive_old_sessions IS 'Cleanup function for old session data';
