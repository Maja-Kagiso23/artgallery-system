import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import ApiService from '../api/apiService';

const ArtPieceManagement = () => {
  const { user } = useAuth();
  const [artPieces, setArtPieces] = useState([]);
  const [artists, setArtists] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArtPiece, setEditingArtPiece] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedArtPiece, setSelectedArtPiece] = useState(null);
  const [selectedExhibition, setSelectedExhibition] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    artist: '',
    estimated_value: '',
    status: 'AVAILABLE'
  });

  const statusChoices = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'DISPLAYED', label: 'Displayed' },
    { value: 'UNAVAILABLE', label: 'Unavailable' }
  ];

  // Fetch art pieces, artists, and exhibitions on component mount
  useEffect(() => {
    fetchArtPieces();
    fetchArtists();
    fetchExhibitions();
  }, []);

  const fetchArtPieces = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getArtPieces();
      
      // Extract art pieces from DRF paginated response
      const artPiecesData = response.results || response;
      
      // Ensure it's always an array
      if (!Array.isArray(artPiecesData)) {
        console.warn('Expected array but got:', artPiecesData);
        setArtPieces([]);
      } else {
        setArtPieces(artPiecesData);
      }
      setError('');
    } catch (error) {
      console.error('Failed to fetch art pieces:', error);
      setError('Failed to load art pieces');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await ApiService.getArtists();
      const artistsData = response.results || response;
      
      if (!Array.isArray(artistsData)) {
        console.warn('Expected array but got:', artistsData);
        setArtists([]);
      } else {
        setArtists(artistsData);
      }
    } catch (error) {
      console.error('Failed to fetch artists:', error);
      setError('Failed to load artists. Please ensure artists exist before adding art pieces.');
    }
  };

  const fetchExhibitions = async () => {
    try {
      const response = await ApiService.getExhibitions();
      const exhibitionsData = response.results || response;
      
      if (!Array.isArray(exhibitionsData)) {
        console.warn('Expected array but got:', exhibitionsData);
        setExhibitions([]);
      } else {
        setExhibitions(exhibitionsData);
      }
    } catch (error) {
      console.error('Failed to fetch exhibitions:', error);
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
    
    // Validate required fields
    if (!formData.artist) {
      setError('Please select an artist');
      return;
    }

    if (!formData.estimated_value || parseFloat(formData.estimated_value) <= 0) {
      setError('Please enter a valid estimated value');
      return;
    }

    try {
      const submitData = {
        ...formData,
        estimated_value: parseFloat(formData.estimated_value)
      };

      if (editingArtPiece) {
        // Update existing art piece
        await ApiService.updateArtPiece(editingArtPiece.id, submitData);
        setArtPieces(prev => prev.map(artPiece => 
          artPiece.id === editingArtPiece.id ? { ...artPiece, ...submitData } : artPiece
        ));
        setSuccess(`Art piece "${formData.title}" updated successfully!`);
      } else {
        // Create new art piece
        const newArtPiece = await ApiService.createArtPiece(submitData);
        setArtPieces(prev => [...prev, newArtPiece]);
        setSuccess(`Art piece "${formData.title}" created successfully!`);
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        artist: '',
        estimated_value: '',
        status: 'AVAILABLE'
      });
      setShowForm(false);
      setEditingArtPiece(null);
      setError('');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      console.error('Failed to save art piece:', error);
      setError(`Failed to ${editingArtPiece ? 'update' : 'create'} art piece`);
    }
  };

  const handleEdit = (artPiece) => {
    setFormData({
      title: artPiece.title || '',
      description: artPiece.description || '',
      artist: artPiece.artist?.id || artPiece.artist || '',
      estimated_value: artPiece.estimated_value?.toString() || '',
      status: artPiece.status || 'AVAILABLE'
    });
    setEditingArtPiece(artPiece);
    setShowForm(true);
    setSuccess('');
    setError('');
  };

  const handleDelete = async (artPieceId, artPieceTitle) => {
    if (window.confirm(`Are you sure you want to delete "${artPieceTitle}"? This action cannot be undone.`)) {
      try {
        await ApiService.deleteArtPiece(artPieceId);
        setArtPieces(prev => prev.filter(artPiece => artPiece.id !== artPieceId));
        setSuccess(`Art piece "${artPieceTitle}" deleted successfully!`);
        setError('');
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      } catch (error) {
        console.error('Failed to delete art piece:', error);
        setError('Failed to delete art piece. It may be part of exhibitions.');
      }
    }
  };

  const handleAssignToExhibition = (artPiece) => {
    setSelectedArtPiece(artPiece);
    setSelectedExhibition('');
    setShowAssignmentModal(true);
    setError('');
  };

// In the handleAssignmentSubmit function:
const handleAssignmentSubmit = async () => {
  if (!selectedArtPiece || !selectedExhibition) {
    setError('Please select an exhibition');
    return;
  }

  setAssignmentLoading(true);
  try {
    // Use the correct endpoint - make sure it matches exactly what's in urls.py
    await ApiService.request('/exhibition-artpieces/', {
      method: 'POST',
      body: {
        exhibition: parseInt(selectedExhibition),
        art_piece: selectedArtPiece.id,
        confirmed: false
      }
    });
    
    setSuccess(`"${selectedArtPiece.title}" assigned to exhibition successfully!`);
    setShowAssignmentModal(false);
    setSelectedArtPiece(null);
    setSelectedExhibition('');
    
    setTimeout(() => setSuccess(''), 5000);
  } catch (error) {
    console.error('Failed to assign art piece:', error);
    setError('Failed to assign art piece to exhibition. It may already be assigned.');
  } finally {
    setAssignmentLoading(false);
  }
};

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      artist: '',
      estimated_value: '',
      status: 'AVAILABLE'
    });
    setShowForm(false);
    setEditingArtPiece(null);
    setError('');
    setSuccess('');
  };

  const handleAssignmentCancel = () => {
    setShowAssignmentModal(false);
    setSelectedArtPiece(null);
    setSelectedExhibition('');
    setError('');
  };

  const getArtistName = (artist) => {
    if (typeof artist === 'object' && artist?.name) {
      return artist.name;
    }
    const foundArtist = artists.find(a => a.id === artist);
    return foundArtist?.name || 'Unknown Artist';
  };

  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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
      case 'AVAILABLE':
        return { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case 'DISPLAYED':
        return { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1976d2' };
      case 'UNAVAILABLE':
        return { ...baseStyle, backgroundColor: '#ffebee', color: '#c62828' };
      default:
        return { ...baseStyle, backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  if (user?.role !== 'admin') {
    return <div style={{ padding: '2rem' }}>Access denied. Admin role required.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Art Piece Management</h1>
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
          Add New Art Piece
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
          <h2>{editingArtPiece ? 'Edit Art Piece' : 'Add New Art Piece'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Title *
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
                  placeholder="Enter art piece title..."
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Artist *
                </label>
                <select
                  name="artist"
                  value={formData.artist}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select an artist...</option>
                  {artists.map(artist => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Estimated Value * ($)
                </label>
                <input
                  type="number"
                  name="estimated_value"
                  value={formData.estimated_value}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="0.00"
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                placeholder="Describe the art piece, its style, medium, etc..."
              />
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
                {editingArtPiece ? 'Update Art Piece' : 'Create Art Piece'}
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

      {/* Art Pieces List */}
      {loading ? (
        <div>Loading art pieces...</div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ padding: '1rem', margin: 0, backgroundColor: '#f5f5f5' }}>
            Art Pieces ({artPieces.length})
          </h2>
          
          {artPieces.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No art pieces found. Add your first art piece to get started!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Title</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Artist</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Est. Value</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {artPieces.map((artPiece) => (
                    <tr key={artPiece.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{artPiece.title}</td>
                      <td style={{ padding: '1rem' }}>{getArtistName(artPiece.artist)}</td>
                      <td style={{ padding: '1rem', maxWidth: '200px' }}>
                        <div style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          maxWidth: '200px'
                        }}>
                          {artPiece.description || 'No description'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                        {formatCurrency(artPiece.estimated_value)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={getStatusBadgeStyle(artPiece.status)}>
                          {artPiece.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(artPiece)}
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
                          onClick={() => handleAssignToExhibition(artPiece)}
                          style={{
                            backgroundColor: '#ff9800',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '0.5rem',
                            fontSize: '0.9rem'
                          }}
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleDelete(artPiece.id, artPiece.title)}
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

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h2>Assign Art Piece to Exhibition</h2>
            <p>Assign "<strong>{selectedArtPiece?.title}</strong>" to an exhibition:</p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Select Exhibition *
              </label>
              <select
                value={selectedExhibition}
                onChange={(e) => setSelectedExhibition(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select an exhibition...</option>
                {exhibitions.map(exhibition => (
                  <option key={exhibition.id} value={exhibition.id}>
                    {exhibition.title} ({exhibition.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleAssignmentCancel}
                style={{
                  backgroundColor: '#9e9e9e',
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
              <button
                onClick={handleAssignmentSubmit}
                disabled={assignmentLoading || !selectedExhibition}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: assignmentLoading || !selectedExhibition ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: assignmentLoading || !selectedExhibition ? 0.7 : 1
                }}
              >
                {assignmentLoading ? 'Assigning...' : 'Assign to Exhibition'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtPieceManagement;