import jwt from 'jsonwebtoken';

const COOKIE = 'admin_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signAdminJWT(payload) {
  return jwt.sign(payload, process.env.ADMIN_JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyAdminJWT(token) {
  try {
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET);
  } catch {
    return null;
  }
}

export { COOKIE, MAX_AGE };
