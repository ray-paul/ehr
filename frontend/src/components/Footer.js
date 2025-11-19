// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4">EHR System</h3>
          <p className="text-gray-300">Secure and reliable Electronic Health Record management for healthcare professionals.</p>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link to="/dashboard" className="hover:text-blue-300 transition-colors">Dashboard</Link></li>
            <li><Link to="/patients" className="hover:text-blue-300 transition-colors">Patient Records</Link></li>
            <li><Link to="/appointments" className="hover:text-blue-300 transition-colors">Appointments</Link></li>
            <li><Link to="/reports" className="hover:text-blue-300 transition-colors">Medical Reports</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Support</h3>
          <ul className="space-y-2 text-gray-300">
            <li>Email: support@ehrsystem.com</li>
            <li>Phone: +263 (555) 123-HELP</li>
            <li>Emergency: 24/7 Support</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-6 border-t border-gray-700 text-center">
        <p>&copy; 2024 EHR System. All rights reserved. HIPAA Compliant.</p>
      </div>
    </footer>
  );
};

export default Footer;