import request from 'supertest';
import app from '../src/app';
import { signToken } from '../src/utils/jwt';

describe('Admin protected route', () => {
  it('allows ADMIN token', async () => {
    const token = signToken({ sub: 'admin-id', role: 'ADMIN' }, '1h');
    const res = await request(app)
      .get('/admin/secret')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ secret: 'only for admins' });
  });

  it('denies USER token', async () => {
    const token = signToken({ sub: 'user-id', role: 'USER' }, '1h');
    const res = await request(app)
      .get('/admin/secret')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('denies missing token', async () => {
    const res = await request(app).get('/admin/secret');
    expect(res.status).toBe(401);
  });
});
