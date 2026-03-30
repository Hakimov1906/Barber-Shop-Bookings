const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const minLevel = LEVELS[configuredLevel] ?? LEVELS.info;

function normalizeMeta(meta) {
  if (!meta || typeof meta !== 'object') {
    return {};
  }

  const normalized = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value instanceof Error) {
      normalized[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
      continue;
    }
    normalized[key] = value;
  }
  return normalized;
}

function write(level, message, meta) {
  if ((LEVELS[level] ?? 999) < minLevel) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...normalizeMeta(meta)
  };

  const line = `${JSON.stringify(payload)}\n`;
  if (level === 'error') {
    process.stderr.write(line);
    return;
  }
  process.stdout.write(line);
}

const logger = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta)
};

module.exports = { logger };
