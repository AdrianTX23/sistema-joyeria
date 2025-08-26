import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Backup from './pages/Backup';
import Users from './pages/Users';
import TestResponsive from './pages/TestResponsive';

import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
                      <Route path="/sales" element={<Sales />} />
              <Route path="/reports" element={<Reports />} />
                      <Route path="/backup" element={<Backup />} />
        <Route path="/users" element={<Users />} />
        <Route path="/test-responsive" element={<TestResponsive />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
