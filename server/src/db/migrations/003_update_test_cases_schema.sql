-- Migration to update test_cases table to simplified format
-- Only keep essential fields: id, description, input, expected

-- Add new columns for simplified format
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS input JSONB,
ADD COLUMN IF NOT EXISTS expected JSONB;

-- Update existing data to use new format
-- Move data from test_data to input and expected_result to expected
UPDATE test_cases 
SET 
  input = COALESCE(test_data->'input', test_data),
  expected = COALESCE(test_data->'expected', expected_result::jsonb)
WHERE test_data IS NOT NULL OR expected_result IS NOT NULL;

-- Make input and expected NOT NULL for new records
ALTER TABLE test_cases 
ALTER COLUMN input SET NOT NULL,
ALTER COLUMN expected SET NOT NULL;

-- Drop old columns that are no longer needed
ALTER TABLE test_cases 
DROP COLUMN IF EXISTS test_type,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS test_steps,
DROP COLUMN IF EXISTS expected_result,
DROP COLUMN IF EXISTS test_data,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS created_at,
DROP COLUMN IF EXISTS updated_at;

-- Rename title to description for consistency
ALTER TABLE test_cases 
RENAME COLUMN title TO description;

-- Update the description column to be NOT NULL
ALTER TABLE test_cases 
ALTER COLUMN description SET NOT NULL;
