function parseNumber(input, fallback) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function createRateLimit(options = {}) {
  const windowMs = parseNumber(options.windowMs, 15 * 60 * 1000);
  const max = parseNumber(options.max, 10);
  const message = options.message || 'Too many requests';
  const keyGenerator = typeof options.keyGenerator === 'function'
    ? options.keyGenerator
    : (req) => req.ip;

  const entries = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of entries.entries()) {
      if (value.resetAt <= now) {
        entries.delete(key);
      }
    }
  }, Math.min(windowMs, 5 * 60 * 1000)).unref();

  return (req, res, next) => {
    const key = String(keyGenerator(req));
    const now = Date.now();
    const current = entries.get(key);

    if (!current || current.resetAt <= now) {
      entries.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      res.setHeader('x-ratelimit-limit', String(max));
      res.setHeader('x-ratelimit-remaining', String(max - 1));
      res.setHeader('x-ratelimit-reset', String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader('retry-after', String(retryAfterSeconds));
      res.setHeader('x-ratelimit-limit', String(max));
      res.setHeader('x-ratelimit-remaining', '0');
      res.setHeader('x-ratelimit-reset', String(Math.ceil(current.resetAt / 1000)));
      return res.status(429).json({ error: message });
    }

    current.count += 1;
    entries.set(key, current);
    res.setHeader('x-ratelimit-limit', String(max));
    res.setHeader('x-ratelimit-remaining', String(max - current.count));
    res.setHeader('x-ratelimit-reset', String(Math.ceil(current.resetAt / 1000)));
    return next();
  };
}

module.exports = { createRateLimit };
