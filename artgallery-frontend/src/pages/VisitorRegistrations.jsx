import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import ApiService from '../api/apiService';

const VisitorRegistrations = () => {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('AVAILABLE');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both exhibitions and user registrations
      const [exhibitionsData, registrationsData] = await Promise.all([
        ApiService.request('/exhibitions/'),
        ApiService.request('/registrations/my/')
      ]);
      
      // Handle DRF paginated response
      const exhibitionsArray = exhibitionsData.results || exhibitionsData;
      const registrationsArray = registrationsData.results || registrationsData;
      
      setExhibitions(Array.isArray(exhibitionsArray) ? exhibitionsArray : []);
      setRegistrations(Array.isArray(registrationsArray) ? registrationsArray : []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterForExhibition = async (exhibition) => {
    setSelectedExhibition(exhibition);
    setShowRegistrationModal(true);
    setAttendeesCount(1);
  };

  const submitRegistration = async () => {
    if (!selectedExhibition) return;
    
    try {
      setRegistrationLoading(true);
      
      const registrationData = {
        exhibition_id: selectedExhibition.id,
        attendees_count: attendeesCount
      };
      
      const response = await ApiService.request('/registrations/', {
        method: 'POST',
        body: JSON.stringify(registrationData)
      });
      
      // Refresh data to show new registration
      await fetchData();
      
      setShowRegistrationModal(false);
      setSelectedExhibition(null);
      
      // Show success message
      alert(`Successfully registered for "${selectedExhibition.title}" with ${attendeesCount} attendee${attendeesCount !== 1 ? 's' : ''}!`);
      
    } catch (error) {
      console.error('Registration failed:', error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const cancelRegistration = async (registrationId) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    
    try {
      await ApiService.request(`/registrations/${registrationId}/`, {
        method: 'DELETE'
      });
      
      // Refresh data
      await fetchData();
      alert('Registration cancelled successfully!');
      
    } catch (error) {
      console.error('Cancellation failed:', error);
      alert(`Cancellation failed: ${error.message}`);
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

  const getRegistrationBadgeStyle = (confirmed) => {
    const baseStyle = {
      padding: '0.3rem 0.8rem',
      borderRadius: '15px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    return confirmed
      ? { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' }
      : { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
  };

  const isRegisteredForExhibition = (exhibitionId) => {
    return registrations.some(reg => reg.exhibition && reg.exhibition.id === exhibitionId);
  };

  const getRegistrationForExhibition = (exhibitionId) => {
    return registrations.find(reg => reg.exhibition && reg.exhibition.id === exhibitionId);
  };

  const canRegisterForExhibition = (exhibition) => {
    return exhibition.status === 'UPCOMING' && !isRegisteredForExhibition(exhibition.id);
  };

  const getFilteredExhibitions = () => {
    let filtered = exhibitions;

    // Apply status filter
    if (filter === 'AVAILABLE') {
      filtered = filtered.filter(ex => ex.status === 'UPCOMING');
    } else if (filter === 'REGISTERED') {
      filtered = filtered.filter(ex => isRegisteredForExhibition(ex.id));
    } else if (filter !== 'ALL') {
      filtered = filtered.filter(ex => ex.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ex => 
        ex.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredExhibitions = getFilteredExhibitions();

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
            Exhibition Registrations
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#64748b', 
            maxWidth: '600px', 
            margin: '0 auto' 
          }}>
            Register for upcoming exhibitions and manage your bookings
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
            {['ALL', 'AVAILABLE', 'REGISTERED', 'ONGOING', 'COMPLETED'].map(status => (
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
                {status === 'ALL' ? 'All Exhibitions' : 
                 status === 'AVAILABLE' ? 'Available to Register' :
                 status === 'REGISTERED' ? 'My Registrations' : status}
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
                filter === 'REGISTERED' ? 'You have no registrations yet' :
                filter === 'AVAILABLE' ? 'No exhibitions available for registration' :
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
            {filteredExhibitions.map((exhibition) => {
              const registration = getRegistrationForExhibition(exhibition.id);
              const isRegistered = !!registration;
              const canRegister = canRegisterForExhibition(exhibition);
              
              return (
                <div 
                  key={exhibition.id} 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    transition: 'all 0.3s ease',
                    border: isRegistered ? '2px solid #10b981' : '1px solid #e2e8f0'
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
                    background: isRegistered 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                      <span style={getStatusBadgeStyle(exhibition.status)}>
                        {exhibition.status}
                      </span>
                      {isRegistered && (
                        <span style={getRegistrationBadgeStyle(registration.confirmed)}>
                          {registration.confirmed ? 'Confirmed' : 'Pending'}
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
                      {exhibition.title}
                    </h3>
                    
                    {isRegistered && (
                      <p style={{
                        fontSize: '0.95rem',
                        opacity: '0.9',
                        fontWeight: '500'
                      }}>
                        Registered for {registration.attendees_count} attendee{registration.attendees_count !== 1 ? 's' : ''}
                      </p>
                    )}
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

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {canRegister && (
                        <button
                          onClick={() => handleRegisterForExhibition(exhibition)}
                          style={{
                            flex: '1',
                            padding: '0.875rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                        >
                          Register Now
                        </button>
                      )}
                      
                      {isRegistered && (
                        <button
                          onClick={() => cancelRegistration(registration.id)}
                          style={{
                            flex: '1',
                            padding: '0.875rem',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                        >
                          Cancel Registration
                        </button>
                      )}
                      
                      {!canRegister && !isRegistered && (
                        <button
                          disabled
                          style={{
                            flex: '1',
                            padding: '0.875rem',
                            backgroundColor: '#9ca3af',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'not-allowed'
                          }}
                        >
                          {exhibition.status === 'COMPLETED' ? 'Exhibition Completed' : 
                           exhibition.status === 'ONGOING' ? 'Registration Closed' : 
                           'Unavailable'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
              {filter !== 'ALL' && ` (${filter === 'AVAILABLE' ? 'available to register' : 
                                       filter === 'REGISTERED' ? 'registered' : 
                                       `filtered by ${filter}`})`}
              {searchTerm && ` (matching "${searchTerm}")`}
            </p>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#64748b',
              marginTop: '0.5rem'
            }}>
              You are registered for {registrations.length} exhibition{registrations.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && selectedExhibition && (
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
              Register for Exhibition
            </h3>
            
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b', 
              marginBottom: '1.5rem' 
            }}>
              <strong>{selectedExhibition.title}</strong>
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Number of Attendees:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => setShowRegistrationModal(false)}
                disabled={registrationLoading}
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
                onClick={submitRegistration}
                disabled={registrationLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: registrationLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: registrationLoading ? 0.7 : 1
                }}
              >
                {registrationLoading ? 'Registering...' : 'Confirm Registration'}
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

export default VisitorRegistrations;