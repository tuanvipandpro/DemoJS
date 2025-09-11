/**
 * Pipeline Steps Constants
 * Định nghĩa các step trong pipeline workflow
 */

// Enum cho các step names
export const STEP_NAMES = {
  CLEAN_WORKSPACE: 'clean_workspace',
  PULL_CODE_GENERATE_TESTS: 'pull_code_generate_test',
  TEST_APPROVAL: 'test_approval',
  GENERATE_EXECUTE_SCRIPTS: 'generate_execute_scripts',
  COVERAGE_APPROVAL: 'coverage_approval',
  CREATE_MR: 'create_mr',
  COMPLETED: 'completed'
};

// Enum cho step status
export const STEP_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Enum cho step order (thứ tự thực hiện)
export const STEP_ORDER = {
  CLEAN_WORKSPACE: 1,
  PULL_CODE_GENERATE_TESTS: 2,
  TEST_APPROVAL: 3,
  GENERATE_EXECUTE_SCRIPTS: 4,
  COVERAGE_APPROVAL: 5,
  CREATE_MR: 6,
  COMPLETED: 7
};

// Mapping từ step name sang display name
export const STEP_DISPLAY_NAMES = {
  [STEP_NAMES.CLEAN_WORKSPACE]: 'Clean Workspace',
  [STEP_NAMES.PULL_CODE_GENERATE_TESTS]: 'Pull Code & Generate Tests',
  [STEP_NAMES.TEST_APPROVAL]: 'Test Approval',
  [STEP_NAMES.GENERATE_EXECUTE_SCRIPTS]: 'Generate & Execute Test Scripts',
  [STEP_NAMES.COVERAGE_APPROVAL]: 'Coverage Approval',
  [STEP_NAMES.CREATE_MR]: 'Create MR',
  [STEP_NAMES.COMPLETED]: 'Complete'
};

// Mapping từ step name sang description
export const STEP_DESCRIPTIONS = {
  [STEP_NAMES.CLEAN_WORKSPACE]: 'Clearing workspace and removing old test files',
  [STEP_NAMES.PULL_CODE_GENERATE_TESTS]: 'Downloading source code and generating test cases with AI',
  [STEP_NAMES.TEST_APPROVAL]: 'Waiting for user approval of test cases',
  [STEP_NAMES.GENERATE_EXECUTE_SCRIPTS]: 'Creating and executing test scripts',
  [STEP_NAMES.COVERAGE_APPROVAL]: 'Waiting for user approval of coverage report',
  [STEP_NAMES.CREATE_MR]: 'Creating merge request with test results',
  [STEP_NAMES.COMPLETED]: 'Test run completed successfully'
};

// Danh sách tất cả các step theo thứ tự
export const ALL_STEPS = [
  {
    name: STEP_NAMES.CLEAN_WORKSPACE,
    order: STEP_ORDER.CLEAN_WORKSPACE,
    displayName: STEP_DISPLAY_NAMES[STEP_NAMES.CLEAN_WORKSPACE],
    description: STEP_DESCRIPTIONS[STEP_NAMES.CLEAN_WORKSPACE]
  },
  {
    name: STEP_NAMES.PULL_CODE_GENERATE_TESTS,
    order: STEP_ORDER.PULL_CODE_GENERATE_TESTS,
    displayName: STEP_DISPLAY_NAMES[STEP_NAMES.PULL_CODE_GENERATE_TESTS],
    description: STEP_DESCRIPTIONS[STEP_NAMES.PULL_CODE_GENERATE_TESTS]
  },
  {
    name: STEP_NAMES.TEST_APPROVAL,
    order: STEP_ORDER.TEST_APPROVAL,
    displayName: STEP_DISPLAY_NAMES[STEP_NAMES.TEST_APPROVAL],
    description: STEP_DESCRIPTIONS[STEP_NAMES.TEST_APPROVAL]
  },
  {
    name: STEP_NAMES.GENERATE_EXECUTE_SCRIPTS,
    order: STEP_ORDER.GENERATE_EXECUTE_SCRIPTS,
    displayName: STEP_DISPLAY_NAMES[STEP_NAMES.GENERATE_EXECUTE_SCRIPTS],
    description: STEP_DESCRIPTIONS[STEP_NAMES.GENERATE_EXECUTE_SCRIPTS]
  },
  {
    name: STEP_NAMES.COVERAGE_APPROVAL,
    order: STEP_ORDER.COVERAGE_APPROVAL,
    displayName: STEP_DISPLAY_NAMES[STEP_NAMES.COVERAGE_APPROVAL],
    description: STEP_DESCRIPTIONS[STEP_NAMES.COVERAGE_APPROVAL]
  },
  {
    name: STEP_NAMES.CREATE_MR,
    order: STEP_ORDER.CREATE_MR,
    displayName: STEP_DISPLAY_NAMES[STEP_NAMES.CREATE_MR],
    description: STEP_DESCRIPTIONS[STEP_NAMES.CREATE_MR]
  },
  {
    name: STEP_NAMES.COMPLETED,
    order: STEP_ORDER.COMPLETED,
    displayName: STEP_DISPLAY_NAMES[STEP_NAMES.COMPLETED],
    description: STEP_DESCRIPTIONS[STEP_NAMES.COMPLETED]
  }
];

// Helper function để lấy step theo name
export const getStepByName = (stepName) => {
  return ALL_STEPS.find(step => step.name === stepName);
};

// Helper function để lấy step theo order
export const getStepByOrder = (order) => {
  return ALL_STEPS.find(step => step.order === order);
};

// Helper function để lấy tất cả step names
export const getAllStepNames = () => {
  return ALL_STEPS.map(step => step.name);
};
