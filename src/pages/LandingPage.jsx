
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';

const LandingPage = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Smart Booking',
      description: 'Book venues instantly with real-time availability checking and conflict prevention.'
    },
    {
      icon: MapPin,
      title: 'Campus Map',
      description: 'Interactive campus map showing all venues with detailed information and directions.'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Different dashboards for students, lecturers, managers, and administrators.'
    },
    {
      icon: Clock,
      title: 'Real-Time Updates',
      description: 'Get instant notifications about booking approvals, changes, and reminders.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based permissions and data protection.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Modern interface with smooth animations and lightning-fast performance.'
    }
  ];

  const [stats, setStats] = React.useState(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

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
    <div className="min-h-screen">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 glass-effect"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="text-2xl font-bold gradient-text"
              whileHover={{ scale: 1.05 }}
            >
              ClassEase
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tr from-purple-600/30 to-blue-500/10 rounded-full blur-2xl animate-pulse-slow" />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full mb-4 tracking-widest shadow-lg uppercase">
              The Smarter Way to Book Campus Venues
            </span>
            <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
              Effortless
              <span className="block gradient-text">Venue Booking</span>
              for Everyone
            </h1>
            <p className="text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
              ClassEase is your all-in-one platform for discovering, booking, and managing university venues. Enjoy real-time availability, instant notifications, and seamless collaboration whether you're a student, lecturer, or admin.
            </p>
            <ul className="flex flex-wrap justify-center gap-4 mb-10 text-white/80 text-base font-medium">
              <li className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2"><Calendar className="w-4 h-4" /> Instant Venue Booking</li>
              <li className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2"><Users className="w-4 h-4" /> Role-Based Dashboards</li>
              <li className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2"><Clock className="w-4 h-4" /> Real-Time Notifications</li>
              <li className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2"><MapPin className="w-4 h-4" /> Interactive Campus Map</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4 pulse-glow shadow-xl border-2 border-white/10"
                >
                  Start Booking Now
                </Button>
              </Link>
             <Link to="/login">
               <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4"
              >
                Find Venues
              </Button>
             </Link>
            </div>
          </motion.div>
          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-16"
          >
            <img  
              className="mx-auto rounded-2xl shadow-2xl floating-animation max-w-4xl w-full border-4 border-white/10"
              alt="University of Cape Coast building at dusk"
              src="/ucc-building.jpg" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="text-center animate-pulse">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 bg-white/10 rounded h-12 w-24 mx-auto" />
                  <div className="text-white/30 text-lg bg-white/5 rounded h-6 w-20 mx-auto mt-2" />
                </div>
              ))
            ) : stats ? (
              [
                { number: stats.venues, label: 'Venues Available' },
                { number: stats.bookings, label: 'Bookings Made' },
                { number: stats.users, label: 'Active Users' },
                { number: stats.departments, label: 'Departments' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-white/70 text-lg">{stat.label}</div>
                </motion.div>
              ))
            ) : null}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Everything you need to manage venue bookings efficiently and effectively.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="dashboard-card p-8 text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="dashboard-card p-12 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have already transformed their venue booking experience with ClassEase.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4"
                >
                  Create Account
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-2xl font-bold gradient-text mb-4 md:mb-0">
              ClassEase
            </div>
            <div className="text-white/60">
              © 2025 ClassEase. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
