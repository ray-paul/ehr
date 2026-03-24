// src/components/common/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 z-30 border-t"
      style={{ 
        backgroundColor: 'rgb(62, 64, 149)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          {/* Copyright */}
          <p className="text-xs text-white text-opacity-80 text-center md:text-left">
            © {new Date().getFullYear()} EHR System. All rights reserved. HIPAA Compliant.
          </p>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <Link to="/" className="text-white text-opacity-80 hover:text-white hover:text-opacity-100 transition-colors duration-200">
              Dashboard
            </Link>
            <Link to="/patients" className="text-white text-opacity-80 hover:text-white hover:text-opacity-100 transition-colors duration-200">
              Patients
            </Link>
            <Link to="/appointments" className="text-white text-opacity-80 hover:text-white hover:text-opacity-100 transition-colors duration-200">
              Appointments
            </Link>
            <Link to="/reports" className="text-white text-opacity-80 hover:text-white hover:text-opacity-100 transition-colors duration-200">
              Reports
            </Link>
            <a href="#" className="text-white text-opacity-80 hover:text-white hover:text-opacity-100 transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-white text-opacity-80 hover:text-white hover:text-opacity-100 transition-colors duration-200">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;