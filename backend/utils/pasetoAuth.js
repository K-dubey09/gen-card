const { V4 } = require('paseto');
const { createPrivateKey, createPublicKey, generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const TOKEN_TTL_DAYS = Number.parseInt(process.env.AUTH_TOKEN_TTL_DAYS || '30', 10);
const TOKEN_TTL_MS = Math.max(1, TOKEN_TTL_DAYS) * 24 * 60 * 60 * 1000;
const KEY_FILE_PATH = process.env.PASETO_KEY_FILE || path.join(__dirname, '..', '.paseto-keys.json');

let cachedKeyPair = null;

const parseBase64Key = (value, kind) => {
  if (!value) return null;

  const pem = Buffer.from(value, 'base64').toString('utf8');
  return kind === 'private' ? createPrivateKey(pem) : createPublicKey(pem);
};

const getKeyPair = () => {
  if (cachedKeyPair) return cachedKeyPair;

  const privateKey = parseBase64Key(process.env.PASETO_PRIVATE_KEY_B64, 'private');
  const publicKey = parseBase64Key(process.env.PASETO_PUBLIC_KEY_B64, 'public');

  if (privateKey && publicKey) {
    cachedKeyPair = { privateKey, publicKey, isEphemeral: false };
    return cachedKeyPair;
  }

  if (fs.existsSync(KEY_FILE_PATH)) {
    try {
      const stored = JSON.parse(fs.readFileSync(KEY_FILE_PATH, 'utf8'));
      const filePrivateKey = parseBase64Key(stored.privateKey, 'private');
      const filePublicKey = parseBase64Key(stored.publicKey, 'public');

      if (filePrivateKey && filePublicKey) {
        cachedKeyPair = { privateKey: filePrivateKey, publicKey: filePublicKey, isEphemeral: false };
        return cachedKeyPair;
      }
    } catch (error) {
      console.warn('Failed to load persistent PASETO keys, regenerating:', error.message);
    }
  }

  const generated = generateKeyPairSync('ed25519', {
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' }
  });

  try {
    fs.writeFileSync(KEY_FILE_PATH, JSON.stringify({
      privateKey: Buffer.from(generated.privateKey).toString('base64'),
      publicKey: Buffer.from(generated.publicKey).toString('base64')
    }, null, 2));
  } catch (error) {
    console.warn('Failed to persist PASETO keys to disk:', error.message);
  }

  cachedKeyPair = {
    privateKey: createPrivateKey(generated.privateKey),
    publicKey: createPublicKey(generated.publicKey),
    isEphemeral: true
  };

  return cachedKeyPair;
};

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: TOKEN_TTL_MS,
  path: '/'
});

const parseCookies = (cookieHeader = '') => cookieHeader.split(';').reduce((accumulator, part) => {
  const index = part.indexOf('=');
  if (index === -1) return accumulator;

  const key = part.slice(0, index).trim();
  const value = part.slice(index + 1).trim();
  if (key) accumulator[key] = decodeURIComponent(value);
  return accumulator;
}, {});

const extractTokenFromRequest = (req) => {
  const authorization = req.headers.authorization || req.get?.('authorization') || '';
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];

  if (req.session?.authToken) return req.session.authToken;
  return null;
};

const buildUserContext = (user, tokenPayload = null) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  credits: user.credits,
  role: user.role,
  isActive: user.isActive,
  isUnlimited: user.role === 'admin',
  tokenExpiresAt: tokenPayload?.exp || null
});

const issueAuthToken = async (user) => {
  const { privateKey } = getKeyPair();
  const exp = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  return V4.sign(
    {
      sub: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role,
      credits: user.credits,
      isUnlimited: user.role === 'admin',
      exp
    },
    privateKey
  );
};

const verifyAuthToken = async (token) => {
  const { publicKey } = getKeyPair();
  const payload = await V4.verify(token, publicKey);

  if (payload.exp && new Date(payload.exp).getTime() <= Date.now()) {
    const error = new Error('Token expired');
    error.code = 'TOKEN_EXPIRED';
    throw error;
  }

  return payload;
};

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, getCookieOptions());
};

module.exports = {
  COOKIE_NAME,
  TOKEN_TTL_MS,
  buildUserContext,
  clearAuthCookie,
  extractTokenFromRequest,
  getCookieOptions,
  getKeyPair,
  issueAuthToken,
  setAuthCookie,
  verifyAuthToken
};