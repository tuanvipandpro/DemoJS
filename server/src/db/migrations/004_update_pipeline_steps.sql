-- Migration: Update pipeline steps to new workflow
-- This migration updates the run_step table to use the new simplified workflow

-- Drop existing function
DROP FUNCTION IF EXISTS initialize_run_steps(INTEGER);

-- Update the run_step table comment to reflect new steps
COMMENT ON COLUMN run_step.step_name IS 'clean_workspace, pull_code_generate_test, generate_execute_scripts, report_approval, create_mr, completed';

-- Create new function to initialize run steps with updated workflow
CREATE OR REPLACE FUNCTION initialize_run_steps(p_run_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Insert all predefined steps for a run with new workflow
    INSERT INTO run_step (run_id, step_name, step_order, status) VALUES
    (p_run_id, 'clean_workspace', 1, 'pending'),
    (p_run_id, 'pull_code_generate_test', 2, 'pending'),
    (p_run_id, 'generate_execute_scripts', 3, 'pending'),
    (p_run_id, 'report_approval', 4, 'pending'),
    (p_run_id, 'create_mr', 5, 'pending'),
    (p_run_id, 'completed', 6, 'pending');
END;
$$ LANGUAGE plpgsql;

-- Update existing runs to use new step structure
-- First, delete old steps for existing runs
DELETE FROM run_step WHERE step_name IN (
    'queued', 'test_approval', 'generate_scripts', 'run_test', 'generate_report'
);

-- Add new steps for existing runs that don't have them
INSERT INTO run_step (run_id, step_name, step_order, status)
SELECT DISTINCT 
    r.id as run_id,
    step_name,
    step_order,
    CASE 
        WHEN r.state = 'completed' AND step_name = 'completed' THEN 'completed'
        WHEN r.state = 'failed' AND step_name = 'completed' THEN 'failed'
        WHEN r.state IN ('generating_tests', 'pulling_code') AND step_name = 'pull_code_generate_test' THEN 'running'
        WHEN r.state = 'test_approval' AND step_name = 'report_approval' THEN 'running'
        WHEN r.state = 'generating_scripts' AND step_name = 'generate_execute_scripts' THEN 'running'
        WHEN r.state = 'running_tests' AND step_name = 'generate_execute_scripts' THEN 'running'
        WHEN r.state = 'generating_report' AND step_name = 'generate_execute_scripts' THEN 'running'
        WHEN r.state = 'report_approval' AND step_name = 'report_approval' THEN 'running'
        WHEN r.state = 'completed' AND step_name != 'completed' THEN 'completed'
        ELSE 'pending'
    END as status
FROM runs r
CROSS JOIN (
    VALUES 
        ('clean_workspace', 1),
        ('pull_code_generate_test', 2),
        ('generate_execute_scripts', 3),
        ('report_approval', 4),
        ('create_mr', 5),
        ('completed', 6)
) AS new_steps(step_name, step_order)
WHERE NOT EXISTS (
    SELECT 1 FROM run_step rs 
    WHERE rs.run_id = r.id AND rs.step_name = new_steps.step_name
);

-- Update step statuses based on current run state
UPDATE run_step 
SET status = CASE 
    WHEN run_id IN (SELECT id FROM runs WHERE state = 'completed') AND step_name = 'completed' THEN 'completed'
    WHEN run_id IN (SELECT id FROM runs WHERE state = 'failed') AND step_name = 'completed' THEN 'failed'
    WHEN run_id IN (SELECT id FROM runs WHERE state IN ('generating_tests', 'pulling_code')) AND step_name = 'pull_code_generate_test' THEN 'running'
    WHEN run_id IN (SELECT id FROM runs WHERE state = 'test_approval') AND step_name = 'report_approval' THEN 'running'
    WHEN run_id IN (SELECT id FROM runs WHERE state IN ('generating_scripts', 'running_tests', 'generating_report')) AND step_name = 'generate_execute_scripts' THEN 'running'
    WHEN run_id IN (SELECT id FROM runs WHERE state = 'report_approval') AND step_name = 'report_approval' THEN 'running'
    WHEN run_id IN (SELECT id FROM runs WHERE state = 'completed') AND step_name != 'completed' THEN 'completed'
    ELSE 'pending'
END
WHERE run_id IN (SELECT id FROM runs WHERE state != 'queued');
