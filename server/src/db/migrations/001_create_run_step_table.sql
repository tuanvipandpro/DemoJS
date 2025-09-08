-- Migration: Create run_step table to replace step_history
-- This migration creates a new run_step table with predefined steps for each run

-- Drop existing step_history table if exists
DROP TABLE IF EXISTS step_history CASCADE;

-- Create run_step table
CREATE TABLE IF NOT EXISTS run_step (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    step_name VARCHAR(50) NOT NULL, -- queued, pull_code_generate_test, test_approval, generate_scripts, run_test, generate_report, report_approval, completed
    step_order INTEGER NOT NULL, -- order of steps (1-8)
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER, -- duration in milliseconds
    error_message TEXT,
    metadata JSONB DEFAULT '{}', -- additional step data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_run_step_run_id ON run_step(run_id);
CREATE INDEX IF NOT EXISTS idx_run_step_step_name ON run_step(step_name);
CREATE INDEX IF NOT EXISTS idx_run_step_status ON run_step(status);
CREATE INDEX IF NOT EXISTS idx_run_step_step_order ON run_step(step_order);

-- Create function to initialize run steps
CREATE OR REPLACE FUNCTION initialize_run_steps(p_run_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Insert all predefined steps for a run
    INSERT INTO run_step (run_id, step_name, step_order, status) VALUES
    (p_run_id, 'queued', 1, 'pending'),
    (p_run_id, 'pull_code_generate_test', 2, 'pending'),
    (p_run_id, 'test_approval', 3, 'pending'),
    (p_run_id, 'generate_scripts', 4, 'pending'),
    (p_run_id, 'run_test', 5, 'pending'),
    (p_run_id, 'generate_report', 6, 'pending'),
    (p_run_id, 'report_approval', 7, 'pending'),
    (p_run_id, 'completed', 8, 'pending');
END;
$$ LANGUAGE plpgsql;

-- Create function to update step status
CREATE OR REPLACE FUNCTION update_run_step_status(
    p_run_id INTEGER,
    p_step_name VARCHAR(50),
    p_status VARCHAR(20),
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    step_id INTEGER;
BEGIN
    -- Get step id
    SELECT id INTO step_id 
    FROM run_step 
    WHERE run_id = p_run_id AND step_name = p_step_name;
    
    IF step_id IS NULL THEN
        RAISE EXCEPTION 'Step % not found for run %', p_step_name, p_run_id;
    END IF;
    
    -- Update step status
    UPDATE run_step 
    SET 
        status = p_status,
        started_at = CASE WHEN p_status = 'running' AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
        completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END,
        duration_ms = CASE 
            WHEN p_status IN ('completed', 'failed') AND started_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) * 1000
            ELSE duration_ms 
        END,
        error_message = p_error_message,
        metadata = p_metadata,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = step_id;
END;
$$ LANGUAGE plpgsql;
