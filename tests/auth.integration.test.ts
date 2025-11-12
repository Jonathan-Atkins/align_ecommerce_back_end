import request from 'supertest';
import app from '../src/app';

// Integration tests require seeded admin credentials and a reachable DATABASE_URL.
// These tests will be skipped if SEED_ADMIN1_EMAIL or SEED_ADMIN1_PASSWORD are not set.

const ADMIN_EMAIL = process.env.SEED_ADMIN1_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN1_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  // If env not provided, register a skipped test so Jest doesn't error about no tests.
  test.skip('Skipping integration tests for /auth/login because SEED_ADMIN1_EMAIL/SEED_ADMIN1_PASSWORD are not set.', () => {});
} else {
  describe('POST /auth/login (integration)', () => {
    it('logs in seeded admin and returns token that can access admin route', async () => {
      const res = await request(app).post('/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();

      // login should set a refreshToken cookie (httpOnly)
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const hasRefresh = setCookie.some((c: string) => c.startsWith('refreshToken='));
      expect(hasRefresh).toBe(true);

      const token = res.body.token;
      const adminRes = await request(app)
        .get('/admin/secret')
        .set('Authorization', `Bearer ${token}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body).toEqual({ secret: 'only for admins' });

      // use the refresh cookie to obtain a new access token
      const cookieHeader = setCookie.map((c: string) => c.split(';')[0]).join('; ');
  const refreshRes = await request(app).post('/auth/refresh').set('Cookie', cookieHeader).send();
  expect(refreshRes.status).toBe(200);
  expect(refreshRes.body.token).toBeTruthy();

  // after rotation, the old refresh cookie should be invalid
  const oldRefreshAttempt = await request(app).post('/auth/refresh').set('Cookie', cookieHeader).send();
  expect(oldRefreshAttempt.status).toBe(401);

      // logout should clear the cookie
      const logoutRes = await request(app).post('/auth/logout').set('Cookie', cookieHeader).send();
      expect(logoutRes.status).toBe(200);
      const logoutSet = logoutRes.headers['set-cookie'] || logoutRes.headers['Set-Cookie'];
      // cookie should be cleared (maxAge=0 or Expires in past) - ensure refreshToken cookie is present in response
      expect(logoutSet).toBeDefined();
    });

    it('rejects wrong password', async () => {
      const res = await request(app).post('/auth/login').send({ email: ADMIN_EMAIL, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });
}
