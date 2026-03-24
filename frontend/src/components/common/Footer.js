// src/components/common/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 fixed bottom-0 left-0 right-0 z-30">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col items-center justify-center gap-2">
          {/* Copyright */}
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} EHR System. All rights reserved.
          </p>        
        </div>
      </div>
    </footer>
  );
};

export default Footer;