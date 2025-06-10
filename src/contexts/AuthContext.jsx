import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

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
    // TODO: Replace with your own authentication logic.
    // For now, we'll simulate a logged-in user.
    const mockUser = {
      id: 'mock-user-id',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'student',
      departmentName: 'Computer Science',
      student_id: '12345',
      staff_id: null,
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    // TODO: Implement your own login logic here.
    // This is a placeholder.
    console.log('Login attempt with:', email, password);
    const mockUser = {
        id: 'mock-user-id',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'student',
        departmentName: 'Computer Science',
        student_id: '12345',
        staff_id: null,
      };
    setUser(mockUser);
    setIsAuthenticated(true);
    toast({
      title: "Login Successful",
      description: `Welcome back!`,
    });
    setIsLoading(false);
    return { success: true, user: mockUser };
  };

  const register = async (userData) => {
    setIsLoading(true);
    // TODO: Implement your own registration logic here.
    // This is a placeholder.
    console.log('Register attempt with:', userData);
    toast({
      title: "Registration Successful",
      description: "This is a demo. No account was created.",
    });
    setIsLoading(false);
    // For demo purposes, we can log the user in directly after "registering"
    const mockUser = {
        id: 'mock-user-id-new',
        name: userData.name,
        email: userData.email,
        role: userData.role,
        departmentName: userData.department,
        student_id: userData.studentId,
        staff_id: userData.staffId,
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    return { success: true, user: mockUser };
  };

  const logout = async () => {
    setIsLoading(true);
    // TODO: Implement your own logout logic here.
    setUser(null);
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setIsLoading(false);
  };

  const updateProfile = async (updatedData) => {
    // TODO: Implement your own profile update logic here.
    console.log('Update profile with:', updatedData);
    setUser(prevUser => ({ ...prevUser, ...updatedData }));
    toast({
        title: "Profile Updated",
        description: "Your profile has been updated locally.",
    });
    return { success: true };
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    // session is no longer available, so we can provide null or remove it
    session: null, 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};