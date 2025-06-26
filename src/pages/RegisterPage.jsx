
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    studentId: '',
    staffId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const departments = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Business Administration',
    'Economics',
    'Psychology',
    'English',
    'History',
    'Geography'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (formData.role === 'student' && !formData.studentId) {
      newErrors.studentId = 'Student ID is required';
    }
    
    if ((formData.role === 'lecturer' || formData.role === 'manager' || formData.role === 'admin') && !formData.staffId) {
      newErrors.staffId = 'Staff ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="dashboard-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
              <p className="text-white/70">Join ClassEase and start booking venues today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`form-input w-full pl-12 pr-4 py-3 rounded-lg ${errors.name ? 'error-shake border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input w-full pl-12 pr-4 py-3 rounded-lg ${errors.email ? 'error-shake border-red-500' : ''}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-input w-full pl-12 pr-12 py-3 rounded-lg ${errors.password ? 'error-shake border-red-500' : ''}`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`form-input w-full pl-12 pr-12 py-3 rounded-lg ${errors.confirmPassword ? 'error-shake border-red-500' : ''}`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-input w-full px-4 py-3 rounded-lg"
                  >
                    <option value="student" style={{ backgroundColor: '#1A202C' }}>Student</option>
                    <option value="lecturer" style={{ backgroundColor: '#1A202C' }}>Lecturer</option>
                    <option value="manager" style={{ backgroundColor: '#1A202C' }}>Manager</option>
                    <option value="admin" style={{ backgroundColor: '#1A202C' }}>Administrator</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`form-input w-full pl-12 pr-4 py-3 rounded-lg ${errors.department ? 'error-shake border-red-500' : ''}`}
                    >
                      <option style={{ backgroundColor: '#1A202C' }} value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} style={{ backgroundColor: '#1A202C' }} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  {errors.department && (
                    <p className="text-red-400 text-sm mt-1">{errors.department}</p>
                  )}
                </div>

                {/* Student ID or Staff ID */}
                {formData.role === 'student' ? (
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      className={`form-input w-full px-4 py-3 rounded-lg ${errors.studentId ? 'error-shake border-red-500' : ''}`}
                      placeholder="Enter your student ID"
                    />
                    {errors.studentId && (
                      <p className="text-red-400 text-sm mt-1">{errors.studentId}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Staff ID
                    </label>
                    <input
                      type="text"
                      name="staffId"
                      value={formData.staffId}
                      onChange={handleChange}
                      className={`form-input w-full px-4 py-3 rounded-lg ${errors.staffId ? 'error-shake border-red-500' : ''}`}
                      placeholder="Enter your staff ID"
                    />
                    {errors.staffId && (
                      <p className="text-red-400 text-sm mt-1">{errors.staffId}</p>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/70">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
