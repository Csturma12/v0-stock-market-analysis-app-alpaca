-- Stock patterns table for autonomous trading pattern recognition
CREATE TABLE IF NOT EXISTS stock_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- 'uptrend_pullback', 'mean_reversion', 'range_bound', 'momentum', 'dividend_compounder'
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Pattern metrics
  avg_pullback_pct NUMERIC, -- average pullback % before resuming trend
  pullback_recovery_days NUMERIC, -- avg days to recover from pullback
  trend_strength NUMERIC, -- 0-100 score
  volatility_score NUMERIC, -- lower = more predictable
  win_rate_backtest NUMERIC, -- backtested win rate on this pattern
  avg_return_backtest NUMERIC, -- avg % return in backtest
  
  -- Suggested trade params
  suggested_entry_zone TEXT, -- e.g. "pullback to 20-day SMA"
  suggested_stop_pct NUMERIC, -- suggested stop loss %
  suggested_target_pct NUMERIC, -- suggested target %
  suggested_timeframe TEXT, -- 'weekly', 'monthly', 'quarterly'
  
  -- Analysis data
  analysis_summary TEXT, -- AI-generated summary
  key_levels JSONB, -- support/resistance levels
  
  -- Tracking
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  times_detected INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(ticker, pattern_type)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_stock_patterns_ticker ON stock_patterns(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_patterns_active ON stock_patterns(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stock_patterns_confidence ON stock_patterns(confidence DESC);

-- RLS
ALTER TABLE stock_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_patterns ON stock_patterns FOR ALL USING (true) WITH CHECK (true);
