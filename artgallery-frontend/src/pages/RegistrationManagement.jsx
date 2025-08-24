import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import ApiService from '../api/apiService';

const RegistrationManagement = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

const fetchRegistrations = async () => {
  try {
    setLoading(true);
    setError('');
    
    console.log("🚀 Fetching registrations...");

    const response = await ApiService.request('/registrations/');
    console.log("📋 Raw registrations response:", response);

    if (!response) {
      console.warn("❌ No response from /registrations/");
      setRegistrations([]);
      return;
    }

    const registrationsData = response.results || response;
    console.log("✅ Processed registrationsData:", registrationsData);

    if (!Array.isArray(registrationsData)) {
      console.warn('⚠️ Expected array but got:', registrationsData);
      setRegistrations([]);
    } else {
      setRegistrations(registrationsData);
    }
  } catch (error) {
    console.error('🔥 Failed to fetch registrations:', error);
    setError('Failed to load registrations. Please check your permissions.');
  } finally {
    setLoading(false);
  }
};


  const handleApprove = async (registrationId) => {
    try {
      setActionLoading(true);
      setError('');
      
      // Use the approve endpoint
      await ApiService.request(`/registrations/${registrationId}/approve/`, {
        method: 'POST'
      });
      
      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId 
            ? { ...reg, status: 'APPROVED', confirmed: true }
            : reg
        )
      );
      
      setSuccess('Registration approved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Failed to approve registration:', error);
      setError(`Failed to approve registration: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

const handleReject = async (registrationId, reason = '') => {
  try {
    setActionLoading(true);
    setError('');
    
    console.log('🔄 Rejecting registration (alternative):', registrationId, 'with reason:', reason);
    
    // Try with FormData instead of JSON (some backends prefer this)
    const formData = new FormData();
    if (reason) {
      formData.append('reason', reason);
    }
    
    const response = await ApiService.request(`/registrations/${registrationId}/reject/`, {
      method: 'POST',
      body: formData // No Content-Type header - let browser set it for FormData
    });
    
    console.log('✅ Reject response (alternative):', response);
    
    // Update local state
    setRegistrations(prev => 
      prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: 'REJECTED', confirmed: false, rejection_reason: reason }
          : reg
      )
    );
    
    setSuccess('Registration rejected successfully!');
    setTimeout(() => setSuccess(''), 3000);
    
  } catch (error) {
    console.error('❌ Failed to reject registration (alternative):', error);
    setError(`Failed to reject registration: ${error.message}`);
  } finally {
    setActionLoading(false);
  }
};


  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setShowDetailModal(true);
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '0.4rem 0.8rem',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    switch (status) {
      case 'PENDING':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'APPROVED':
        return { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case 'REJECTED':
        return { ...baseStyle, backgroundColor: '#ffebee', color: '#d32f2f' };
      case 'CANCELLED':
        return { ...baseStyle, backgroundColor: '#f5f5f5', color: '#666' };
      default:
        return { ...baseStyle, backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredRegistrations = () => {
    let filtered = registrations;

    // Apply status filter
    if (filter !== 'ALL') {
      filtered = filtered.filter(reg => reg.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(reg => {
        const visitorName = reg.visitor?.name || reg.visitor_name || '';
        const visitorEmail = reg.visitor?.email || reg.visitor_email || '';
        const exhibitionTitle = reg.exhibition?.title || reg.exhibition_title || '';
        
        return (
          visitorName.toLowerCase().includes(searchLower) ||
          visitorEmail.toLowerCase().includes(searchLower) ||
          exhibitionTitle.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  const filteredRegistrations = getFilteredRegistrations();

  const statusCounts = {
    ALL: registrations.length,
    PENDING: registrations.filter(r => r.status === 'PENDING').length,
    APPROVED: registrations.filter(r => r.status === 'APPROVED').length,
    REJECTED: registrations.filter(r => r.status === 'REJECTED').length,
    CANCELLED: registrations.filter(r => r.status === 'CANCELLED').length,
  };

  if (!['admin', 'clerk'].includes(user?.role)) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ color: '#64748b' }}>Admin or Clerk role required to access registration management.</p>
        </div>
      </div>
    );
  }

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
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading registrations...</p>
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
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: '700', 
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            Registration Management
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', 
            opacity: '0.9',
            fontWeight: '500'
          }}>
            Manage visitor registrations for exhibitions
          </p>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => (
            <div 
              key={status}
              onClick={() => setFilter(status)}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                textAlign: 'center',
                cursor: 'pointer',
                border: filter === status ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
              }}
            >
              <h3 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                color: '#3b82f6',
                marginBottom: '0.5rem'
              }}>
                {statusCounts[status]}
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {status.toLowerCase()} registrations
              </p>
            </div>
          ))}
        </div>

        {/* Filters Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => (
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
                {status === 'ALL' ? 'All' : status}
              </button>
            ))}
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button
              onClick={fetchRegistrations}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #c8e6c9'
          }}>
            ✅ {success}
          </div>
        )}

        {/* Registrations Grid */}
        {filteredRegistrations.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '4rem 2rem',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#64748b', 
              marginBottom: '1rem' 
            }}>
              {searchTerm ? 
                `No registrations found matching "${searchTerm}"` : 
                filter === 'ALL' ? 'No registrations found' :
                `No ${filter.toLowerCase()} registrations`
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
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {filteredRegistrations.map((registration) => {
              // Handle different data structures from API
              const visitorName = registration.visitor?.name || registration.visitor_name || 'Unknown Visitor';
              const visitorEmail = registration.visitor?.email || registration.visitor_email || 'No email';
              const exhibitionTitle = registration.exhibition?.title || registration.exhibition_title || 'Unknown Exhibition';
              const exhibitionStatus = registration.exhibition?.status || 'Unknown';
              
              return (
                <div 
                  key={registration.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
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
                  {/* Header with status */}
                  <div style={{
                    padding: '1rem 1.5rem',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={getStatusBadgeStyle(registration.status)}>
                      {registration.status}
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      #{registration.queue_position || 'N/A'}
                    </span>
                  </div>

                  {/* Registration Details */}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: '#1e293b',
                        marginBottom: '0.5rem'
                      }}>
                        {exhibitionTitle}
                      </h3>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <p style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: '0.25rem'
                          }}>
                            Visitor
                          </p>
                          <p style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            {visitorName}
                          </p>
                          <p style={{
                            fontSize: '0.9rem',
                            color: '#64748b'
                          }}>
                            {visitorEmail}
                          </p>
                        </div>
                        
                        <div>
                          <p style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: '0.25rem'
                          }}>
                            Attendees
                          </p>
                          <p style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#3b82f6',
                            textAlign: 'center'
                          }}>
                            {registration.attendees_count || 1}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: '#f8fafc',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }}>
                        <p style={{
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#64748b',
                          marginBottom: '0.25rem'
                        }}>
                          Submitted
                        </p>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#1e293b'
                        }}>
                          {formatDate(registration.submitted_at || registration.timestamp)}
                        </p>
                      </div>

                      {registration.rejection_reason && (
                        <div style={{
                          backgroundColor: '#fef2f2',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          border: '1px solid #fecaca'
                        }}>
                          <p style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#dc2626',
                            marginBottom: '0.25rem'
                          }}>
                            Rejection Reason
                          </p>
                          <p style={{
                            fontSize: '0.9rem',
                            color: '#b91c1c'
                          }}>
                            {registration.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleViewDetails(registration)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          flex: '1'
                        }}
                      >
                        View Details
                      </button>
                      
                      {registration.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(registration.id)}
                            disabled={actionLoading}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: actionLoading ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              flex: '1',
                              opacity: actionLoading ? 0.7 : 1
                            }}
                          >
                            {actionLoading ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason (optional):') || '';
                              if (reason !== null) { // User didn't cancel
                                handleReject(registration.id, reason);
                              }
                            }}
                            disabled={actionLoading}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: actionLoading ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              flex: '1',
                              opacity: actionLoading ? 0.7 : 1
                            }}
                          >
                            {actionLoading ? 'Processing...' : 'Reject'}
                          </button>
                        </>
                      )}
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
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b',
              fontWeight: '500'
            }}>
              Showing {filteredRegistrations.length} of {registrations.length} registrations
              {filter !== 'ALL' && ` (filtered by ${filter.toLowerCase()})`}
              {searchTerm && ` (matching "${searchTerm}")`}
            </p>
          </div>
        )}
      </div>

      {/* Registration Detail Modal */}
      {showDetailModal && selectedRegistration && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px rgba(0,0,0,0.25)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1e293b',
                margin: 0
              }}>
                Registration Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '0.5rem'
                }}>
                  Exhibition
                </h3>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  {selectedRegistration.exhibition?.title || selectedRegistration.exhibition_title || 'Unknown'}
                </p>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#64748b'
                }}>
                  Status: {selectedRegistration.exhibition?.status || 'Unknown'}
                </p>
              </div>

              <div>
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '0.5rem'
                }}>
                  Visitor
                </h3>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  {selectedRegistration.visitor?.name || selectedRegistration.visitor_name || 'Unknown'}
                </p>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'inherit'
                }}>
                  {selectedRegistration.visitor?.email || selectedRegistration.visitor_email || 'No email'}
                </p>
                {selectedRegistration.visitor?.phone && (
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#64748b'
                  }}>
                    {selectedRegistration.visitor.phone}
                  </p>
                )}
              </div>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '0.5rem'
              }}>
                Registration Information
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '0.25rem'
                  }}>
                    Status
                  </p>
                  <span style={getStatusBadgeStyle(selectedRegistration.status)}>
                    {selectedRegistration.status}
                  </span>
                </div>
                
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '0.25rem'
                  }}>
                    Queue Position
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#3b82f6'
                  }}>
                    {selectedRegistration.queue_position || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '0.25rem'
                  }}>
                    Attendees
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {selectedRegistration.attendees_count || 1}
                  </p>
                </div>
                
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '0.25rem'
                  }}>
                    Submitted
                  </p>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#1e293b'
                  }}>
                    {formatDate(selectedRegistration.submitted_at || selectedRegistration.timestamp)}
                  </p>
                </div>
              </div>
            </div>

            {selectedRegistration.rejection_reason && (
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid #fecaca'
              }}>
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '0.5rem'
                }}>
                  Rejection Reason
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#b91c1c'
                }}>
                  {selectedRegistration.rejection_reason}
                </p>
              </div>
            )}

            {selectedRegistration.status === 'PENDING' && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    handleApprove(selectedRegistration.id);
                    setShowDetailModal(false);
                  }}
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
                  {actionLoading ? 'Processing...' : 'Approve Registration'}
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Enter rejection reason (optional):') || '';
                    if (reason !== null) {
                      handleReject(selectedRegistration.id, reason);
                      setShowDetailModal(false);
                    }
                  }}
                  disabled={actionLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: actionLoading ? 0.7 : 1
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Reject Registration'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Animation */}
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

export default RegistrationManagement;