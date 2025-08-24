import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import ApiService from '../api/apiService';

const ManageVisitors = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExhibition, setSelectedExhibition] = useState('ALL');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all registrations and exhibitions
      const [registrationsData, exhibitionsData] = await Promise.all([
        ApiService.request('/registrations/'),
        ApiService.request('/exhibitions/')
      ]);
      
      // Handle DRF paginated response
      const registrationsArray = registrationsData.results || registrationsData;
      const exhibitionsArray = exhibitionsData.results || exhibitionsData;
      
      setRegistrations(Array.isArray(registrationsArray) ? registrationsArray : []);
      setExhibitions(Array.isArray(exhibitionsArray) ? exhibitionsArray : []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegistration = async (registration) => {
    setSelectedRegistration(registration);
    setShowConfirmModal(true);
  };

  const confirmRegistration = async () => {
    if (!selectedRegistration) return;
    
    try {
      setActionLoading(true);
      
      await ApiService.request(`/registrations/${selectedRegistration.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ confirmed: true })
      });
      
      // Refresh data
      await fetchData();
      
      setShowConfirmModal(false);
      setSelectedRegistration(null);
      
      alert(`Registration confirmed for ${selectedRegistration.visitor?.username || 'Unknown visitor'}`);
      
    } catch (error) {
      console.error('Confirmation failed:', error);
      alert(`Confirmation failed: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const cancelRegistration = async (registrationId, visitorName) => {
    if (!confirm(`Are you sure you want to cancel the registration for ${visitorName}?`)) return;
    
    try {
      setActionLoading(true);
      
      await ApiService.request(`/registrations/${registrationId}/`, {
        method: 'DELETE'
      });
      
      // Refresh data
      await fetchData();
      alert(`Registration cancelled for ${visitorName}`);
      
    } catch (error) {
      console.error('Cancellation failed:', error);
      alert(`Cancellation failed: ${error.message}`);
    } finally {
      setActionLoading(false);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeStyle = (confirmed) => {
    const baseStyle = {
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    return confirmed
      ? { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' }
      : { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
  };

  const getExhibitionStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '0.3rem 0.8rem',
      borderRadius: '15px',
      fontSize: '0.75rem',
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

  const getFilteredRegistrations = () => {
    let filtered = registrations;

    // Apply status filter
    if (filter === 'CONFIRMED') {
      filtered = filtered.filter(reg => reg.confirmed);
    } else if (filter === 'PENDING') {
      filtered = filtered.filter(reg => !reg.confirmed);
    }

    // Apply exhibition filter
    if (selectedExhibition !== 'ALL') {
      filtered = filtered.filter(reg => 
        reg.exhibition && reg.exhibition.id === parseInt(selectedExhibition)
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        (reg.visitor?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.visitor?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.exhibition?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const filteredRegistrations = getFilteredRegistrations();
  const totalRegistrations = registrations.length;
  const confirmedCount = registrations.filter(reg => reg.confirmed).length;
  const pendingCount = totalRegistrations - confirmedCount;

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
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading visitor registrations...</p>
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
            Visitor Registration Management
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#64748b', 
            maxWidth: '600px', 
            margin: '0 auto' 
          }}>
            Manage visitor registrations and handle confirmations
          </p>
        </div>

        {/* Stats Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center',
            border: '2px solid #3b82f6'
          }}>
            <h3 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#3b82f6',
              marginBottom: '0.5rem'
            }}>
              {totalRegistrations}
            </h3>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b', 
              fontWeight: '600'
            }}>
              Total Registrations
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center',
            border: '2px solid #10b981'
          }}>
            <h3 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              {confirmedCount}
            </h3>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b', 
              fontWeight: '600'
            }}>
              Confirmed
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center',
            border: '2px solid #f59e0b'
          }}>
            <h3 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#f59e0b',
              marginBottom: '0.5rem'
            }}>
              {pendingCount}
            </h3>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b', 
              fontWeight: '600'
            }}>
              Pending Review
            </p>
          </div>
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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['ALL', 'CONFIRMED', 'PENDING'].map(status => (
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
                {status === 'ALL' ? 'All Status' : status}
              </button>
            ))}

            <select
              value={selectedExhibition}
              onChange={(e) => setSelectedExhibition(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#64748b',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Exhibitions</option>
              {exhibitions.map(exhibition => (
                <option key={exhibition.id} value={exhibition.id}>
                  {exhibition.title}
                </option>
              ))}
            </select>
          </div>
          
          <input
            type="text"
            placeholder="Search by visitor name, email, or exhibition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              minWidth: '300px',
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
              onClick={fetchData}
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
        {filteredRegistrations.length === 0 && !error && (
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
                `No registrations found matching "${searchTerm}"` : 
                filter === 'CONFIRMED' ? 'No confirmed registrations' :
                filter === 'PENDING' ? 'No pending registrations' :
                selectedExhibition !== 'ALL' ? 'No registrations for selected exhibition' :
                'No registrations available'
              }
            </p>
            {(searchTerm || filter !== 'ALL' || selectedExhibition !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('ALL');
                  setSelectedExhibition('ALL');
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

        {/* Registrations Grid */}
        {filteredRegistrations.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {filteredRegistrations.map((registration) => {
              const exhibition = registration.exhibition;
              const visitor = registration.visitor;
              
              return (
                <div 
                  key={registration.id} 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    transition: 'all 0.3s ease',
                    border: registration.confirmed ? '2px solid #10b981' : '2px solid #f59e0b'
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
                  {/* Registration Header */}
                  <div style={{
                    background: registration.confirmed 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    padding: '2rem',
                    color: 'white',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexDirection: 'column',
                      alignItems: 'flex-end'
                    }}>
                      <span style={getStatusBadgeStyle(registration.confirmed)}>
                        {registration.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                      {exhibition && (
                        <span style={getExhibitionStatusBadgeStyle(exhibition.status)}>
                          {exhibition.status}
                        </span>
                      )}
                    </div>
                    
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem',
                      lineHeight: '1.3',
                      paddingRight: '120px'
                    }}>
                      {visitor?.username || 'Unknown Visitor'}
                    </h3>
                    
                    <p style={{
                      fontSize: '0.95rem',
                      opacity: '0.9',
                      fontWeight: '500'
                    }}>
                      {registration.attendees_count} attendee{registration.attendees_count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Registration Details */}
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
                          Visitor Email
                        </h4>
                        <p style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1e293b',
                          wordBreak: 'break-word'
                        }}>
                          {visitor?.email || 'Not available'}
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
                          Registration Date
                        </h4>
                        <p style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>
                          {formatDateTime(registration.created_at)}
                        </p>
                      </div>
                    </div>

                    {exhibition && (
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
                          Exhibition Details
                        </h4>
                        <p style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: '#3b82f6',
                          marginBottom: '0.5rem'
                        }}>
                          {exhibition.title}
                        </p>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#64748b'
                        }}>
                          {formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {!registration.confirmed && (
                        <button
                          onClick={() => handleConfirmRegistration(registration)}
                          disabled={actionLoading}
                          style={{
                            flex: '1',
                            padding: '0.875rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s',
                            opacity: actionLoading ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => !actionLoading && (e.target.style.backgroundColor = '#059669')}
                          onMouseLeave={(e) => !actionLoading && (e.target.style.backgroundColor = '#10b981')}
                        >
                          Confirm Registration
                        </button>
                      )}
                      
                      <button
                        onClick={() => cancelRegistration(
                          registration.id, 
                          visitor?.username || 'Unknown visitor'
                        )}
                        disabled={actionLoading}
                        style={{
                          flex: registration.confirmed ? '1' : '0.5',
                          padding: '0.875rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s',
                          opacity: actionLoading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => !actionLoading && (e.target.style.backgroundColor = '#b91c1c')}
                        onMouseLeave={(e) => !actionLoading && (e.target.style.backgroundColor = '#dc2626')}
                      >
                        Cancel Registration
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Summary */}
        {filteredRegistrations.length > 0 && (
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
              Showing {filteredRegistrations.length} of {totalRegistrations} registrations
              {filter !== 'ALL' && ` (${filter.toLowerCase()})`}
              {selectedExhibition !== 'ALL' && ` for selected exhibition`}
              {searchTerm && ` (matching "${searchTerm}")`}
            </p>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#64748b',
              marginTop: '0.5rem'
            }}>
              {confirmedCount} confirmed • {pendingCount} pending review
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedRegistration && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              Confirm Registration
            </h3>
            
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b', 
              marginBottom: '1.5rem' 
            }}>
              Are you sure you want to confirm this registration?
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p><strong>Visitor:</strong> {selectedRegistration.visitor?.username}</p>
              <p><strong>Exhibition:</strong> {selectedRegistration.exhibition?.title}</p>
              <p><strong>Attendees:</strong> {selectedRegistration.attendees_count}</p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRegistration}
                disabled={actionLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading ? 'Confirming...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ManageVisitors;