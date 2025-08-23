import React, { useState, useEffect } from 'react';

const ViewExhibitions = () => {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check what's available in localStorage
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      setDebugInfo({
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'No token',
        user: user ? JSON.parse(user) : 'No user data',
        currentURL: window.location.href,
        apiBaseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'
      });

      // Try different API endpoints to see which one works
      const possibleEndpoints = [
        '/api/exhibitions/',           // Standard DRF endpoint
        '/api/exhibitions/public/',    // Custom public endpoint
        '/api/public/exhibitions/',    // Alternative public endpoint
        '/api/visitor/exhibitions/'    // Visitor-specific endpoint
      ];

      let response = null;
      let usedEndpoint = '';

      for (const endpoint of possibleEndpoints) {
        try {
          const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
          const fullURL = `${baseURL}${endpoint}`;
          
          console.log(`Trying endpoint: ${fullURL}`);
          
          // Try without authentication first (for public access)
          response = await fetch(fullURL, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            usedEndpoint = endpoint;
            console.log(`Success with endpoint: ${endpoint}`);
            break;
          } else {
            console.log(`Failed with endpoint: ${endpoint}, Status: ${response.status}`);
          }
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, endpointError.message);
        }
      }

      // If no public endpoint worked, try with authentication
      if (!response || !response.ok) {
        const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const fullURL = `${baseURL}/api/exhibitions/`;
        
        console.log(`Trying authenticated request to: ${fullURL}`);
        
        response = await fetch(fullURL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        
        usedEndpoint = '/api/exhibitions/ (authenticated)';
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log('Exhibition data received:', data);
      
      setExhibitions(Array.isArray(data) ? data : data.results || []);
      setDebugInfo(prev => ({
        ...prev,
        usedEndpoint,
        responseStatus: response.status,
        dataReceived: data
      }));
      
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exhibitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Art Exhibitions</h1>
          <p className="text-gray-600">Discover amazing art exhibitions</p>
        </div>

        {/* Debug Information Panel */}
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Has Token:</strong> {debugInfo.hasToken ? 'Yes' : 'No'}</p>
            <p><strong>Token Preview:</strong> {debugInfo.tokenPrefix}</p>
            <p><strong>User Data:</strong> {JSON.stringify(debugInfo.user)}</p>
            <p><strong>Current URL:</strong> {debugInfo.currentURL}</p>
            <p><strong>API Base URL:</strong> {debugInfo.apiBaseURL}</p>
            <p><strong>Used Endpoint:</strong> {debugInfo.usedEndpoint}</p>
            <p><strong>Response Status:</strong> {debugInfo.responseStatus}</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Details</h2>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            <button
              onClick={fetchExhibitions}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {exhibitions.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No exhibitions available at the moment.</p>
          </div>
        )}

        {exhibitions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exhibitions.map((exhibition) => (
              <div key={exhibition.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{exhibition.title}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Start Date:</strong> {new Date(exhibition.start_date).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(exhibition.end_date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        exhibition.status === 'ONGOING' ? 'bg-green-100 text-green-800' :
                        exhibition.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {exhibition.status}
                      </span>
                    </p>
                    {exhibition.art_pieces && (
                      <p><strong>Art Pieces:</strong> {exhibition.art_pieces.length} pieces</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewExhibitions;