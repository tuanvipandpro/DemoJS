import { EventEmitter } from 'events';

/**
 * FSM States for the Orchestrator Worker
 */
export const FSM_STATES = {
  QUEUED: 'QUEUED',
  PLANNING: 'PLANNING',
  TOOLING: 'TOOLING',
  OBSERVING: 'OBSERVING',
  ADJUSTING: 'ADJUSTING',
  DONE: 'DONE',
  ERROR: 'ERROR',
  WAITING_REVIEW: 'WAITING_REVIEW'
};

/**
 * State Machine for orchestrating test runs
 */
export class StateMachine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.currentState = FSM_STATES.QUEUED;
    this.previousState = null;
    this.stateHistory = [];
    this.context = options.context || {};
    this.maxRetries = options.maxRetries || 3;
    this.retryCount = 0;
    this.error = null;
    this.metrics = {};
    
    // State transition rules
    this.transitions = {
      [FSM_STATES.QUEUED]: [FSM_STATES.PLANNING],
      [FSM_STATES.PLANNING]: [FSM_STATES.TOOLING, FSM_STATES.ERROR],
      [FSM_STATES.TOOLING]: [FSM_STATES.OBSERVING, FSM_STATES.ERROR],
      [FSM_STATES.OBSERVING]: [FSM_STATES.ADJUSTING, FSM_STATES.DONE, FSM_STATES.ERROR, FSM_STATES.WAITING_REVIEW],
      [FSM_STATES.ADJUSTING]: [FSM_STATES.PLANNING, FSM_STATES.TOOLING, FSM_STATES.ERROR],
      [FSM_STATES.ERROR]: [FSM_STATES.ADJUSTING, FSM_STATES.WAITING_REVIEW],
      [FSM_STATES.WAITING_REVIEW]: [FSM_STATES.PLANNING, FSM_STATES.DONE, FSM_STATES.ERROR],
      [FSM_STATES.DONE]: [] // Terminal state
    };
  }

  /**
   * Check if a state transition is valid
   * @param {string} fromState - Current state
   * @param {string} toState - Target state
   * @returns {boolean} Is transition valid
   */
  canTransition(fromState, toState) {
    const allowedTransitions = this.transitions[fromState] || [];
    return allowedTransitions.includes(toState);
  }

  /**
   * Transition to a new state
   * @param {string} newState - Target state
   * @param {Object} context - Additional context for the transition
   * @returns {boolean} Was transition successful
   */
  transitionTo(newState, context = {}) {
    if (!this.canTransition(this.currentState, newState)) {
      const error = new Error(
        `Invalid state transition from ${this.currentState} to ${newState}`
      );
      this.emit('transition:error', error, this.currentState, newState);
      return false;
    }

    // Update state history
    this.stateHistory.push({
      from: this.currentState,
      to: newState,
      timestamp: new Date(),
      context
    });

    // Update current state
    this.previousState = this.currentState;
    this.currentState = newState;

    // Update context
    this.context = { ...this.context, ...context };

    // Emit transition event
    this.emit('transition', this.previousState, this.currentState, this.context);

    // Emit state-specific event
    this.emit(`state:${this.currentState.toLowerCase()}`, this.context);

    return true;
  }

  /**
   * Get current state
   * @returns {string} Current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get previous state
   * @returns {string} Previous state
   */
  getPreviousState() {
    return this.previousState;
  }

  /**
   * Get state history
   * @returns {Array} State transition history
   */
  getStateHistory() {
    return [...this.stateHistory];
  }

  /**
   * Get context
   * @returns {Object} Current context
   */
  getContext() {
    return { ...this.context };
  }

  /**
   * Update context
   * @param {Object} updates - Context updates
   */
  updateContext(updates) {
    this.context = { ...this.context, ...updates };
    this.emit('context:updated', this.context);
  }

  /**
   * Set error and transition to ERROR state
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  setError(error, context = {}) {
    this.error = error;
    this.updateContext({ error: error.message, errorStack: error.stack, ...context });
    
    if (this.transitionTo(FSM_STATES.ERROR, { error: error.message })) {
      this.emit('error', error, this.context);
    }
  }

  /**
   * Get current error
   * @returns {Error|null} Current error
   */
  getError() {
    return this.error;
  }

  /**
   * Check if current state is terminal
   * @returns {boolean} Is terminal state
   */
  isTerminal() {
    return this.transitions[this.currentState].length === 0;
  }

  /**
   * Check if current state is error state
   * @returns {boolean} Is error state
   */
  isError() {
    return this.currentState === FSM_STATES.ERROR;
  }

  /**
   * Check if can retry
   * @returns {boolean} Can retry
   */
  canRetry() {
    return this.retryCount < this.maxRetries;
  }

  /**
   * Increment retry count
   * @returns {number} New retry count
   */
  incrementRetry() {
    this.retryCount++;
    this.emit('retry:incremented', this.retryCount);
    return this.retryCount;
  }

  /**
   * Reset retry count
   */
  resetRetry() {
    this.retryCount = 0;
    this.emit('retry:reset');
  }

  /**
   * Get retry count
   * @returns {number} Current retry count
   */
  getRetryCount() {
    return this.retryCount;
  }

  /**
   * Add metric
   * @param {string} key - Metric key
   * @param {any} value - Metric value
   */
  addMetric(key, value) {
    this.metrics[key] = value;
    this.emit('metric:added', key, value);
  }

  /**
   * Get metrics
   * @returns {Object} All metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get state machine summary
   * @returns {Object} State machine summary
   */
  getSummary() {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      stateHistory: this.getStateHistory(),
      context: this.getContext(),
      error: this.error ? {
        message: this.error.message,
        stack: this.error.stack
      } : null,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      metrics: this.getMetrics(),
      isTerminal: this.isTerminal(),
      isError: this.isError(),
      canRetry: this.canRetry()
    };
  }

  /**
   * Reset state machine to initial state
   */
  reset() {
    this.currentState = FSM_STATES.QUEUED;
    this.previousState = null;
    this.stateHistory = [];
    this.context = {};
    this.retryCount = 0;
    this.error = null;
    this.metrics = {};
    
    this.emit('reset');
  }

  /**
   * Validate state machine configuration
   * @returns {boolean} Is configuration valid
   */
  validate() {
    // Check if all states have transition rules
    for (const state of Object.values(FSM_STATES)) {
      if (!this.transitions[state]) {
        return false;
      }
    }
    
    // Check if all transition targets are valid states
    for (const [state, targets] of Object.entries(this.transitions)) {
      for (const target of targets) {
        if (!Object.values(FSM_STATES).includes(target)) {
          return false;
        }
      }
    }
    
    return true;
  }
}
