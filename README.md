# Presensi Magang App

Aplikasi presensi (absensi) magang berbasis web dengan fitur geolokasi, realtime socket.io, dan stack MERN/MySQL. 
Aplikasi ini terbagi menjadi dua bagian: **Backend (Node.js/Express)** dan **Frontend (React/Vite)**.

## Fitur Utama
- **Geolokasi**: Perekaman lokasi saat presensi (menggunakan Leaflet.js).
- **Realtime Updates**: Sinkronisasi data realtime dengan Socket.io.
- **Autentikasi**: Sistem login aman dengan JWT dan bcrypt.
- **Role Management**: Mendukung peran (role) yang berbeda (misal: admin, user).

## Prasyarat (Prerequisites)
Sebelum menginstal aplikasi ini, pastikan Anda telah memasang:
- **Node.js** (versi 18 ke atas disarankan)
- **MySQL Server** (atau XAMPP/Laragon jika menggunakan lokal)
- **Git** (untuk version control)

---

## Panduan Instalasi (Installation Guide)

### 1. Kloning Repositori
Clone repositori ke mesin lokal Anda:
```bash
git clone https://github.com/oimcuyyy/presensi-magang-app.git
cd presensi-magang-app
```

### 2. Setup Database
1. Buat database baru di MySQL Anda, misalnya `presensi_magang`.
2. Import skema database yang telah disediakan:
   ```bash
   mysql -u root -p presensi_magang < database/schema.sql
   ```
   *(Atau bisa di-import menggunakan phpMyAdmin / DBeaver ke database yang baru dibuat).*

### 3. Setup Backend
Masuk ke folder backend, instal dependensi, dan sesuaikan file environment:
```bash
cd backend
npm install
```
Konfigurasi file `.env`. Di dalam folder `backend`, buat file `.env` (atau edit jika sudah ada) dan sesuaikan nilainya:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=presensi_magang
JWT_SECRET=rahasia_jwt_anda
PORT=3000
```
Jalankan server backend:
```bash
npm run dev
```
*(Backend akan berjalan di `http://localhost:3000`)*

### 4. Setup Frontend
Buka terminal baru, masuk ke folder frontend, dan instal dependensi:
```bash
cd frontend
npm install
```
Jalankan development server frontend:
```bash
npm run dev
```
*(Frontend akan berjalan di port yang disediakan Vite, biasanya `http://localhost:5173` atau sesuai dengan konfigurasi vite host).*

---

## Struktur Folder
- `/backend`: Berisi kode sumber untuk REST API, konfigurasi Socket.io, dan koneksi database MySQL.
- `/frontend`: Berisi kode sumber aplikasi React (UI, State Management, Map Component).
- `/database`: Berisi file `schema.sql` untuk membuat tabel database.

## Teknologi yang Digunakan
**Frontend:**
- React 19 + Vite
- TailwindCSS
- React Router DOM
- Leaflet & React Leaflet (Maps)
- Socket.io Client
- Axios

**Backend:**
- Node.js & Express.js
- MySQL2
- JWT & Bcryptjs
- Socket.io
