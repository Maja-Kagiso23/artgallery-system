// api/apiService.js
const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
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
    localStorage.removeItem('user_data');
  }

  // Get default headers
  getHeaders(includeContentType = true) {
    const token = this.getAuthToken();
    const headers = {};
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Handle token refresh
  async refreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      this.removeAuthToken();
      window.location.href = '/login';
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setAuthToken(data.access);
      
      // Notify all subscribers
      this.refreshSubscribers.forEach(subscriber => subscriber());
      this.refreshSubscribers = [];
      
      return data.access;
    } catch (error) {
      this.removeAuthToken();
      window.location.href = '/login';
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Generic request method (FIXED)
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(!options.skipContentType);
    
    const config = {
      headers: { ...headers, ...options.headers },
      method: options.method || 'GET',
      ...options,
    };

    // Handle request body
    if (options.body && config.headers['Content-Type'] === 'application/json') {
      config.body = JSON.stringify(options.body);
    } else if (options.body) {
      config.body = options.body;
    }

    // Remove body for GET/HEAD requests
    if (['GET', 'HEAD'].includes(config.method) && config.body) {
      delete config.body;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401 && !url.includes('/auth/')) {
        const newToken = await this.refreshToken();
        if (newToken) {
          // Retry the original request with new token
          config.headers['Authorization'] = `Bearer ${newToken}`;
          return await fetch(url, config).then(res => this.handleResponse(res));
        }
      }

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Handle response
  async handleResponse(response) {
    if (response.status === 401) {
      // Token expired or invalid
      this.removeAuthToken();
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

	if (!response.ok) {
	  let errorData;
	  try {
		errorData = await response.json();
		console.error("❌ API Error Response:", errorData); // 👈 add this line
	  } catch {
		errorData = { detail: `HTTP error! status: ${response.status}` };
	  }
	  throw new Error(errorData.detail || errorData.message || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
	}


    // Handle empty responses (like DELETE, 204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Handle text responses (if any)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
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
      throw {
        status: response.status,
        message: data.detail || data.message || 'Invalid username or password'
      };
    }

    this.setAuthToken(data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    if (data.user) {
      localStorage.setItem('user_data', JSON.stringify(data.user));
    }
    
    return data;
  }

async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from Django
        if (response.status === 400) {
          // Extract field-specific errors
          const errorMessages = [];
          for (const [field, errors] of Object.entries(data)) {
            if (Array.isArray(errors)) {
              errorMessages.push(`${field}: ${errors.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${errors}`);
            }
          }
          throw new Error(errorMessages.join('; ') || 'Registration failed');
        }
        throw new Error(data.detail || data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await this.request('/auth/logout/', {
          method: 'POST',
          body: { refresh: refreshToken },
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    this.removeAuthToken();
  }

  // Extract results from paginated responses
  extractResults(data) {
    return data.results !== undefined ? data.results : data;
  }

  // Artists
  async getArtists() {
    const data = await this.request('/artists/');
    return this.extractResults(data);
  }

  async getArtist(id) {
    return this.request(`/artists/${id}/`);
  }

  async createArtist(artistData) {
    return this.request('/artists/', {
      method: 'POST',
      body: artistData,
    });
  }

  async updateArtist(id, artistData) {
    return this.request(`/artists/${id}/`, {
      method: 'PUT',
      body: artistData,
    });
  }

  async deleteArtist(id) {
    return this.request(`/artists/${id}/`, {
      method: 'DELETE',
    });
  }

  // Art Pieces
  async getArtPieces() {
    const data = await this.request('/artpieces/');
    return this.extractResults(data);
  }

  async getArtPiece(id) {
    return this.request(`/artpieces/${id}/`);
  }

  async createArtPiece(artPieceData) {
    return this.request('/artpieces/', {
      method: 'POST',
      body: artPieceData,
    });
  }

  async updateArtPiece(id, artPieceData) {
    return this.request(`/artpieces/${id}/`, {
      method: 'PUT',
      body: artPieceData,
    });
  }

  async deleteArtPiece(id) {
    return this.request(`/artpieces/${id}/`, {
      method: 'DELETE',
    });
  }

  // Exhibitions
  async getExhibitions() {
    const data = await this.request('/exhibitions/');
    return this.extractResults(data);
  }

  async getExhibition(id) {
    return this.request(`/exhibitions/${id}/`);
  }

  async createExhibition(exhibitionData) {
    return this.request('/exhibitions/', {
      method: 'POST',
      body: exhibitionData,
    });
  }

  async updateExhibition(id, exhibitionData) {
    return this.request(`/exhibitions/${id}/`, {
      method: 'PUT',
      body: exhibitionData,
    });
  }

  async deleteExhibition(id) {
    return this.request(`/exhibitions/${id}/`, {
      method: 'DELETE',
    });
  }

  // Visitors
  async getVisitors() {
    const data = await this.request('/visitors/');
    return this.extractResults(data);
  }

  async createVisitor(visitorData) {
    return this.request('/visitors/', {
      method: 'POST',
      body: visitorData,
    });
  }

  // Registrations
  async getRegistrations() {
    const data = await this.request('/registrations/');
    return this.extractResults(data);
  }

  async registerForExhibition(registrationData) {
    return this.request('/registrations/', {
      method: 'POST',
      body: registrationData,
    });
  }

  async updateRegistration(id, registrationData) {
    return this.request(`/registrations/${id}/`, {
      method: 'PUT',
      body: registrationData,
    });
  }

  // Clerks (Admin only)
  async getClerks() {
    const data = await this.request('/clerks/');
    return this.extractResults(data);
  }

  async createClerk(clerkData) {
    return this.request('/clerks/', {
      method: 'POST',
      body: clerkData,
    });
  }

  // Setup Status (Clerk/Admin only)
  async getSetupStatuses() {
    const data = await this.request('/setupstatuses/');
    return this.extractResults(data);
  }

  async updateSetupStatus(id, statusData) {
    return this.request(`/setupstatuses/${id}/`, {
      method: 'PUT',
      body: statusData,
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