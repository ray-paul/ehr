// src/components/common/Header.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const Header = ({ toggleSidebar, isMobile, sidebarOpen, closeSidebar }) => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Dynamic display name based on screen size
  const getDisplayName = () => {
    if (!currentUser) return 'Account';
    
    const name = currentUser.first_name || currentUser.username || currentUser.email || 'User';
    
    if (windowWidth < 640) {
      return name.split(' ')[0].substring(0, 6) + (name.length > 6 ? '…' : '');
    } else if (windowWidth < 900) {
      return name.substring(0, 8) + (name.length > 8 ? '…' : '');
    }
    return name;
  };

  return (
    <header className="bg-white shadow-lg border-b border-blue-100 sticky top-0 z-40 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side - Hamburger menu and logo */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Hamburger menu button - only visible on mobile */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors focus:outline-none"
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'} text-lg sm:text-xl`}></i>
              </button>
            )}

            {/* Logo and Brand */}
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width={windowWidth < 640 ? "20" : "24"} 
                  height={windowWidth < 640 ? "20" : "24"} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-white"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
                </svg>
              </div>
              <div>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">
                  EHR System
                </h1>
                <p className="text-[8px] xs:text-[10px] sm:text-xs text-blue-600 font-medium hidden xs:block whitespace-nowrap">
                  {windowWidth < 480 ? 'Secure EHR' : 'Secure Health Records'}
                </p>
              </div>
            </Link>
          </div>

          {/* Right side - User Profile Dropdown */}
          <div className="flex items-center space-x-2">
            {/* User Account Dropdown */}
            <div className="nav-dropdown group">
              <button className="nav-item">
                <i className="fas fa-user-circle text-gray-500 group-hover:text-white text-lg"></i>
                <span className="max-w-[60px] lg:max-w-[100px] truncate text-sm lg:text-base font-medium hidden sm:inline-block">
                  {getDisplayName()}
                </span>
                <i className="fas fa-chevron-down text-xs ml-1 transition-transform group-hover:rotate-180 hidden sm:inline-block"></i>
              </button>
              <div className="nav-dropdown-menu right-0 min-w-[200px]">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {currentUser?.first_name || currentUser?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {currentUser?.user_type || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {currentUser?.email || 'No email'}
                  </p>
                </div>
                <Link to="/profile" className="nav-dropdown-item" onClick={() => isMobile && closeSidebar && closeSidebar()}>
                  <i className="fas fa-user-circle text-gray-500 text-sm"></i>
                  <span>My Profile</span>
                </Link>
                <Link to="/settings" className="nav-dropdown-item" onClick={() => isMobile && closeSidebar && closeSidebar()}>
                  <i className="fas fa-cog text-gray-500 text-sm"></i>
                  <span>Settings</span>
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left nav-dropdown-item text-red-600 hover:bg-red-50"
                  >
                    <i className="fas fa-sign-out-alt text-red-500 text-sm"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-item {
          @apply flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-600 hover:text-white transition-colors duration-200;
        }
        .nav-dropdown {
          @apply relative;
        }
        .nav-dropdown-menu {
          @apply absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50;
        }
        .nav-dropdown-item {
          @apply flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 w-full gap-3;
        }
      `}</style>
    </header>
  );
};

export default Header;