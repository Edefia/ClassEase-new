
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Shield, Zap, Menu, X } from 'lucide-react';
import { FaCalendarCheck, FaBuilding, FaBookOpen, FaUsers, FaUniversity } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';

const features = [
  { icon: Calendar, title: 'Instant Booking', description: 'Book venues in seconds with real-time availability.' },
  { icon: MapPin, title: 'Campus Map', description: 'Find and explore all venues on an interactive map.' },
  { icon: Users, title: 'Role Dashboards', description: 'Personalized dashboards for students, staff, and admins.' },
  { icon: Clock, title: 'Live Notifications', description: 'Get notified instantly about bookings and updates.' },
  { icon: Shield, title: 'Secure', description: 'Enterprise-grade security and privacy.' },
  { icon: Zap, title: 'Lightning Fast', description: 'Modern UI with smooth, responsive performance.' }
];

const LandingPage = () => {
  const [stats, setStats] = React.useState(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const res = await API.get('/stats');
        setStats(res.data);
      } catch (err) {
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#181c2a] to-[#10121a] text-white flex flex-col">
      {/* Navigation */}
      <nav className="w-full z-50 px-6 md:px-20 py-4 flex items-center justify-between glass-effect fixed top-0 left-0">
        <div className="flex items-center gap-2">
          <FaCalendarCheck className="w-6 h-6 text-blue-400 drop-shadow" />
          <span className="text-2xl font-serif tracking-wider items-center text-slate-200 drop-shadow-lg">ClassEase</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" className="text-white/80 hover:bg-white/10 px-5">Login</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-5 font-semibold shadow-lg">Get Started</Button>
          </Link>
        </div>
        {/* Hamburger for mobile */}
        <button
          className="md:hidden p-2 rounded text-white/80 hover:bg-white/10 focus:outline-none"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-7 h-7" />
        </button>
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FaCalendarCheck className="w-8 h-8 text-blue-400 drop-shadow" />
                  <span className="text-2xl font-serif tracking-wider items-center text-slate-200 drop-shadow-lg">ClassEase</span>
                </div>
                <button
                  className="p-2 rounded text-white/80 hover:bg-white/10 focus:outline-none"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
              <div className="flex flex-col gap-4 px-6 py-10 text-lg bg-slate-900">
                <button
                  className="flex items-center gap-3 w-full text-white/90 justify-start text-lg py-3 hover:bg-white/10 rounded transition"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <FaCalendarCheck className="w-5 h-5 text-blue-400" /> Home
                </button>
                <button
                  className="flex items-center gap-3 w-full text-white/90 justify-start text-lg py-3 hover:bg-white/10 rounded transition"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <FaBookOpen className="w-5 h-5 text-purple-400" /> Features
                </button>
                <button
                  className="flex items-center gap-3 w-full text-white/90 justify-start text-lg py-3 hover:bg-white/10 rounded transition"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <FaUniversity className="w-5 h-5 text-pink-400" /> Contact
                </button>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full flex items-center gap-3 text-white/90 justify-start text-lg py-3">
                    <FaUsers className="w-5 h-5 text-green-400" /> Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white text-lg py-3 font-semibold">
                    <FaBookOpen className="w-5 h-5 text-purple-200" /> Get Started
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center min-h-screen pt-24 pb-12 px-4">
        {/* Decorative Blobs */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-gradient-to-br from-blue-600/30 to-purple-700/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-gradient-to-tr from-purple-700/30 to-blue-600/10 rounded-full blur-2xl animate-pulse-slow" />
        </div>
        <div className="relative z-10 w-full max-w-3xl mx-auto text-center flex flex-col items-center justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-xl"
          >
            Effortless <span className="gradient-text">Venue Booking</span>
            <span className="block text-2xl md:text-3xl font-medium text-white/70 mt-4">for University of Cape Coast Campus</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto font-medium"
          >
            Discover, book, and manage campus venues in seconds. Real-time availability, instant notifications, and a beautiful, intuitive interface for everyone.
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-700 text-lg px-8 py-4 font-semibold shadow-xl border-2 border-white/10">
                Start Booking
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white/20 text-white/90 hover:bg-white/10 text-lg px-8 py-4">
                Sign In
              </Button>
            </Link>
          </div>
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="w-36 h-24 bg-white/10 rounded-2xl animate-pulse" />
              ))
            ) : stats ? (
              [
                { number: stats.venues, label: 'Venues', icon: <FaBuilding className="w-6 h-6 text-blue-400" /> },
                { number: stats.bookings, label: 'Bookings', icon: <FaBookOpen className="w-6 h-6 text-purple-400" /> },
                { number: stats.users, label: 'Users', icon: <FaUsers className="w-6 h-6 text-green-400" /> },
                { number: stats.buildings, label: 'Buildings', icon: <FaUniversity className="w-6 h-6 text-pink-400" /> }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, delay: index * 0.12, type: 'spring' }}
                  className="w-36 h-24 bg-white/10 rounded-2xl flex flex-col items-center justify-center shadow-xl border border-white/20 relative overflow-hidden"
                  style={{
                    boxShadow: '0 4px 32px 0 rgba(80, 80, 255, 0.08)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                    background: 'linear-gradient(120deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 100%)',
                    zIndex: 0
                  }} />
                  <div className="relative z-10 flex items-center gap-2 mb-1">
                    {stat.icon}
                    <span className="text-2xl font-extrabold text-white drop-shadow">{stat.number}</span>
                  </div>
                  <div className="relative z-10 text-white/80 text-sm font-semibold tracking-wide">{stat.label}</div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-full blur-2xl opacity-60" />
                </motion.div>
              ))
            ) : null}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold text-white mb-10 text-center"
          >
            Why ClassEase?
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col items-center text-center shadow-lg hover:scale-[1.03] transition-transform duration-300"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-700 mb-5 shadow-lg">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-base leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-blue-700/60 to-purple-800/60 rounded-2xl p-12 text-center shadow-2xl border border-white/10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of users who have already transformed their venue booking experience with ClassEase.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-700 text-lg px-8 py-4 font-semibold shadow-xl border-2 border-white/10"
                >
                  Create Account
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/20 text-white/90 hover:bg-white/10 text-lg px-8 py-4"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/10 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-bold gradient-text">ClassEase</div>
          <div className="text-white/60 text-sm">© 2025 ClassEase. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
