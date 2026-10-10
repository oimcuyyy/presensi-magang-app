import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Journal from './pages/Journal';
import AdminUsers from './pages/AdminUsers';
import AdminAttendance from './pages/AdminAttendance';
import AdminLocations from './pages/AdminLocations';
import Profile from './pages/Profile';
import LiveTracking from './pages/LiveTracking';
import StudentCard from './pages/StudentCard';
import ScanAttendance from './pages/ScanAttendance';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Routes wrapped in Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/profile" element={<Profile />} />

        {/* Digital Student Card / Barcode */}
        <Route path="/card" element={<StudentCard />} />

        {/* QR & Barcode Attendance Scanner for Petugas / Guru / Admin */}
        <Route
          path="/scan"
          element={
            <ProtectedRoute allowedRoles={['admin', 'guru_pembimbing']}>
              <ScanAttendance />
            </ProtectedRoute>
          }
        />

        {/* Live GPS Map Tracking */}
        <Route
          path="/live-tracking"
          element={
            <ProtectedRoute allowedRoles={['admin', 'guru_pembimbing']}>
              <LiveTracking />
            </ProtectedRoute>
          }
        />

        {/* Admin Specific Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLocations />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
