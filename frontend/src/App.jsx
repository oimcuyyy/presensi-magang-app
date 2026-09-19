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

import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/live-tracking" element={<LiveTracking />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/attendance" element={<AdminAttendance />} />
        <Route path="/admin/locations" element={<AdminLocations />} />
      </Route>
    </Routes>
  );
}

export default App;
