// Simple logger without external dependencies
const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLogLevel() {
  const envLevel = (process.env.LOG_LEVEL || '').toLowerCase();
  if (envLevel && LEVELS[envLevel] !== undefined) return envLevel;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const currentLevel = resolveLogLevel();

function isEnabled(level) {
  return LEVELS[level] >= LEVELS[currentLevel];
}

function timestamp() {
  return new Date().toISOString();
}

function levelBadge(level) {
  switch (level) {
    case 'debug':
      return ' [DEBUG] ';
    case 'info':
      return ' [INFO] ';
    case 'warn':
      return ' [WARN] ';
    case 'error':
      return ' [ERROR] ';
    default:
      return ` [${level.toUpperCase()}] `;
  }
}

function chooseConsole(level) {
  if (level === 'error') return console.error.bind(console);
  if (level === 'warn') return console.warn.bind(console);
  return console.log.bind(console);
}

function log(level, ...args) {
  if (!isEnabled(level)) return;
  const ts = `[${timestamp()}]`;
  const badge = levelBadge(level);
  const writer = chooseConsole(level);
  writer(badge, ts, ...args);
}

export const logger = {
  level: currentLevel,
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};


