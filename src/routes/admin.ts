import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/secret', requireAuth, requireRole('ADMIN'), (req, res) => {
  res.json({ secret: 'only for admins' });
});

export default router;
