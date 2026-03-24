// src/components/common/Layout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from '../Sidebar';
import Footer from './Footer';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  
  // Check if current path is the home page
  const isHomePage = location.pathname === '/';

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false); // Close mobile menu when switching to desktop
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with hamburger menu on mobile */}
      <Header 
        toggleSidebar={toggleSidebar} 
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        closeSidebar={closeSidebar}
      />
      
      {/* Sidebar - Different behavior on desktop vs mobile */}
      {!isMobile ? (
        // Desktop: Fixed sidebar always visible
        <Sidebar isOpen={true} onClose={() => {}} />
      ) : (
        // Mobile: Overlay sidebar that slides in
        <>
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={closeSidebar}
            />
          )}
          <div className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          </div>
        </>
      )}
      
      {/* Main Content Area */}
      <main className={`min-h-screen ${!isMobile ? 'md:ml-64' : ''}`}>
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      
      {/* Footer - Only show on home page */}
      {isHomePage && <Footer />}
    </div>
  );
};

export default Layout;