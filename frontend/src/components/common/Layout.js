// frontend/src/components/common/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';  
import Footer from '../Footer';  

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;