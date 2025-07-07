import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import API from '@/lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await API.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      // Store user data and token
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      setUser(userData);
      setIsAuthenticated(true);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.name}!`,
      });
      return { success: true, user: userData };
    } catch (err) {
      toast({
        title: "Login Failed",
        description: err.response?.data?.message || err.message,
      });
      return { success: false, error: err.response?.data?.message || err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await API.post('/auth/register', userData);
      const { user: newUser, token } = response.data;
      
      // Store user data and token
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', token);
      
      setUser(newUser);
      setIsAuthenticated(true);
      toast({
        title: "Registration Successful",
        description: "Your account has been created.",
      });
      return { success: true, user: newUser };
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: err.response?.data?.error || err.message,
      });
      return { success: false, error: err.response?.data?.error || err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await API.put('/auth/profile', updatedData);
      const updatedUser = response.data.user;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      return { success: true };
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || err.message,
      });
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};