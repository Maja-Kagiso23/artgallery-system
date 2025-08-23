import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import ApiService from '../api/apiService';

const ExhibitionManagement = () => {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState([]);
  const [artPieces, setArtPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState(null);
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

  // Fetch exhibitions and art pieces on component mount
  useEffect(() => {
    fetchExhibitions();
    fetchArtPieces();
  }, []);

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
      // Don't set error here as it's not critical for the main functionality
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

  if (user?.role !== 'admin') {
    return <div style={{ padding: '2rem' }}>Access denied. Admin role required.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Exhibition Management</h1>
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
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #ffcdd2'
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
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #c8e6c9'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
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
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Start Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>End Date</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exhibitions.map((exhibition) => (
                    <tr key={exhibition.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{exhibition.title}</td>
                      <td style={{ padding: '1rem' }}>{formatDate(exhibition.start_date)}</td>
                      <td style={{ padding: '1rem' }}>{formatDate(exhibition.end_date)}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={getStatusBadgeStyle(exhibition.status)}>
                          {exhibition.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(exhibition)}
                          style={{
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '0.5rem',
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExhibitionManagement;