// api/apiService.js
const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('access_token', token);
  }

  // Remove auth token
  removeAuthToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Get default headers
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Generic request method (FIXED)
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    // Handle request body
    if (options.body && config.headers['Content-Type'] === 'application/json') {
      config.body = options.body;
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        this.removeAuthToken();
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses (like DELETE)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(credentials) {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      // Pass back status and message for UI handling
      throw {
        status: response.status,
        message: data.detail || 'Invalid username or password'
      };
    }

    this.setAuthToken(data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    return data;
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    return await response.json();
  }

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await fetch(`${this.baseURL}/auth/logout/`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    this.removeAuthToken();
  }

  // Artists (FIXED - handle pagination)
  async getArtists() {
    const data = await this.request('/artists/');
    return data.results || data; // Extract from pagination or return as-is
  }

  async getArtist(id) {
    return this.request(`/artists/${id}/`);
  }

  async createArtist(artistData) {
    return this.request('/artists/', {
      method: 'POST',
      body: JSON.stringify(artistData),
    });
  }

  async updateArtist(id, artistData) {
    return this.request(`/artists/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(artistData),
    });
  }

  async deleteArtist(id) {
    return this.request(`/artists/${id}/`, {
      method: 'DELETE',
    });
  }

  // Art Pieces (FIXED - handle pagination)
  async getArtPieces() {
    const data = await this.request('/artpieces/');
    return data.results || data;
  }

  async getArtPiece(id) {
    return this.request(`/artpieces/${id}/`);
  }

  async createArtPiece(artPieceData) {
    return this.request('/artpieces/', {
      method: 'POST',
      body: JSON.stringify(artPieceData),
    });
  }

  async updateArtPiece(id, artPieceData) {
    return this.request(`/artpieces/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(artPieceData),
    });
  }

  async deleteArtPiece(id) {
    return this.request(`/artpieces/${id}/`, {
      method: 'DELETE',
    });
  }

  // Exhibitions (FIXED - handle pagination)
  async getExhibitions() {
    const data = await this.request('/exhibitions/');
    return data.results || data;
  }

  async getExhibition(id) {
    return this.request(`/exhibitions/${id}/`);
  }

  async createExhibition(exhibitionData) {
    return this.request('/exhibitions/', {
      method: 'POST',
      body: JSON.stringify(exhibitionData),
    });
  }

  async updateExhibition(id, exhibitionData) {
    return this.request(`/exhibitions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(exhibitionData),
    });
  }

  async deleteExhibition(id) {
    return this.request(`/exhibitions/${id}/`, {
      method: 'DELETE',
    });
  }

  // Visitors (FIXED - handle pagination)
  async getVisitors() {
    const data = await this.request('/visitors/');
    return data.results || data;
  }

  async createVisitor(visitorData) {
    return this.request('/visitors/', {
      method: 'POST',
      body: JSON.stringify(visitorData),
    });
  }

  // Registrations (FIXED - handle pagination)
  async getRegistrations() {
    const data = await this.request('/registrations/');
    return data.results || data;
  }

  async registerForExhibition(registrationData) {
    return this.request('/registrations/', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  async updateRegistration(id, registrationData) {
    return this.request(`/registrations/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(registrationData),
    });
  }

  // Clerks (Admin only) (FIXED - handle pagination)
  async getClerks() {
    const data = await this.request('/clerks/');
    return data.results || data;
  }

  async createClerk(clerkData) {
    return this.request('/clerks/', {
      method: 'POST',
      body: JSON.stringify(clerkData),
    });
  }

  // Setup Status (Clerk/Admin only) (FIXED - handle pagination)
  async getSetupStatuses() {
    const data = await this.request('/setupstatuses/');
    return data.results || data;
  }

  async updateSetupStatus(id, statusData) {
    return this.request(`/setupstatuses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  // User management
  getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated() {
    return !!this.getAuthToken();
  }

  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  hasPermission(requiredRole) {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    const roleHierarchy = {
      visitor: 1,
      clerk: 2,
      admin: 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}

export default new ApiService();