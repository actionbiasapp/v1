'use client';

import { useState } from 'react';

export default function FMPTestPage() {
  const [symbol, setSymbol] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSymbol = async () => {
    if (!symbol.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/fmp-test?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Test failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/fmp-test?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Test failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">FMP API Integration Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Symbol Validation Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Symbol Validation</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter symbol (e.g., AAPL, TSLA)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={testSymbol}
                disabled={loading || !symbol.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Symbol'}
              </button>
            </div>
          </div>

          {/* Company Lookup Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Company Lookup</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter company name (e.g., Apple, Tesla)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={testQuery}
                disabled={loading || !query.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Looking up...' : 'Lookup Company'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* API Key Status */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">API Key Status:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                result?.apiKeyConfigured 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {result?.apiKeyConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              To configure FMP API, add FMP_API_KEY to your environment variables.
            </p>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Symbol Validation:</h3>
              <p className="text-sm text-gray-600">AAPL, TSLA, GOOGL, MSFT, NVDA</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Company Lookup:</h3>
              <p className="text-sm text-gray-600">Apple, Tesla, Google, Microsoft, NVIDIA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 