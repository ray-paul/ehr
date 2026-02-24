// frontend/src/components/common/Layout.js
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  
  // Check if current path is the home page
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      {/* Only show footer on home page */}
      {isHomePage && <Footer />}
    </div>
  );
};

export default Layout;