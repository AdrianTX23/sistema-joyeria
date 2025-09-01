import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Backup from './pages/Backup';
import LoadingSpinner from './components/LoadingSpinner';
import SimpleApp from './components/SimpleApp';

function App() {
  const { user, loading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Temporalmente usar SimpleApp para diagnóstico
  return (
    <Router>
      <SimpleApp />
    </Router>
  );

  // Código original comentado temporalmente
  /*
  return (
    <Router>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner size="lg" />
        </div>
      ) : !user ? (
        <Login />
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
            <Route path="/backup" element={<Backup />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
  */
}

export default App;
