import React, { useState, useEffect } from 'react';

const ViewExhibitions = () => {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiBaseURL}/api/exhibitions/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle DRF paginated response like in ExhibitionManagement
      const exhibitionsData = data.results || data;
      
    
      if (!Array.isArray(exhibitionsData)) {
        console.warn('Expected array but got:', exhibitionsData);
        setExhibitions([]);
      } else {
        setExhibitions(exhibitionsData);
      }
      
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    switch (status) {
      case 'UPCOMING':
        return { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1976d2' };
      case 'ONGOING':
        return { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case 'COMPLETED':
        return { ...baseStyle, backgroundColor: '#fce4ec', color: '#c2185b' };
      default:
        return { ...baseStyle, backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  const getDaysRemaining = (startDate, endDate, status) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (status === 'UPCOMING') {
      const daysToStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return daysToStart > 0 ? `Starts in ${daysToStart} days` : 'Starting soon';
    } else if (status === 'ONGOING') {
      const daysToEnd = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return daysToEnd > 0 ? `${daysToEnd} days remaining` : 'Ending soon';
    } else {
      return 'Exhibition completed';
    }
  };

  const filteredExhibitions = exhibitions.filter(exhibition => {
    const matchesFilter = filter === 'ALL' || exhibition.status === filter;
    const matchesSearch = exhibition.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading exhibitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      padding: '2rem 1rem' 
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#1e293b', 
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            Art Exhibitions
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#64748b', 
            maxWidth: '600px', 
            margin: '0 auto' 
          }}>
            Discover amazing art exhibitions featuring works from talented artists around the world
          </p>
        </div>

        {/* Filters Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'ONGOING', 'UPCOMING', 'COMPLETED'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid',
                  borderColor: filter === status ? '#3b82f6' : '#e2e8f0',
                  backgroundColor: filter === status ? '#3b82f6' : 'white',
                  color: filter === status ? 'white' : '#64748b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                {status === 'ALL' ? 'All Exhibitions' : status}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Search exhibitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              minWidth: '250px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #fecaca',
            textAlign: 'center'
          }}>
            <strong>Error:</strong> {error}
            <button
              onClick={fetchExhibitions}
              style={{
                marginLeft: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* No Results Message */}
        {filteredExhibitions.length === 0 && !error && (
          <div style={{
            backgroundColor: 'white',
            padding: '4rem 2rem',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#64748b', 
              marginBottom: '1rem' 
            }}>
              {searchTerm ? 
                `No exhibitions found matching "${searchTerm}"` : 
                `No ${filter === 'ALL' ? '' : filter.toLowerCase()} exhibitions available`
              }
            </p>
            {(searchTerm || filter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('ALL');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Exhibitions Grid */}
        {filteredExhibitions.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {filteredExhibitions.map((exhibition) => (
              <div 
                key={exhibition.id} 
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e2e8f0'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
                }}
              >
                {/* Exhibition Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '2rem',
                  color: 'white',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem'
                  }}>
                    <span style={getStatusBadgeStyle(exhibition.status)}>
                      {exhibition.status}
                    </span>
                  </div>
                  
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    lineHeight: '1.3',
                    paddingRight: '100px'
                  }}>
                    {exhibition.title}
                  </h3>
                  
                  <p style={{
                    fontSize: '0.95rem',
                    opacity: '0.9',
                    fontWeight: '500'
                  }}>
                    {getDaysRemaining(exhibition.start_date, exhibition.end_date, exhibition.status)}
                  </p>
                </div>

                {/* Exhibition Details */}
                <div style={{ padding: '2rem' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem'
                      }}>
                        Start Date
                      </h4>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {formatDate(exhibition.start_date)}
                      </p>
                    </div>
                    
                    <div>
                      <h4 style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem'
                      }}>
                        End Date
                      </h4>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {formatDate(exhibition.end_date)}
                      </p>
                    </div>
                  </div>

                  {exhibition.art_pieces && exhibition.art_pieces.length > 0 && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '1.5rem'
                    }}>
                      <h4 style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem'
                      }}>
                        Featured Artworks
                      </h4>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#3b82f6'
                      }}>
                        {exhibition.art_pieces.length} piece{exhibition.art_pieces.length !== 1 ? 's' : ''} on display
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    onClick={() => {
                      // Add navigation logic here if needed
                      alert(`More details about "${exhibition.title}" coming soon!`);
                    }}
                  >
                    View Exhibition Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {filteredExhibitions.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b',
              fontWeight: '500'
            }}>
              Showing {filteredExhibitions.length} of {exhibitions.length} exhibitions
              {filter !== 'ALL' && ` (filtered by ${filter})`}
              {searchTerm && ` (matching "${searchTerm}")`}
            </p>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ViewExhibitions;