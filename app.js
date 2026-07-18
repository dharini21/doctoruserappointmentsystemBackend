require('dotenv').config();

// Fix for local dev: some ISPs/routers don't support SRV DNS record lookups,
// which mongodb+srv:// requires. Force Node to use Google's DNS instead.
// This only runs locally — Vercel's infrastructure resolves SRV records fine.
if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// --- CORS setup ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://doctoruserappointmentsystem.vercel.app',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// --- Database connection (cached across serverless invocations) ---
let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('connected successfully to the database');
  } catch (error) {
    isConnected = false;
    console.error('connection failed', error);
    throw error;
  }
}

// Try connecting once at startup (gives immediate feedback in local dev logs)
connectDB().catch(() => {});

// --- Middleware: ensure DB is connected before handling any request ---
// This matters most on Vercel, where cold starts mean the connection
// above may not have finished before the first request arrives.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({ message: 'Database unavailable, please try again shortly.' });
  }
});

// --- Routes ---
const userRoutes = require('./routes/userRoutes.js');
app.use('/api', userRoutes);

const adminRoutes = require('./routes/adminRoutes.js');
app.use('/api', adminRoutes);

const doctorRoutes = require('./routes/doctorRoutes.js');
app.use('/api', doctorRoutes);

app.get('/', function (req, res) {
  res.status(200).json({
    status: 'UP',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// --- Local dev only: run a real server ---
// On Vercel, this file is imported as a serverless function handler instead,
// so app.listen() is skipped there (NODE_ENV is 'production' automatically).
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('listening on port 3000');
  });
}
/*
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI?.slice(0, 15));
console.log('URI length:', process.env.MONGODB_URI?.length);
console.log('URI JSON:', JSON.stringify(process.env.MONGODB_URI));
*/
module.exports = app;