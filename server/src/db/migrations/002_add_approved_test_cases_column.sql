-- Add approved_test_cases column to runs table
ALTER TABLE runs ADD COLUMN IF NOT EXISTS approved_test_cases JSONB DEFAULT '[]';
