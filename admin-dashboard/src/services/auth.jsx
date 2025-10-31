// services/auth.js
import api from './api';

// Admin Login function
export const adminLogin = async (credentials) => {
  try {
    const response = await api.post('/admin/login', credentials);
    
    // Store only admin info in sessionStorage
    if (response.data.admin) {
      sessionStorage.setItem('admin', JSON.stringify(response.data.admin));
    }
    
    return response.data;
  } catch (error) {
    // More specific error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    } else if (error.response?.status === 422) {
      throw new Error('Validation error. Please check your input.');
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};

// Get the current authenticated admin
export const getCurrentAdmin = () => {
  try {
    const adminJson = sessionStorage.getItem('admin');
    if (!adminJson) {
      return null;
    }
    return JSON.parse(adminJson);
  } catch (error) {
    console.log(error)
    return null;
  }
};

// Verify if admin is authenticated by checking with backend
export const verifyAdminAuthentication = async () => {
  try {
    const response = await api.get('/admin/me');
    
    // Update sessionStorage with fresh admin data
    if (response.data.admin) {
      sessionStorage.setItem('admin', JSON.stringify(response.data.admin));
    }
    return response.data.admin;
  } catch (error) {
    // Clear invalid admin data
    console.log(error)
    sessionStorage.removeItem('admin');
    return null;
  }
};

// Admin Logout function
export const adminLogout = async () => {
  try {
    await api.post('/admin/logout');
  } catch (err) {
    // Silent fail - still clear local storage
    console.log(err)
  } finally {
    // Clear frontend storage
    sessionStorage.removeItem('admin');
    // Force redirect to login
    window.location.href = "/login";
  }
};

// Check if admin is logged in
export const isAdmin = () => {
  const admin = getCurrentAdmin();
  return admin && admin.role === 'admin';
};

// Check if admin is authenticated (frontend basic check)
export const isAdminLoggedIn = () => {
  return !!getCurrentAdmin();
};