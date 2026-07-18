require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connect } = require('mongoose');

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

// --- Database connection ---
// Cache the connection so it's reused across serverless invocations
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('connected successfully to the database');
  } catch (error) {
    console.error('connection failed', error);
  }
}
connectDB();

// --- Error handler (keeps CORS headers even on errors) ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// --- Local dev only: run a real server ---
// On Vercel, this file is imported as a serverless function handler instead.
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('listening on port 3000');
  });
}

module.exports = app;