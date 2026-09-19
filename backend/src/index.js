require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files (untuk mengakses foto absensi)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));



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

// Routes
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const journalRoutes = require('./routes/journalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/auth', authRoutes);

// Endpoint sementara untuk reset password massal
app.get('/api/fix-password', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash('password123', salt);
    
    const pool = require('./config/db');
    await pool.query('UPDATE users SET password = ?', [newHash]);
    
    res.send('<h1>Perbaikan Berhasil!</h1><p>Semua password telah direset menjadi: <b>password123</b>. Silakan kembali ke Vercel dan coba login.</p>');
  } catch (error) {
    res.status(500).send('Gagal mereset password: ' + error.message);
  }
});

app.use('/api/locations', locationRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Sistem Presensi & Jurnal Magang/PKL API' });
});

// In-memory storage untuk live tracking 
const activeUsers = new Map(); // Maps userId -> user_data
const socketToUser = new Map(); // Maps socket.id -> userId

io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  // Kirim state awal ke klien yang baru terhubung
  socket.emit('live_locations', Array.from(activeUsers.values()));

  // Menerima update lokasi dari klien
  socket.on('update_location', async (data) => {
    if (!data.userId) return;
    
    socketToUser.set(socket.id, data.userId);
    
    let extraInfo = {};
    const existingUser = activeUsers.get(data.userId);
    
    // Gunakan cache jika sudah pernah di-fetch
    if (existingUser && existingUser.kelas !== undefined) {
      extraInfo = {
        kelas: existingUser.kelas,
        jurusan: existingUser.jurusan,
        nama_instansi: existingUser.nama_instansi,
        pembimbing_instansi: existingUser.pembimbing_instansi,
        photo: existingUser.photo
      };
    } else if (data.role === 'siswa') {
      // Ambil dari database sekali saja
      try {
        const db = require('./config/db');
        const [rows] = await db.execute('SELECT kelas, jurusan, nama_instansi, pembimbing_instansi, photo FROM users WHERE id = ?', [data.userId]);
        if (rows.length > 0) {
          extraInfo = rows[0];
        }
      } catch (err) {
        console.error('Socket DB Error:', err);
      }
    }

    activeUsers.set(data.userId, { ...data, socketId: socket.id, ...extraInfo });
    
    // Kirim seluruh data user aktif ke admin/guru yang mendengarkan
    io.emit('live_locations', Array.from(activeUsers.values()));
  });

  // Klien berhenti membagikan lokasi
  socket.on('stop_sharing', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      activeUsers.delete(userId);
      socketToUser.delete(socket.id);
      io.emit('live_locations', Array.from(activeUsers.values()));
    }
  });

  socket.on('disconnect', () => {
    // console.log('User disconnected:', socket.id);
    const userId = socketToUser.get(socket.id);
    if (userId) {
      activeUsers.delete(userId);
      socketToUser.delete(socket.id);
      io.emit('live_locations', Array.from(activeUsers.values()));
    }
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// trigger nodemon restart
// trigger db reconnect
