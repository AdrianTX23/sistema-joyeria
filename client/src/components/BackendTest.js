import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BackendTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Health check
      console.log('🧪 Test 1: Health check');
      const healthResponse = await axios.get('/api/health');
      results.health = {
        success: true,
        data: healthResponse.data
      };
    } catch (error) {
      results.health = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    try {
      // Test 2: Products test endpoint
      console.log('🧪 Test 2: Products test endpoint');
      const productsTestResponse = await axios.get('/api/products/test');
      results.productsTest = {
        success: true,
        data: productsTestResponse.data
      };
    } catch (error) {
      results.productsTest = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    try {
      // Test 3: Categories endpoint
      console.log('🧪 Test 3: Categories endpoint');
      const categoriesResponse = await axios.get('/api/categories');
      results.categories = {
        success: true,
        data: categoriesResponse.data
      };
    } catch (error) {
      results.categories = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    try {
      // Test 4: Products endpoint (with auth)
      console.log('🧪 Test 4: Products endpoint');
      const productsResponse = await axios.get('/api/products');
      results.products = {
        success: true,
        data: productsResponse.data
      };
    } catch (error) {
      results.products = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-lg font-semibold mb-4">🧪 Backend Connectivity Test</h3>
        
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Ejecutando tests...</p>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h4>
              
              {result.success ? (
                <div className="text-green-600">
                  <p>✅ Success</p>
                  <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-red-600">
                  <p>❌ Failed</p>
                  <p className="text-sm">Error: {result.error}</p>
                  {result.status && (
                    <p className="text-sm">Status: {result.status}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={runTests}
          disabled={loading}
          className="btn btn-primary mt-4"
        >
          {loading ? 'Ejecutando...' : 'Reejecutar Tests'}
        </button>
      </div>
    </div>
  );
};

export default BackendTest;
