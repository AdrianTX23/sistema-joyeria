import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugInfo = () => {
  const auth = useAuth();
  
  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Debug Info</h3>
      <div className="text-xs space-y-1">
        <div><strong>User:</strong> {auth.user ? 'Logged in' : 'Not logged in'}</div>
        <div><strong>Loading:</strong> {auth.loading ? 'Yes' : 'No'}</div>
        <div><strong>Token:</strong> {auth.token ? 'Present' : 'Missing'}</div>
        <div><strong>User ID:</strong> {auth.user?.id || 'N/A'}</div>
        <div><strong>Username:</strong> {auth.user?.username || 'N/A'}</div>
        <div><strong>Role:</strong> {auth.user?.role || 'N/A'}</div>
        <div><strong>Session Type:</strong> {auth.user ? 'Active' : 'None'}</div>
      </div>
    </div>
  );
};

export default DebugInfo;
