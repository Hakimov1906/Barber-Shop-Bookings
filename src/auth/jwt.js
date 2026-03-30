const jwt = require('jsonwebtoken');

function toSecretList(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getJwtSecrets() {
  const ordered = [];

  const addSecrets = (secrets) => {
    for (const secret of secrets) {
      if (!ordered.includes(secret)) {
        ordered.push(secret);
      }
    }
  };

  addSecrets(toSecretList(process.env.JWT_SECRETS));
  addSecrets(toSecretList(process.env.JWT_SECRET_CURRENT));
  addSecrets(toSecretList(process.env.JWT_SECRET));
  addSecrets(toSecretList(process.env.JWT_SECRET_PREVIOUS));

  return ordered;
}

function getJwtConfig() {
  const verificationSecrets = getJwtSecrets();
  return {
    signingSecret: verificationSecrets[0] || null,
    verificationSecrets
  };
}

function signAccessToken(payload, options = {}) {
  const { signingSecret } = getJwtConfig();
  if (!signingSecret) {
    throw new Error('JWT secret is not configured');
  }

  const expiresIn = options.expiresIn || process.env.JWT_TTL || '7d';
  return jwt.sign(payload, signingSecret, { expiresIn });
}

function verifyAccessToken(token) {
  const { verificationSecrets } = getJwtConfig();
  if (!verificationSecrets.length) {
    throw new Error('JWT secret is not configured');
  }

  let lastError = null;

  for (const secret of verificationSecrets) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      lastError = err;
      if (err && err.name === 'JsonWebTokenError' && err.message === 'invalid signature') {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Invalid token');
}

module.exports = { getJwtConfig, signAccessToken, verifyAccessToken };
