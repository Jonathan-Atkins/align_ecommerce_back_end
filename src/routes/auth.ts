import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { signToken, signRefreshToken, verifyToken } from '../utils/jwt';

const prisma = new PrismaClient();
const router = express.Router();

// POST /auth/login
// returns short-lived access token in the body and sets an httpOnly refresh token cookie
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'invalid credentials' });

  const accessToken = signToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

  const isProd = process.env.NODE_ENV === 'production';
  // set httpOnly refresh cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.json({ token: accessToken, user: { id: user.id, email: user.email, role: user.role } });
});

// POST /auth/refresh
// reads httpOnly refresh cookie and returns a new access token (and rotates refresh cookie)
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.cookies || {};
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const verified: any = verifyToken(refreshToken);
    const accessToken = signToken({ sub: verified.sub, role: verified.role });
    const newRefresh = signRefreshToken({ sub: verified.sub, role: verified.role });

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ token: accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /auth/logout
// clears refresh cookie
router.post('/logout', (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
  return res.json({ ok: true });
});

export default router;
