import request from 'supertest';
import express from 'express';
import { signRefreshToken } from '../src/utils/jwt';
import * as authModule from '../src/routes/auth';

describe('refresh token rotation (unit)', () => {
  it('should reject when presented refresh token hash does not match saved hash', async () => {
    const fakeFind = jest.fn().mockResolvedValue({ id: 'jti-1', tokenHash: 'different-hash', revoked: false, userId: 'u1' });
    const fakeUpdateMany = jest.fn().mockResolvedValue({});
    const fakeUpdate = jest.fn().mockResolvedValue({});
    const fakeCreate = jest.fn().mockResolvedValue({});

    // replace prisma on the auth module
    (authModule as any).prisma = { refreshToken: { findUnique: fakeFind, updateMany: fakeUpdateMany, update: fakeUpdate, create: fakeCreate } };

  const app = express();
  app.use(express.json());
  // cookie parser is required so req.cookies is populated
  // use require here to avoid module resolution issues in the test runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());
  app.use('/', (authModule as any).default); // mount router

    const fakeToken = signRefreshToken({ sub: 'u1', role: 'ADMIN', jti: 'jti-1' });
    const cookieHeader = `refreshToken=${fakeToken}`;

    const res = await request(app).post('/refresh').set('Cookie', cookieHeader).send();

    expect(fakeFind).toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});
