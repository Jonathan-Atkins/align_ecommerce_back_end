import request from 'supertest';
import app from '../src/app';

// Integration tests require seeded admin credentials and a reachable DATABASE_URL.
// These tests will be skipped if SEED_ADMIN1_EMAIL or SEED_ADMIN1_PASSWORD are not set.

const ADMIN_EMAIL = process.env.SEED_ADMIN1_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN1_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  // eslint-disable-next-line no-console
  console.warn('Skipping integration tests for /auth/login because SEED_ADMIN1_EMAIL/SEED_ADMIN1_PASSWORD are not set.');
} else {
  describe('POST /auth/login (integration)', () => {
    it('logs in seeded admin and returns token that can access admin route', async () => {
      const res = await request(app).post('/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();

      const token = res.body.token;
      const adminRes = await request(app)
        .get('/admin/secret')
        .set('Authorization', `Bearer ${token}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body).toEqual({ secret: 'only for admins' });
    });

    it('rejects wrong password', async () => {
      const res = await request(app).post('/auth/login').send({ email: ADMIN_EMAIL, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });
}
