// Import the api instance to make HTTP requests
import api from './api';

// Login function: makes a POST request to the /login endpoint with the provided credentials
export const adminLogin = async (credentials) => {
  // Send a POST request with the user's login credentials
  const response = await api.post('/admin/login', credentials);
  // Return the data from the response (usually includes authentication token or user info)
  return response.data;
};
// Get the current authenticated user: retrieves the stored 'authToken' from localStorage
// services/auth.js (or wherever getCurrentUser is defined)
export const getCurrentAdmin = () => {
    try {
        const adminJson = sessionStorage.getItem('admin');
        if (!adminJson) {
            return null; // Or return an empty object: {}
        }
        return JSON.parse(adminJson);
    } catch (error) {
        console.error("Error retrieving admin from sessionStorage:", error);
        return null;
    }
};

// Logout function: removes the 'authToken' from localStorage to log out the user
export const adminLogout = async () => {
  try {
    await api.post('/admin/logout');
  } catch (err) {
    console.error('Logout failed:', err);
  }
  sessionStorage.removeItem('authToken'); // Clear token
  sessionStorage.removeItem('admin'); // Clear admin data
  window.location.href = "/login"; // Force redirect
};


export const isAdmin = ()=> {
  const admin = getCurrentAdmin();
  return admin && admin.role === 'admin';
}
