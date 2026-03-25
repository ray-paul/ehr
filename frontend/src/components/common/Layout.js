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

  // Calculate sidebar width for offset
  const sidebarWidth = 256; // 64 * 4 = 256px (w-64)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Fixed at top, spans full width */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <Header 
          toggleSidebar={toggleSidebar} 
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          closeSidebar={closeSidebar}
        />
      </div>
      
      {/* Sidebar - Fixed on left */}
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
      
      {/* Main Content Area - Offset by header height and sidebar width on desktop */}
      <div className={`flex-1 ${!isMobile ? 'ml-64' : ''} mt-14 sm:mt-16`}>
        <main className="min-h-[calc(100vh-7rem)]">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
        
        {/* Footer - Full width, below content */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;