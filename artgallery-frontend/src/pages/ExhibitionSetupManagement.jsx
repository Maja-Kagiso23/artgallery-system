import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import ApiService from '../api/apiService';

const ExhibitionSetupManagement = () => {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState([]);
  const [setupStatuses, setSetupStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    console.log('🚀 ExhibitionSetupManagement useEffect triggered');
    console.log('User exists:', !!user);
    console.log('User details:', user);
    
    if (user) {
      console.log('✅ User exists, calling fetchData');
      fetchData();
    } else {
      console.log('❌ No user, skipping fetchData');
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      console.log('📊 Starting fetchData...');
      setLoading(true);
      await Promise.all([
        fetchExhibitions(),
        fetchSetupStatuses()
      ]);
    } catch (error) {
      console.error('❌ Failed to fetch initial data:', error);
      setError('Failed to load exhibition data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExhibitions = async () => {
    try {
      console.log('🌐 Fetching exhibitions...');
      const response = await ApiService.getExhibitions();
      const exhibitionsData = response.results || response;
      console.log('✅ Exhibitions received:', exhibitionsData);
      setExhibitions(Array.isArray(exhibitionsData) ? exhibitionsData : []);
    } catch (error) {
      console.error('❌ Failed to fetch exhibitions:', error);
      throw error;
    }
  };

  const fetchSetupStatuses = async () => {
    try {
      console.log('🌐 Fetching setup statuses...');
      const response = await ApiService.request('/setupstatuses/');
      const statusData = response.results || response;
      console.log('✅ Setup statuses received:', statusData);
      setSetupStatuses(Array.isArray(statusData) ? statusData : []);
    } catch (error) {
      console.error('❌ Failed to fetch setup statuses:', error);
    }
  };

  const getSetupStatus = (exhibitionId) => {
    return setupStatuses.find(status => status.exhibition === exhibitionId);
  };


const handleSetupConfirm = async (exhibition) => {
  if (!window.confirm(`Confirm setup completion for "${exhibition.title}"?\n\nThis will:\n- Mark all art pieces as DISPLAYED\n- Change exhibition status to ONGOING`)) return;
  
  setProcessingAction(`setup-${exhibition.id}`);
  try {
    console.log('🔧 Confirming setup for exhibition:', exhibition.title);

    // Update art pieces to DISPLAYED status
    const exhibitionArtPieces = exhibition.art_pieces || [];
    for (const artPiece of exhibitionArtPieces) {
      await ApiService.updateArtPiece(artPiece.id, {
        ...artPiece,
        status: 'DISPLAYED'
      });
    }

    let clerkId;
    try {
      const currentUser = ApiService.getCurrentUser();
      const clerks = await ApiService.getClerks();
      console.log('Available clerks:', clerks);

      let clerkObj = clerks.find(c => c.email === currentUser.email);
      
      if (!clerkObj) {
        clerkObj = clerks.find(c => c.email === 'alice.wilson@artgallery.com');
        console.log('Using hardcoded alice.wilson clerk for clerk01 user:', clerkObj);
      }
      
     
      if (!clerkObj && clerks.length > 0) {
        clerkObj = clerks[0];
        console.log('Using first available clerk:', clerkObj);
      }
      
      if (clerkObj) {
        clerkId = clerkObj.id;
        console.log('👤 Using clerk:', clerkObj);
      } else {
        throw new Error('No clerks found');
      }
    } catch (error) {
      console.log('⚠️ Clerk lookup failed, using hardcoded ID 1:', error.message);
      clerkId = 1;
    }

    // Build status data
    const existingStatus = getSetupStatus(exhibition.id);
    const statusData = {
      exhibition: exhibition.id,
      clerk: clerkId,
      setup_confirmed: true,
      teardown_confirmed: existingStatus?.teardown_confirmed || false
    };

    if (existingStatus) {
      await ApiService.request(`/setupstatuses/${existingStatus.id}/`, {
        method: 'PATCH',
        body: statusData
      });
    } else {
      await ApiService.request('/setupstatuses/', {
        method: 'POST',
        body: statusData
      });
    }

    // Update exhibition status to ONGOING
    if (exhibition.status === 'UPCOMING') {
      await ApiService.updateExhibition(exhibition.id, {
        ...exhibition,
        status: 'ONGOING'
      });
    }

    setSuccess(`Setup confirmed for "${exhibition.title}". Art pieces updated to DISPLAYED status.`);
    await fetchData();
    setTimeout(() => setSuccess(''), 5000);
  } catch (error) {
    console.error('❌ Setup confirmation failed:', error);
    setError(`Failed to confirm setup for "${exhibition.title}": ${error.message}`);
  } finally {
    setProcessingAction(null);
  }
};

const handleTeardownConfirm = async (exhibition) => {
  if (!window.confirm(`Confirm teardown completion for "${exhibition.title}"?\n\nThis will:\n- Mark all art pieces as AVAILABLE\n- Change exhibition status to COMPLETED`)) return;
  
  setProcessingAction(`teardown-${exhibition.id}`);
  try {
    console.log('🔧 Confirming teardown for exhibition:', exhibition.title);

    // Update art pieces back to AVAILABLE
    const exhibitionArtPieces = exhibition.art_pieces || [];
    for (const artPiece of exhibitionArtPieces) {
      await ApiService.updateArtPiece(artPiece.id, {
        ...artPiece,
        status: 'AVAILABLE'
      });
    }

    // 🔍 Try to get clerk, fall back to hardcoded
    let clerkId;
    try {
      const currentUser = ApiService.getCurrentUser();
      const clerks = await ApiService.getClerks();
      console.log('Available clerks:', clerks);
      
      // Try to find by email first
      let clerkObj = clerks.find(c => c.email === currentUser.email);
      
      // If not found by email, try by name or just use the first one
      if (!clerkObj && clerks.length > 0) {
        clerkObj = clerks[0]; // Use first available clerk
        console.log('No email match, using first clerk:', clerkObj);
      }
      
      if (clerkObj) {
        clerkId = clerkObj.id;
        console.log('👤 Using clerk:', clerkObj);
      } else {
        throw new Error('No clerks found');
      }
    } catch (error) {
      console.log('⚠️ Clerk lookup failed, using hardcoded ID 1:', error.message);
      clerkId = 1; // Hardcoded fallback - change this to actual clerk ID
    }

    // Build status data
    const existingStatus = getSetupStatus(exhibition.id);
    const statusData = {
      exhibition: exhibition.id,
      clerk: clerkId,
      setup_confirmed: existingStatus?.setup_confirmed || false,
      teardown_confirmed: true
    };

    if (existingStatus) {
      await ApiService.request(`/setupstatuses/${existingStatus.id}/`, {
        method: 'PATCH',
        body: statusData
      });
    } else {
      await ApiService.request('/setupstatuses/', {
        method: 'POST',
        body: statusData
      });
    }

    // Update exhibition status to COMPLETED
    await ApiService.updateExhibition(exhibition.id, {
      ...exhibition,
      status: 'COMPLETED'
    });

    setSuccess(`Teardown confirmed for "${exhibition.title}". Art pieces updated to AVAILABLE status.`);
    await fetchData();
    setTimeout(() => setSuccess(''), 5000);
  } catch (error) {
    console.error('❌ Teardown confirmation failed:', error);
    setError(`Failed to confirm teardown for "${exhibition.title}": ${error.message}`);
  } finally {
    setProcessingAction(null);
  }
};



  const getExhibitionStatusBadge = (status) => {
    const baseStyle = {
      padding: '0.3rem 0.8rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    switch (status) {
      case 'UPCOMING':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' };
      case 'ONGOING':
        return { ...baseStyle, backgroundColor: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' };
      case 'COMPLETED':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' };
      default:
        return { ...baseStyle, backgroundColor: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Access control
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'clerk' && user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
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
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading exhibition setup data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Setup Management Error</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>{error}</p>
          <button
            onClick={() => {
              setError('');
              fetchData();
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
            Retry
          </button>
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
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '3rem',
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
            Exhibition Setup & Teardown
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', 
            opacity: '0.9',
            fontWeight: '500'
          }}>
            manage art piece statuses
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #ffcdd2',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #c8e6c9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            ✓ {success}
          </div>
        )}

        {/* Exhibitions Grid */}
        {exhibitions.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '4rem 2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
              fontWeight: '700',
              color: '#64748b',
              marginBottom: '1rem'
            }}>
              No Exhibitions Found
            </h3>
            <p style={{ 
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', 
              color: '#64748b' 
            }}>
              There are currently no exhibitions to manage. Check back later or contact an administrator.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '2rem'
          }}>
            {exhibitions.map((exhibition) => {
              const setupStatus = getSetupStatus(exhibition.id);
              const artPiecesCount = exhibition.art_pieces?.length || 0;
              const isProcessing = processingAction?.includes(exhibition.id.toString());

              return (
                <div
                  key={exhibition.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
                  }}
                >
                  {/* Header */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ 
                        fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', 
                        fontWeight: '700', 
                        color: '#1e293b',
                        margin: 0,
                        lineHeight: '1.3',
                        flex: 1
                      }}>
                        {exhibition.title}
                      </h3>
                      <span style={getExhibitionStatusBadge(exhibition.status)}>
                        {exhibition.status}
                      </span>
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.95rem', 
                      color: '#64748b',
                      display: 'flex',
                      gap: '1.5rem',
                      fontWeight: '500'
                    }}>
                      <span>Start: {formatDate(exhibition.start_date)}</span>
                      <span>End: {formatDate(exhibition.end_date)}</span>
                    </div>
                  </div>

                  {/* Art Pieces Info */}
                  <div style={{ 
                    backgroundColor: '#f8fafc', 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    marginBottom: '1.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <span style={{ 
                        fontWeight: '600', 
                        fontSize: '1rem',
                        color: '#1e293b'
                      }}>
                        Art Pieces: {artPiecesCount}
                      </span>
                      <button
                        onClick={() => setSelectedExhibition(
                          selectedExhibition?.id === exhibition.id ? null : exhibition
                        )}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #3b82f6',
                          color: '#3b82f6',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#3b82f6';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#3b82f6';
                        }}
                      >
                        {selectedExhibition?.id === exhibition.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>

                    {/* Art Pieces Details */}
                    {selectedExhibition?.id === exhibition.id && (
                      <div style={{ marginTop: '1rem' }}>
                        {exhibition.art_pieces && exhibition.art_pieces.length > 0 ? (
                          <div>
                            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#374151' }}>Art Pieces:</h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {exhibition.art_pieces.map((piece) => (
                                <div key={piece.id} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.75rem',
                                  backgroundColor: 'white',
                                  borderRadius: '8px',
                                  marginBottom: '0.5rem',
                                  fontSize: '0.9rem',
                                  border: '1px solid #f1f5f9'
                                }}>
                                  <span style={{ fontWeight: '500', color: '#1e293b' }}>{piece.title}</span>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    backgroundColor: piece.status === 'DISPLAYED' ? '#d1ecf1' : 
                                                   piece.status === 'AVAILABLE' ? '#d4edda' : '#f8f9fa',
                                    color: piece.status === 'DISPLAYED' ? '#0c5460' : 
                                          piece.status === 'AVAILABLE' ? '#155724' : '#6c757d'
                                  }}>
                                    {piece.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
                            No art pieces assigned to this exhibition.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Setup Status */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: setupStatus?.setup_confirmed ? '#10b981' : '#f59e0b',
                          marginRight: '0.75rem',
                          boxShadow: setupStatus?.setup_confirmed ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : '0 0 0 3px rgba(245, 158, 11, 0.2)'
                        }}></div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>
                          Setup: {setupStatus?.setup_confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: setupStatus?.teardown_confirmed ? '#10b981' : '#f59e0b',
                          marginRight: '0.75rem',
                          boxShadow: setupStatus?.teardown_confirmed ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : '0 0 0 3px rgba(245, 158, 11, 0.2)'
                        }}></div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>
                          Teardown: {setupStatus?.teardown_confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Setup Button */}
                    {exhibition.status === 'UPCOMING' && !setupStatus?.setup_confirmed && (
                      <button
                        onClick={() => handleSetupConfirm(exhibition)}
                        disabled={isProcessing || artPiecesCount === 0}
                        style={{
                          backgroundColor: artPiecesCount === 0 ? '#9ca3af' : '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '1rem 1.5rem',
                          borderRadius: '8px',
                          cursor: artPiecesCount === 0 ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          flex: 1,
                          opacity: isProcessing ? 0.7 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        title={artPiecesCount === 0 ? 'Add art pieces to enable setup' : 'Confirm exhibition setup'}
                        onMouseEnter={(e) => {
                          if (artPiecesCount > 0 && !isProcessing) {
                            e.target.style.backgroundColor = '#059669';
                            e.target.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (artPiecesCount > 0 && !isProcessing) {
                            e.target.style.backgroundColor = '#10b981';
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {processingAction === `setup-${exhibition.id}` ? 'Processing...' : 'Confirm Setup'}
                      </button>
                    )}

                    {/* Setup Complete Indicator */}
                    {setupStatus?.setup_confirmed && !setupStatus?.teardown_confirmed && (
                      <div style={{
                        backgroundColor: '#e8f5e8',
                        color: '#2e7d32',
                        padding: '1rem 1.5rem',
                        borderRadius: '8px',
                        flex: 1,
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        border: '1px solid #c8e6c9'
                      }}>
                        Setup Complete ✓
                      </div>
                    )}

                    {/* Teardown Button */}
                    {(exhibition.status === 'ONGOING' || exhibition.status === 'COMPLETED') && 
                     setupStatus?.setup_confirmed && !setupStatus?.teardown_confirmed && (
                      <button
                        onClick={() => handleTeardownConfirm(exhibition)}
                        disabled={isProcessing}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '1rem 1.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          flex: 1,
                          opacity: isProcessing ? 0.7 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isProcessing) {
                            e.target.style.backgroundColor = '#b91c1c';
                            e.target.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isProcessing) {
                            e.target.style.backgroundColor = '#dc2626';
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {processingAction === `teardown-${exhibition.id}` ? 'Processing...' : 'Confirm Teardown'}
                      </button>
                    )}

                    {/* Complete Indicator */}
                    {setupStatus?.setup_confirmed && setupStatus?.teardown_confirmed && (
                      <div style={{
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        padding: '1rem 1.5rem',
                        borderRadius: '8px',
                        flex: 1,
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        border: '1px solid #dbeafe'
                      }}>
                        Setup & Teardown Complete ✓
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add CSS animation for the loading spinner */}
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

export default ExhibitionSetupManagement;