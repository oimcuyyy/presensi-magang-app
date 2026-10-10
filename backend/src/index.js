require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

// ─── Security Middleware ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS — restrict origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'https://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // In dev mode, allow all. In production, restrict.
    }
  },
  credentials: true
}));

// Rate limiting on auth routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 attempts per window
  message: { message: 'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { message: 'Terlalu banyak request. Coba lagi nanti.' }
});

app.use('/api/', apiLimiter);

// ─── Body Parser ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files (untuk mengakses foto absensi)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ─── Socket.io Setup ─────────────────────────────────────────────────
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Pass io to req so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const journalRoutes = require('./routes/journalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Auth routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/locations', locationRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Sistem Presensi & Jurnal Magang/PKL API v2.0', status: 'ok' });
});

// Global Error Handler (handles body-parser JSON syntax errors, rate limits, and unhandled errors)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Format payload JSON tidak valid.' });
  }
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan internal server.' });
});

// ─── Socket.io Live Tracking ─────────────────────────────────────────
const activeUsers = new Map();
app.locals.activeUsers = activeUsers;
const socketToUser = new Map();

io.on('connection', (socket) => {
  // Send initial state to newly connected client
  socket.emit('live_locations', Array.from(activeUsers.values()));

  // Receive location updates from clients
  socket.on('update_location', async (data) => {
    if (!data.userId) return;

    socketToUser.set(socket.id, data.userId);

    let extraInfo = {};
    const existingUser = activeUsers.get(data.userId);

    // Use cache if already fetched
    if (existingUser && existingUser.kelas !== undefined) {
      extraInfo = {
        kelas: existingUser.kelas,
        jurusan: existingUser.jurusan,
        nama_instansi: existingUser.nama_instansi,
        pembimbing_instansi: existingUser.pembimbing_instansi,
        photo: existingUser.photo
      };
    } else {
      try {
        const db = require('./config/db');
        const [rows] = await db.execute('SELECT kelas, jurusan, nama_instansi, pembimbing_instansi, photo FROM users WHERE id = ?', [data.userId]);
        if (rows.length > 0) {
          extraInfo = rows[0];
        } else {
          extraInfo = { kelas: null, jurusan: null, nama_instansi: null, pembimbing_instansi: null, photo: null };
        }
      } catch (err) {
        console.error('Socket DB Error:', err);
      }
    }

    activeUsers.set(data.userId, {
      ...data,
      socketId: socket.id,
      accuracy: data.accuracy || null,
      ...extraInfo
    });

    io.emit('live_locations', Array.from(activeUsers.values()));
  });

  socket.on('stop_sharing', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      activeUsers.delete(userId);
      socketToUser.delete(socket.id);
      io.emit('live_locations', Array.from(activeUsers.values()));
    }
  });

  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      activeUsers.delete(userId);
      socketToUser.delete(socket.id);
      io.emit('live_locations', Array.from(activeUsers.values()));
    }
  });
});

// ─── Start Server ────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
