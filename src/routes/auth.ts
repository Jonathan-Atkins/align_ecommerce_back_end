import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { signToken, signRefreshToken, verifyToken } from '../utils/jwt';
import { hashToken, constantTimeEquals } from '../utils/hash';

export let prisma = new PrismaClient();
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
  const jti = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role, jti });

  // persist refresh token record (store a hash, not plaintext)
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      id: jti,
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

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
    // verify saved token and revoked status
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { id: verified.jti } });
    if (!tokenRecord || tokenRecord.revoked) return res.status(401).json({ error: 'Invalid refresh token' });

    // compare hashes
    const presentedHash = hashToken(refreshToken);
    if (!constantTimeEquals(presentedHash, tokenRecord.tokenHash)) {
      // possible token theft or reuse
      await prisma.refreshToken.updateMany({ where: { id: tokenRecord.id }, data: { revoked: true } });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = signToken({ sub: verified.sub, role: verified.role });
    const newJti = randomUUID();
    const newRefresh = signRefreshToken({ sub: verified.sub, role: verified.role, jti: newJti });

    // mark old token revoked and reference replacement
    await prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revoked: true, replacedBy: newJti } });
    // persist new refresh token (store hash)
    const newHash = hashToken(newRefresh);
    await prisma.refreshToken.create({
      data: {
        id: newJti,
        tokenHash: newHash,
        userId: tokenRecord.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

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
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.cookies || {};
  if (refreshToken) {
    try {
      const verified: any = verifyToken(refreshToken);
      // mark token revoked if exists
      await prisma.refreshToken.updateMany({ where: { id: verified.jti }, data: { revoked: true } });
    } catch (e) {
      // ignore
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
  return res.json({ ok: true });
});

export default router;
