// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-lg border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EHR System</h1>
                <p className="text-xs text-blue-600 font-medium">Secure Health Records</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Dashboard */}
            <Link to="/dashboard" className="nav-item group">
              <i className="fas fa-tachometer-alt text-blue-500 group-hover:text-white"></i>
              <span>Dashboard</span>
            </Link>

            {/* Patients Dropdown */}
            <div className="nav-dropdown group">
              <button className="nav-item">
                <i className="fas fa-user-injured text-green-500 group-hover:text-white"></i>
                <span>Patients</span>
                <i className="fas fa-chevron-down text-xs ml-1 transition-transform group-hover:rotate-180"></i>
              </button>
              <div className="nav-dropdown-menu">
                <Link to="/patients" className="nav-dropdown-item">
                  <i className="fas fa-list text-green-500"></i>
                  Patient Records
                </Link>
                <Link to="/patients/new" className="nav-dropdown-item">
                  <i className="fas fa-plus-circle text-green-500"></i>
                  Add New Patient
                </Link>
                <Link to="/patients/search" className="nav-dropdown-item">
                  <i className="fas fa-search text-green-500"></i>
                  Search Patients
                </Link>
              </div>
            </div>

            {/* Medical Records Dropdown */}
            <div className="nav-dropdown group">
              <button className="nav-item">
                <i className="fas fa-file-medical text-purple-500 group-hover:text-white"></i>
                <span>Medical</span>
                <i className="fas fa-chevron-down text-xs ml-1 transition-transform group-hover:rotate-180"></i>
              </button>
              <div className="nav-dropdown-menu">
                <Link to="/reports" className="nav-dropdown-item">
                  <i className="fas fa-file-alt text-purple-500"></i>
                  Medical Reports
                </Link>
                <Link to="/prescriptions" className="nav-dropdown-item">
                  <i className="fas fa-prescription-bottle text-purple-500"></i>
                  Prescriptions
                </Link>
                <Link to="/lab-results" className="nav-dropdown-item">
                  <i className="fas fa-microscope text-purple-500"></i>
                  Lab Results
                </Link>
              </div>
            </div>

            {/* Appointments */}
            <Link to="/appointments" className="nav-item group">
              <i className="fas fa-calendar-check text-orange-500 group-hover:text-white"></i>
              <span>Appointments</span>
            </Link>

            {/* User Account Dropdown */}
            <div className="nav-dropdown group">
              <button className="nav-item">
                <i className="fas fa-user-circle text-gray-500 group-hover:text-white"></i>
                <span>Account</span>
                <i className="fas fa-chevron-down text-xs ml-1 transition-transform group-hover:rotate-180"></i>
              </button>
              <div className="nav-dropdown-menu right-0">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Dr. Sarah Johnson</p>
                  <p className="text-xs text-gray-500">sarah.j@hospital.org</p>
                </div>
                <Link to="/profile" className="nav-dropdown-item">
                  <i className="fas fa-user text-gray-500"></i>
                  My Profile
                </Link>
                <Link to="/settings" className="nav-dropdown-item">
                  <i className="fas fa-cog text-gray-500"></i>
                  Settings
                </Link>
                <div className="border-t border-gray-100">
                  <Link to="/logout" className="nav-dropdown-item text-red-600 hover:bg-red-50">
                    <i className="fas fa-sign-out-alt text-red-500"></i>
                    Logout
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="mobile-menu-button p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="mobile-menu hidden md:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="px-4 py-3 space-y-1">
          <Link to="/dashboard" className="mobile-nav-item">
            <i className="fas fa-tachometer-alt text-blue-500 w-6"></i>
            Dashboard
          </Link>
          
          <div className="mobile-nav-section">
            <button className="mobile-nav-item justify-between">
              <div className="flex items-center">
                <i className="fas fa-user-injured text-green-500 w-6"></i>
                Patients
              </div>
              <i className="fas fa-chevron-down text-xs"></i>
            </button>
            <div className="mobile-submenu pl-8 space-y-1">
              <Link to="/patients" className="mobile-subnav-item">Patient Records</Link>
              <Link to="/patients/new" className="mobile-subnav-item">Add New Patient</Link>
              <Link to="/patients/search" className="mobile-subnav-item">Search Patients</Link>
            </div>
          </div>

          <div className="mobile-nav-section">
            <button className="mobile-nav-item justify-between">
              <div className="flex items-center">
                <i className="fas fa-file-medical text-purple-500 w-6"></i>
                Medical
              </div>
              <i className="fas fa-chevron-down text-xs"></i>
            </button>
            <div className="mobile-submenu pl-8 space-y-1">
              <Link to="/reports" className="mobile-subnav-item">Medical Reports</Link>
              <Link to="/prescriptions" className="mobile-subnav-item">Prescriptions</Link>
              <Link to="/lab-results" className="mobile-subnav-item">Lab Results</Link>
            </div>
          </div>

          <Link to="/appointments" className="mobile-nav-item">
            <i className="fas fa-calendar-check text-orange-500 w-6"></i>
            Appointments
          </Link>

          <div className="border-t border-gray-200 pt-2">
            <Link to="/profile" className="mobile-nav-item">
              <i className="fas fa-user text-gray-500 w-6"></i>
              My Profile
            </Link>
            <Link to="/settings" className="mobile-nav-item">
              <i className="fas fa-cog text-gray-500 w-6"></i>
              Settings
            </Link>
            <Link to="/logout" className="mobile-nav-item text-red-600">
              <i className="fas fa-sign-out-alt text-red-500 w-6"></i>
              Logout
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;