import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import ApiService from '../api/apiService';

const ExhibitionManagement = () => {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState([]);
  const [artPieces, setArtPieces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState(null);
  const [showRegistrations, setShowRegistrations] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    status: 'UPCOMING'
  });

  const statusChoices = [
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'ONGOING', label: 'Ongoing' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  // Fetch exhibitions, art pieces, and registrations on component mount
  useEffect(() => {
    fetchExhibitions();
    fetchArtPieces();
    fetchAllRegistrations();
  }, []);

  // Periodically refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!actionLoading && !loading) {
        fetchAllRegistrations();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [actionLoading, loading]);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getExhibitions();
      
      // Extract exhibitions from DRF paginated response
      const exhibitionsData = response.results || response;
      
      // Ensure it's always an array
      if (!Array.isArray(exhibitionsData)) {
        console.warn('Expected array but got:', exhibitionsData);
        setExhibitions([]);
      } else {
        setExhibitions(exhibitionsData);
      }
      setError('');
    } catch (error) {
      console.error('Failed to fetch exhibitions:', error);
      setError('Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtPieces = async () => {
    try {
      const response = await ApiService.getArtPieces();
      const artPiecesData = response.results || response;
      
      if (!Array.isArray(artPiecesData)) {
        console.warn('Expected array but got:', artPiecesData);
        setArtPieces([]);
      } else {
        setArtPieces(artPiecesData);
      }
    } catch (error) {
      console.error('Failed to fetch art pieces:', error);
    }
  };

  const fetchAllRegistrations = async () => {
    try {
      const response = await ApiService.request('/registrations/');
      const registrationsData = response.results || response;
      
      if (!Array.isArray(registrationsData)) {
        console.warn('Expected array but got:', registrationsData);
        setRegistrations([]);
      } else {
        setRegistrations(registrationsData);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      setRegistrations([]);
    }
  };

  const refreshAllData = async () => {
    try {
      await Promise.all([
        fetchExhibitions(),
        fetchAllRegistrations()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('End date must be after start date');
      return;
    }

    try {
      if (editingExhibition) {
        // Update existing exhibition
        await ApiService.updateExhibition(editingExhibition.id, formData);
        setExhibitions(prev => prev.map(exhibition => 
          exhibition.id === editingExhibition.id ? { ...exhibition, ...formData } : exhibition
        ));
        setSuccess(`Exhibition "${formData.title}" updated successfully!`);
      } else {
        // Create new exhibition
        const newExhibition = await ApiService.createExhibition(formData);
        setExhibitions(prev => [...prev, newExhibition]);
        setSuccess(`Exhibition "${formData.title}" created successfully!`);
      }
      
      // Reset form
      setFormData({
        title: '',
        start_date: '',
        end_date: '',
        status: 'UPCOMING'
      });
      setShowForm(false);
      setEditingExhibition(null);
      setError('');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      console.error('Failed to save exhibition:', error);
      setError(`Failed to ${editingExhibition ? 'update' : 'create'} exhibition`);
    }
  };

  const handleEdit = (exhibition) => {
    setFormData({
      title: exhibition.title || '',
      start_date: exhibition.start_date || '',
      end_date: exhibition.end_date || '',
      status: exhibition.status || 'UPCOMING'
    });
    setEditingExhibition(exhibition);
    setShowForm(true);
    setSuccess('');
    setError('');
  };

  const handleDelete = async (exhibitionId, exhibitionTitle) => {
    if (window.confirm(`Are you sure you want to delete "${exhibitionTitle}"? This action cannot be undone.`)) {
      try {
        await ApiService.deleteExhibition(exhibitionId);
        setExhibitions(prev => prev.filter(exhibition => exhibition.id !== exhibitionId));
        setSuccess(`Exhibition "${exhibitionTitle}" deleted successfully!`);
        setError('');
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      } catch (error) {
        console.error('Failed to delete exhibition:', error);
        setError('Failed to delete exhibition. It may have associated registrations.');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      start_date: '',
      end_date: '',
      status: 'UPCOMING'
    });
    setShowForm(false);
    setEditingExhibition(null);
    setError('');
    setSuccess('');
  };

  const approveRegistration = async (registrationId) => {
    try {
      setActionLoading(true);
      setError('');
      
      // Use the correct endpoint - should match your Django URL pattern
      const response = await ApiService.request(`/registrations/${registrationId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'APPROVED',
          confirmed: true 
        })
      });
      
      // Update local state immediately for better UX
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
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
      
      // Refresh data on error to ensure consistency
      await fetchAllRegistrations();
    } finally {
      setActionLoading(false);
    }
  };

  const rejectRegistration = async (registrationId) => {
    const reason = prompt('Enter rejection reason (optional):') || '';
    
    try {
      setActionLoading(true);
      setError('');
      
      const response = await ApiService.request(`/registrations/${registrationId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'REJECTED',
          confirmed: false,
          rejection_reason: reason
        })
      });
      
      // Update local state immediately
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === registrationId 
            ? { 
                ...reg, 
                status: 'REJECTED', 
                confirmed: false,
                rejection_reason: reason 
              }
            : reg
        )
      );
      
      setSuccess('Registration rejected successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Failed to reject registration:', error);
      setError(`Failed to reject registration: ${error.message}`);
      
      // Refresh data on error
      await fetchAllRegistrations();
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '0.25rem 0.5rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: '600',
      textTransform: 'uppercase'
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

  const getRegistrationStatusBadge = (registration) => {
    const baseStyle = {
      padding: '0.25rem 0.5rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase'
    };

    // Prioritize the status field over confirmed field
    let actualStatus = registration.status;
    
    // Fallback for older data structure
    if (!actualStatus) {
      actualStatus = registration.confirmed ? 'APPROVED' : 'PENDING';
    }
    
    switch (actualStatus) {
      case 'PENDING':
        return { 
          ...baseStyle, 
          backgroundColor: '#fff3cd', 
          color: '#856404',
          text: `Pending (Pos: ${registration.queue_position || 'Unknown'})`
        };
      case 'APPROVED':
        return { 
          ...baseStyle, 
          backgroundColor: '#e8f5e8', 
          color: '#2e7d32',
          text: 'Approved'
        };
      case 'REJECTED':
        return { 
          ...baseStyle, 
          backgroundColor: '#ffebee', 
          color: '#d32f2f',
          text: 'Rejected'
        };
      case 'CANCELLED':
        return { 
          ...baseStyle, 
          backgroundColor: '#f5f5f5', 
          color: '#666',
          text: 'Cancelled'
        };
      default:
        return { 
          ...baseStyle, 
          backgroundColor: '#f5f5f5', 
          color: '#666',
          text: actualStatus || 'Unknown'
        };
    }
  };

  const getExhibitionRegistrations = (exhibitionId) => {
    console.log('Looking for registrations for exhibition ID:', exhibitionId);
    console.log('All registrations:', registrations);
    
    const filteredRegistrations = registrations.filter(reg => {
      // Handle different possible data structures
      const regExhibitionId = reg.exhibition?.id || reg.exhibition_id || reg.exhibition;
      console.log('Registration:', reg.id, 'Exhibition ID:', regExhibitionId, 'Target:', exhibitionId);
      
      return regExhibitionId === exhibitionId || regExhibitionId === String(exhibitionId);
    });
    
    console.log('Filtered registrations:', filteredRegistrations);
    return filteredRegistrations;
  };

  const getRegistrationStats = (exhibitionId) => {
    const exhibitionRegs = getExhibitionRegistrations(exhibitionId);
    return {
      total: exhibitionRegs.length,
      pending: exhibitionRegs.filter(r => r.status === 'PENDING' || (!r.status && !r.confirmed)).length,
      approved: exhibitionRegs.filter(r => r.status === 'APPROVED' || r.confirmed).length,
      rejected: exhibitionRegs.filter(r => r.status === 'REJECTED').length,
      cancelled: exhibitionRegs.filter(r => r.status === 'CANCELLED').length,
    };
  };

  // Allow both admin and clerk roles to access registration management
  if (!['admin', 'clerk'].includes(user?.role)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Admin or Clerk role required to access exhibition management.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Exhibition Management</h1>
        {user?.role === 'admin' && (
          <button 
            onClick={() => {
              setShowForm(true);
              setSuccess('');
              setError('');
            }}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Add New Exhibition
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #ffcdd2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button
            onClick={refreshAllData}
            style={{
              backgroundColor: '#c62828',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          style={{
            backgroundColor: "#e8f5e8",
            color: "#2e7d32",
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            border: "1px solid #c8e6c9",
          }}
        >
          ✅ {success}
        </div>
      )}

      {/* Add/Edit Form - Only for admins */}
      {showForm && user?.role === 'admin' && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>{editingExhibition ? 'Edit Exhibition' : 'Add New Exhibition'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Exhibition Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter exhibition title..."
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  {statusChoices.map(choice => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {editingExhibition ? 'Update Exhibition' : 'Create Exhibition'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exhibitions List */}
      {loading ? (
        <div>Loading exhibitions...</div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ padding: '1rem', margin: 0, backgroundColor: '#f5f5f5' }}>
            Exhibitions ({exhibitions.length})
          </h2>
          
          {exhibitions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No exhibitions found. Add your first exhibition to get started!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Title</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Dates</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Registrations</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exhibitions.map((exhibition) => {
                    const stats = getRegistrationStats(exhibition.id);
                    return (
                      <tr key={exhibition.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                          {exhibition.title}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.9rem' }}>
                            <div><strong>Start:</strong> {formatDate(exhibition.start_date)}</div>
                            <div><strong>End:</strong> {formatDate(exhibition.end_date)}</div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={getStatusBadgeStyle(exhibition.status)}>
                            {exhibition.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem' }}>
                            <div><strong>Total:</strong> {stats.total}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.25rem' }}>
                              {stats.pending > 0 && (
                                <span style={{ ...getRegistrationStatusBadge({ status: 'PENDING' }), fontSize: '0.7rem' }}>
                                  {stats.pending} Pending
                                </span>
                              )}
                              {stats.approved > 0 && (
                                <span style={{ ...getRegistrationStatusBadge({ status: 'APPROVED' }), fontSize: '0.7rem' }}>
                                  {stats.approved} Approved
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {user?.role === 'admin' && (
                                <>
                                  <button
                                    onClick={() => handleEdit(exhibition)}
                                    style={{
                                      backgroundColor: '#2196F3',
                                      color: 'white',
                                      border: 'none',
                                      padding: '0.5rem 1rem',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(exhibition.id, exhibition.title)}
                                    style={{
                                      backgroundColor: '#f44336',
                                      color: 'white',
                                      border: 'none',
                                      padding: '0.5rem 1rem',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                            {/* Both admin and clerk can manage registrations */}
                            {stats.total > 0 && ['admin', 'clerk'].includes(user?.role) && (
                              <button
                                onClick={() => setShowRegistrations(
                                  showRegistrations === exhibition.id ? null : exhibition.id
                                )}
                                style={{
                                  backgroundColor: '#ff9800',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  width: '100%'
                                }}
                              >
                                {showRegistrations === exhibition.id ? 'Hide' : 'Manage'} Registrations
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Registration Management Modal/Panel */}
      {showRegistrations && (
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
            borderRadius: '8px',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>
                Registration Management - {exhibitions.find(e => e.id === showRegistrations)?.title}
              </h3>
              <button
                onClick={() => setShowRegistrations(null)}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Visitor</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Attendees</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Queue Pos.</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Submitted</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getExhibitionRegistrations(showRegistrations)
                    .sort((a, b) => (a.queue_position || 999) - (b.queue_position || 999))
                    .map((registration) => {
                      const statusInfo = getRegistrationStatusBadge(registration);
                      
                      return (
                        <tr key={registration.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div>
                              <div style={{ fontWeight: '600' }}>
                                {registration.visitor_name || registration.visitor?.username || 'Unknown Visitor'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                {registration.visitor_email || registration.visitor?.email || 'No email'}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {registration.attendees_count || 1}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {registration.queue_position || '-'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <span style={statusInfo}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>
                            {formatDate(registration.submitted_at || registration.timestamp)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {registration.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                <button
                                  onClick={() => approveRegistration(registration.id)}
                                  disabled={actionLoading}
                                  style={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '4px',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    opacity: actionLoading ? 0.6 : 1
                                  }}
                                >
                                  {actionLoading ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => rejectRegistration(registration.id)}
                                  disabled={actionLoading}
                                  style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '4px',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    opacity: actionLoading ? 0.6 : 1
                                  }}
                                >
                                  {actionLoading ? 'Processing...' : 'Reject'}
                                </button>
                              </div>
                            )}
                            {registration.status === 'APPROVED' && (
                              <span style={{ color: '#4CAF50', fontWeight: '600' }}>✓ Approved</span>
                            )}
                            {registration.status === 'REJECTED' && (
                              <div>
                                <span style={{ color: '#f44336', fontWeight: '600' }}>✗ Rejected</span>
                                {registration.rejection_reason && (
                                  <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    Reason: {registration.rejection_reason}
                                  </div>
                                )}
                              </div>
                            )}
                            {registration.status === 'CANCELLED' && (
                              <span style={{ color: '#666', fontWeight: '600' }}>⊝ Cancelled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              
              {getExhibitionRegistrations(showRegistrations).length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  No registrations found for this exhibition.
                </div>
              )}
            </div>

            {/* Refresh button */}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                onClick={fetchAllRegistrations}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ↻ Refresh Registrations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExhibitionManagement;