import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './socket';

import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import workerRoutes from './routes/workerRoutes';
import bookingRoutes from './routes/bookingRoutes';
import cooperativeRoutes from './routes/cooperativeRoutes';
import governanceRoutes from './routes/governanceRoutes';
import adminRoutes from './routes/adminRoutes';
import requestRoutes from './routes/requestRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/cooperatives', cooperativeRoutes);
app.use('/api', governanceRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SahakarConnect Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` SahakarConnect API Server listening on port ${PORT}`);
  console.log(` Dev OTP Login Enabled (Use OTP: 123456)`);
  console.log(`=================================================`);
});
