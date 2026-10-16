CREATE TABLE IF NOT EXISTS portfolio_events (
  id uuid PRIMARY KEY,
  visitor_id uuid NOT NULL,
  session_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('page','section','project','contact','outbound','heartbeat')),
  path text NOT NULL,
  target text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'Direto',
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_events_time ON portfolio_events(created_at);
CREATE INDEX IF NOT EXISTS portfolio_events_occurred ON portfolio_events(occurred_at);
CREATE INDEX IF NOT EXISTS portfolio_events_visitor ON portfolio_events(visitor_id, created_at);

CREATE TABLE IF NOT EXISTS portfolio_analytics_sessions (
  token_hash char(64) PRIMARY KEY,
  google_sub text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_analytics_sessions_expiry ON portfolio_analytics_sessions(expires_at);

-- Retain at most 90 days; schedule daily with your database provider.
-- DELETE FROM portfolio_events WHERE created_at < now() - interval '90 days';
-- DELETE FROM portfolio_analytics_sessions WHERE expires_at <= now();
