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

-- Retain at most 90 days; schedule daily with your database provider.
-- DELETE FROM portfolio_events WHERE created_at < now() - interval '90 days';
