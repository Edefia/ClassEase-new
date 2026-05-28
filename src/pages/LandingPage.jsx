import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar, MapPin, Users, Clock, Shield, Zap, Menu, X,
  GraduationCap, BookOpen, Building, CheckCircle, ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { statsService } from '@/lib/api';

const features = [
  {
    icon: Calendar,
    title: 'Smart Booking',
    description: 'Reserve lecture halls, labs, and auditoriums with real-time availability and conflict detection.',
  },
  {
    icon: Clock,
    title: 'Academic Scheduling',
    description: 'Generate lecture timetables and exam schedules with automatic venue allocation.',
  },
  {
    icon: MapPin,
    title: 'Venue Discovery',
    description: 'Find the perfect venue with smart suggestions based on capacity, equipment, and availability.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Personalized dashboards for students, lecturers, coordinators, managers, and administrators.',
  },
  {
    icon: Shield,
    title: 'Clash Detection',
    description: 'Automatic detection of scheduling conflicts across venues, lecturers, and student groups.',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description: 'Instant notifications for booking approvals, schedule changes, and maintenance alerts.',
  },
];

const LandingPage = () => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const res = await statsService.getAll();
        setStats(res.data);
      } catch {
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ===== NAVIGATION ===== */}
      <nav className="w-full z-50 px-6 md:px-12 lg:px-20 py-4 flex items-center justify-between bg-white border-b border-gray-100 fixed top-0 left-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-ucc-crimson rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-heading font-bold text-ucc-navy tracking-tight">ClassEase</span>
            <span className="hidden sm:block text-[10px] text-gray-400 font-medium -mt-0.5">University of Cape Coast</span>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-ucc-navy transition-colors">Features</a>
          <a href="#about" className="text-sm font-medium text-gray-600 hover:text-ucc-navy transition-colors">About</a>
          <div className="w-px h-5 bg-gray-200 mx-2" />
          <Link to="/login">
            <Button variant="ghost" className="text-ucc-navy hover:bg-gray-100 hover:text-ucc-navy font-medium">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button className="bg-ucc-crimson hover:text-ucc-navy text-white font-semibold px-5">
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-0 z-50 bg-white flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-ucc-crimson rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-heading font-bold text-ucc-navy">ClassEase</span>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-1 px-6 py-6">
                <button
                  className="flex items-center gap-3 w-full text-gray-700 py-3 px-3 hover:bg-gray-50 rounded-lg transition text-left"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <GraduationCap className="w-5 h-5 text-ucc-crimson" /> Home
                </button>
                <button
                  className="flex items-center gap-3 w-full text-gray-700 py-3 px-3 hover:bg-gray-50 rounded-lg transition text-left"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <BookOpen className="w-5 h-5 text-ucc-navy" /> Features
                </button>
                <div className="border-t border-gray-100 my-3" />
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start border-gray-200 text-ucc-navy hover:text-white font-medium py-3">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="mt-2">
                  <Button className="w-full bg-ucc-crimson text-white hover:text-white font-semibold py-3">
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-6 md:px-12 lg:px-20">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-ucc-gold-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-ucc-crimson-50/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-ucc-navy/5 border border-ucc-navy/10 rounded-full px-4 py-1.5 mb-6"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-ucc-navy">University of Cape Coast Scheduling Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-ucc-navy leading-tight mb-6"
          >
            Smart Venue Booking &{' '}
            <span className="text-ucc-crimson">Academic Scheduling</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Book venues, generate lecture timetables, and schedule examinations — all in one platform designed for the University of Cape Coast community.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link to="/register">
              <Button size="lg" className="bg-ucc-crimson hover:bg-ucc-crimson-600 hover:text-white text-white text-lg px-8 py-6 font-semibold shadow-lg shadow-ucc-crimson/20">
                Start Booking
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-ucc-navy/20 text-ucc-navy hover:text-ucc-crimson hover:bg-ucc-navy/5 text-lg px-8 py-6 font-medium">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-10"
          >
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="w-28 h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))
            ) : stats ? (
              [
                { number: stats.venues || 0, label: 'Venues', icon: Building },
                { number: stats.bookings || 0, label: 'Bookings', icon: Calendar },
                { number: stats.users || 0, label: 'Users', icon: Users },
                { number: stats.buildings || 0, label: 'Buildings', icon: MapPin },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <stat.icon className="w-4 h-4 text-ucc-crimson" />
                    <span className="text-2xl sm:text-3xl font-heading font-bold text-ucc-navy">{stat.number}</span>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                </motion.div>
              ))
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-16 sm:py-24 px-6 md:px-12 lg:px-20 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ucc-navy mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              A complete scheduling platform designed for the academic needs of UCC.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className="w-11 h-11 rounded-lg bg-ucc-navy/5 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-ucc-crimson" />
                </div>
                <h3 className="text-lg font-heading font-bold text-ucc-navy mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT / CTA SECTION ===== */}
      <section id="about" className="py-16 sm:py-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-ucc-navy rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-ucc-crimson/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-ucc-gold/10 rounded-full blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Join the University of Cape Coast community on ClassEase. Book venues, manage schedules, and streamline your academic planning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white text-lg px-8 py-5 font-semibold">
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-5 font-medium">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 border-t border-gray-100 mt-auto bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ucc-crimson rounded flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-ucc-navy">ClassEase</span>
          </div>
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} ClassEase — University of Cape Coast. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
