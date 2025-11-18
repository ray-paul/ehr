// frontend/src/components/common/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  return (
    <div>
      <Header />
      <div className="container mt-4">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;