import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';

const app = express();

app.use(express.json());

// configure CORS
const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3000';
const origins = rawOrigins.split(',').map((s) => s.trim());
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      if (origins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
