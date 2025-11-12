import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-secure-value';

export function signToken(payload: object, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// alias for access tokens to make intention clearer in code
export function signAccessToken(payload: object, expiresIn = '1h') {
  return signToken(payload, expiresIn);
}

// refresh tokens are long-lived JWTs signed with same secret (stateless refresh)
export function signRefreshToken(payload: object, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}
