import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Info, CheckCircle, XCircle, AlertTriangle,
  Mail, MailOpen, Clock, Filter, Inbox, Sparkles
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = notifications.filter((n) => {
    const matchesFilter = filter === 'all' || (filter === 'unread' ? !n.isRead : n.isRead);
    const matchesCategory = !categoryFilter || n.category === categoryFilter;
    return matchesFilter && matchesCategory;
  });

  const categories = [...new Set(notifications.map((n) => n.category).filter(Boolean))];

  const getTypeIcon = (type) => {
    const map = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
    return map[type] || Bell;
  };

  const getTypeStyles = (type) => {
    const map = {
      success: { icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500' },
      error: { icon: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', accent: 'bg-red-500' },
      warning: { icon: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-500' },
      info: { icon: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', accent: 'bg-blue-500' },
    };
    return map[type] || { icon: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', accent: 'bg-gray-500' };
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityLabel = (priority) => {
    if (priority === 'high') return { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' };
    if (priority === 'low') return { label: 'Low', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    return null;
  };

  const filterTabs = [
    { value: 'all', label: 'All', count: notifications.length, icon: Inbox },
    { value: 'unread', label: 'Unread', count: unreadCount, icon: Mail },
    { value: 'read', label: 'Read', count: notifications.length - unreadCount, icon: MailOpen },
  ];

  return (
    <DashboardLayout title="Notifications" breadcrumbs={[{ label: 'Notifications' }]}>
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card-institutional p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-ucc-navy mt-0.5">{notifications.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card-institutional p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unread</p>
              <p className="text-2xl font-bold text-ucc-crimson mt-0.5">{unreadCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-ucc-crimson" />
            </div>
          </div>
        </div>
        <div className="card-institutional p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Read</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{notifications.length - unreadCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MailOpen className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-institutional p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  filter === tab.value
                    ? 'bg-white text-ucc-navy shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filter === tab.value ? 'bg-ucc-navy text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input-institutional w-auto text-xs py-2 px-3"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            )}
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-ucc-navy/20 text-ucc-navy hover:bg-ucc-navy hover:text-white"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner-large" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-institutional">
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-heading font-bold text-ucc-navy text-lg mb-1">
              {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
            </h3>
            <p className="text-sm text-gray-400">
              {filter === 'unread' ? 'You\'re all caught up! Great job.' : 'Nothing here yet. Notifications will appear when there\'s activity.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((notif, idx) => {
              const Icon = getTypeIcon(notif.type);
              const styles = getTypeStyles(notif.type);
              const priority = getPriorityLabel(notif.priority);
              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`card-institutional overflow-hidden cursor-pointer group transition-all hover:shadow-md ${
                    !notif.isRead ? 'ring-1 ring-ucc-crimson/15' : ''
                  }`}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                  <div className="flex">
                    {/* Left accent bar */}
                    <div className={`w-1 flex-shrink-0 ${!notif.isRead ? styles.accent : 'bg-transparent'}`} />

                    <div className="flex-1 p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.bg} ${styles.border} border`}>
                          <Icon className={`w-5 h-5 ${styles.icon}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm font-semibold leading-tight ${
                                !notif.isRead ? 'text-ucc-navy' : 'text-gray-600'
                              }`}>
                                {notif.title}
                              </h4>
                              {!notif.isRead && (
                                <span className="inline-flex w-2 h-2 rounded-full bg-ucc-crimson flex-shrink-0 animate-pulse" />
                              )}
                              {priority && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priority.color}`}>
                                  {priority.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              <span className="text-[11px] font-medium whitespace-nowrap">{formatTimeAgo(notif.createdAt)}</span>
                            </div>
                          </div>

                          <p className={`text-sm mt-1 leading-relaxed ${
                            !notif.isRead ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {notif.message}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 mt-2.5">
                            {notif.category && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
                                <Filter className="w-3 h-3" />
                                {notif.category}
                              </span>
                            )}
                            {!notif.isRead && (
                              <span className="text-[11px] text-ucc-crimson font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to mark as read
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Footer count */}
      {filtered.length > 0 && (
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default NotificationsPage;