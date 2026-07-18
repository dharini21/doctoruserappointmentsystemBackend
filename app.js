const express = require('express');
const cors = require('cors');
const { connect } = require('mongoose');

const app = express();

require('dotenv').config();


const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
// --- CORS setup ---
// The frontend (Vite dev server) runs on http://localhost:5173 by default.
// Add any other origins you deploy the frontend to (e.g. a production URL)
// to this list, or set the FRONTEND_URL env var.
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://doctoruserappointmentsystem.vercel.app/',
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // The frontend sends the JWT in a raw `Authorization` header (no "Bearer " prefix),
  // so it must be explicitly allowed here.
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

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

connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('connected..susccessfully to the database');
  })
  .catch((error) => {
    console.error(error, 'connection failed');
  });

app.listen(3000, () => {
  console.log('listening on port 3000');
});
