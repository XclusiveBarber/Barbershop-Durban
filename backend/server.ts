import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import appointmentsRouter from './routes/appointments';
import availabilityRouter from './routes/availability';
import barbersRouter from './routes/barbers';
import haircutsRouter from './routes/haircuts';
import analyticsRouter from './routes/analytics';
import customersRouter from './routes/customers';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/appointments', appointmentsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/barbers', barbersRouter);
app.use('/api/haircuts', haircutsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/customers', customersRouter);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

export default app;
