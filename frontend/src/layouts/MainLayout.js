import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaBell, FaCalendarAlt, FaSearch, FaClinicMedical, FaHome } from 'react-icons/fa';
import ApiService from '../services/api';

const MainLayout = () => {
  const { user, isAuthenticated, logout, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  const api = useMemo(() => new ApiService(token), [token]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (isAuthenticated) {
        try {
          const data = await api.getNotifications();
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      }
    };

    fetchNotifications();
    // Set up interval to check for new notifications
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isAuthenticated, token, api]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n._id === id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Determine navigation items based on user role
  const getNavItems = () => {
    if (!isAuthenticated) return [];

    const commonItems = [
      { to: '/dashboard', icon: <FaHome />, text: 'Dashboard' }
    ];

    if (user?.role === 'patient') {
      return [
        ...commonItems,
        { to: '/search-doctors', icon: <FaSearch />, text: 'Find Doctor' },
        { to: '/my-appointments', icon: <FaCalendarAlt />, text: 'My Appointments' }
      ];
    } else if (user?.role === 'doctor') {
      return [
        ...commonItems,
        { to: '/doctor/appointments', icon: <FaCalendarAlt />, text: 'Appointments' },
        { to: '/doctor/profile', icon: <FaUser />, text: 'My Profile' }
      ];
    } else if (user?.role === 'admin') {
      return [
        ...commonItems,
        { to: '/admin/users', icon: <FaUser />, text: 'Users' },
        { to: '/admin/doctors', icon: <FaClinicMedical />, text: 'Doctors' }
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Healthcare App
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                >
                  <FaBell className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b flex justify-between items-center">
                      <h3 className="font-medium">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-sm text-blue-500 hover:text-blue-700"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      <div>
                        {notifications.map(notification => (
                          <div 
                            key={notification._id}
                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                            onClick={() => markAsRead(notification._id)}
                          >
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* User menu */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 font-medium">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>
      
      {/* Sidebar and Content */}
      <div className="flex flex-1">
        {isAuthenticated && (
          <aside className="w-64 bg-white border-r hidden md:block">
            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      to={item.to}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-md ${
                        location.pathname === item.to
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.icon}
                      <span>{item.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
        
        {/* Main content */}
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
