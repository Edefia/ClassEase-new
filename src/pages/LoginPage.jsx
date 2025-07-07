
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Route based on user role
      const { role } = result.user;
      switch (role) {
        case 'student':
          navigate('/dashboard/student');
          break;
        case 'lecturer':
          navigate('/dashboard/lecturer');
          break;
        case 'manager':
          navigate('/dashboard/manager');
          break;
        case 'admin':
          navigate('/dashboard/admin');
          break;
        default:
          navigate('/dashboard/student '); // fallback
      }
    }
  };

  const demoAccounts = [
    { email: 'hebradalton@gmail.com', role: 'Student', password: '12345hdA' },
    { email: 'felixboabeng@gmail.com', role: 'Lecturer', password: '12345hdA' },
    { email: 'dieudonneladzekpo@gmail.com', role: 'Admin', password: '12345hdA' },
    { email: 'mcdaltonhebra@gmail.com', role: 'Manager', password: '12345hdA' }
  ];

  const fillDemoAccount = (email) => {
    setFormData({
      email,
      password: '12345hdA'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="dashboard-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-white/70">Sign in to your ClassEase account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="Enter your password"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/70">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Demo Accounts & Image */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          {/* Demo Accounts */}
          <div className="dashboard-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Demo Accounts</h3>
            <p className="text-white/70 text-sm mb-4">
              Try ClassEase with these demo accounts:
            </p>
            <div className="space-y-3">
              {demoAccounts.map((account, index) => (
                <motion.button
                  key={index}
                  onClick={() => fillDemoAccount(account.email)}
                  className="w-full p-3 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{account.role}</div>
                      <div className="text-white/60 text-sm">{account.email}</div>
                    </div>
                    <div className="text-white/40 text-xs">Click to fill</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Feature Image */}
          <div className="dashboard-card p-6">
            <img  
              className="w-full rounded-lg"
              alt="Students using digital booking system in university"
             src="https://images.unsplash.com/photo-1592303637753-ce1e6b8a0ffb" />
            <div className="mt-4 text-center">
              <h4 className="text-lg font-semibold text-white mb-2">
                Digital Transformation
              </h4>
              <p className="text-white/70 text-sm">
                Experience the future of venue booking with ClassEase's intuitive interface.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
