import { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin, studentLogin } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      const response = await adminLogin(email, password);
      const { token, admin } = response.data;
      
      // Verify token and admin data exist
      if (!token || !admin) {
        toast.error('Login failed: Invalid response from server');
        return { success: false, error: 'Invalid response from server' };
      }
      
      // Store token and user data
      localStorage.setItem('token', token);
      const userData = { ...admin, role: 'admin' };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      console.error('Admin login error:', error);
      return { success: false, error: message };
    }
  };

  const loginStudent = async (registerNo, password) => {
    try {
      const response = await studentLogin(registerNo, password);
      const { token, student } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...student, role: 'student' }));
      setUser({ ...student, role: 'student' });
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAdmin, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

