// src/components/Header.js
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const Header = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const mobileMenuRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Check user roles
  const isPatient = currentUser?.user_type === 'patient';
  const isStaff = currentUser?.user_type && ['doctor', 'nurse', 'admin', 'pharmacist', 'radiologist', 'labscientist', 'master_admin'].includes(currentUser.user_type);
  const isMasterAdmin = currentUser?.user_type === 'master_admin';

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target) &&
          !event.target.closest('.mobile-menu-button')) {
        mobileMenuRef.current.classList.add('hidden');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.classList.toggle('hidden');
    }
  };

  const toggleMobileSubmenu = (section) => {
    section.classList.toggle('active');
  };

  // Determine when to show compact mode
  const showCompactMode = windowWidth < 900 && windowWidth >= 768;

  // Dynamic display name based on screen size
  const getDisplayName = () => {
    if (!currentUser) return 'Account';
    
    const name = currentUser.first_name || currentUser.username || currentUser.email || 'User';
    
    if (windowWidth < 640) {
      // Mobile - show just first name or initial
      return name.split(' ')[0].substring(0, 6) + (name.length > 6 ? '…' : '');
    } else if (windowWidth < 900) {
      // Tablet - show short name
      return name.substring(0, 8) + (name.length > 8 ? '…' : '');
    }
    return name;
  };

  return (
    <header className="bg-white shadow-lg border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and Brand - Fixed width to prevent overlap */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0" style={{ minWidth: showCompactMode ? 'auto' : '140px' }}>
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
              <div className={showCompactMode ? 'hidden' : 'block'}>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 whitespace-nowrap">
                  EHR System
                </h1>
                <p className="text-[8px] xs:text-[10px] sm:text-xs text-blue-600 font-medium hidden xs:block whitespace-nowrap">
                  {windowWidth < 480 ? 'Secure EHR' : 'Secure Health Records'}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className={`${showCompactMode ? 'hidden' : 'hidden md:flex'} items-center justify-end flex-1 min-w-0`} style={{ gap: '2px' }}>
            {/* Dashboard */}
            <Link to="/" className="nav-item group">
              <i className="fas fa-tachometer-alt text-blue-500 group-hover:text-white text-xs lg:text-sm"></i>
              <span className="text-xs lg:text-sm whitespace-nowrap">Dashboard</span>
            </Link>

            {/* Patients Dropdown - Only for non-patients */}
            {!isPatient && (
              <div className="nav-dropdown group">
                <button className="nav-item">
                  <i className="fas fa-user-injured text-green-500 group-hover:text-white text-xs lg:text-sm"></i>
                  <span className="text-xs lg:text-sm whitespace-nowrap">Patients</span>
                  <i className="fas fa-chevron-down text-[10px] lg:text-xs ml-0.5 transition-transform group-hover:rotate-180"></i>
                </button>
                <div className="nav-dropdown-menu">
                  <Link to="/patients" className="nav-dropdown-item">
                    <i className="fas fa-list text-green-500 text-xs"></i>
                    <span className="text-xs">Records</span>
                  </Link>
                  {isStaff && (
                    <Link to="/patients/new" className="nav-dropdown-item">
                      <i className="fas fa-plus-circle text-green-500 text-xs"></i>
                      <span className="text-xs">Add</span>
                    </Link>
                  )}
                  {isStaff && (
                    <Link to="/patients/search" className="nav-dropdown-item">
                      <i className="fas fa-search text-green-500 text-xs"></i>
                      <span className="text-xs">Search</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Medical Records Dropdown */}
            <div className="nav-dropdown group">
              <button className="nav-item">
                <i className="fas fa-file-medical text-purple-500 group-hover:text-white text-xs lg:text-sm"></i>
                <span className="text-xs lg:text-sm whitespace-nowrap">Medical</span>
                <i className="fas fa-chevron-down text-[10px] lg:text-xs ml-0.5 transition-transform group-hover:rotate-180"></i>
              </button>
              <div className="nav-dropdown-menu">
                <Link to="/reports" className="nav-dropdown-item">
                  <i className="fas fa-file-alt text-purple-500 text-xs"></i>
                  <span className="text-xs">Reports</span>
                </Link>
                <Link to="/prescriptions" className="nav-dropdown-item">
                  <i className="fas fa-prescription-bottle text-purple-500 text-xs"></i>
                  <span className="text-xs">Scripts</span>
                </Link>
                <Link to="/lab-results" className="nav-dropdown-item">
                  <i className="fas fa-microscope text-purple-500 text-xs"></i>
                  <span className="text-xs">Lab</span>
                </Link>
              </div>
            </div>

            {/* Appointments */}
            <Link to="/appointments" className="nav-item group">
              <i className="fas fa-calendar-check text-orange-500 group-hover:text-white text-xs lg:text-sm"></i>
              <span className="text-xs lg:text-sm whitespace-nowrap">Appts</span>
            </Link>

            {/* Admin Link - Only for master admin */}
            {isMasterAdmin && (
              <Link to="/admin/users" className="nav-item group">
                <i className="fas fa-users-cog text-purple-500 group-hover:text-white text-xs lg:text-sm"></i>
                <span className="text-xs lg:text-sm whitespace-nowrap">Admin</span>
              </Link>
            )}

            {/* User Account Dropdown */}
            <div className="nav-dropdown group">
              <button className="nav-item">
                <i className="fas fa-user-circle text-gray-500 group-hover:text-white text-sm"></i>
                <span className="max-w-[60px] lg:max-w-[100px] truncate text-xs lg:text-sm">
                  {getDisplayName()}
                </span>
                <i className="fas fa-chevron-down text-[10px] lg:text-xs ml-0.5 transition-transform group-hover:rotate-180"></i>
              </button>
              <div className="nav-dropdown-menu right-0 min-w-[160px]">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {currentUser?.first_name || currentUser?.username || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500 capitalize truncate">
                    {currentUser?.user_type || 'User'}
                  </p>
                </div>
                <Link to="/profile" className="nav-dropdown-item">
                  <i className="fas fa-user text-gray-500 text-xs"></i>
                  <span className="text-xs">Profile</span>
                </Link>
                <Link to="/settings" className="nav-dropdown-item">
                  <i className="fas fa-cog text-gray-500 text-xs"></i>
                  <span className="text-xs">Settings</span>
                </Link>
                <div className="border-t border-gray-100">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left nav-dropdown-item text-red-600 hover:bg-red-50"
                  >
                    <i className="fas fa-sign-out-alt text-red-500 text-xs"></i>
                    <span className="text-xs">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Compact Mode Navigation (768px - 900px) */}
          {showCompactMode && (
            <div className="hidden md:flex items-center justify-end flex-1">
              <div className="nav-dropdown group">
                <button className="nav-item bg-blue-50 text-blue-600">
                  <i className="fas fa-bars mr-1"></i>
                  <span>Menu</span>
                  <i className="fas fa-chevron-down text-xs ml-1"></i>
                </button>
                <div className="nav-dropdown-menu right-0 min-w-[200px]">
                  <Link to="/" className="nav-dropdown-item">
                    <i className="fas fa-tachometer-alt text-blue-500 mr-2"></i>
                    Dashboard
                  </Link>
                  {!isPatient && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500">PATIENTS</div>
                      <Link to="/patients" className="nav-dropdown-item pl-6">
                        <i className="fas fa-list text-green-500 mr-2 text-xs"></i>
                        Patient Records
                      </Link>
                      {isStaff && (
                        <Link to="/patients/new" className="nav-dropdown-item pl-6">
                          <i className="fas fa-plus-circle text-green-500 mr-2 text-xs"></i>
                          Add New Patient
                        </Link>
                      )}
                      {isStaff && (
                        <Link to="/patients/search" className="nav-dropdown-item pl-6">
                          <i className="fas fa-search text-green-500 mr-2 text-xs"></i>
                          Search Patients
                        </Link>
                      )}
                    </>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500">MEDICAL</div>
                  <Link to="/reports" className="nav-dropdown-item pl-6">
                    <i className="fas fa-file-alt text-purple-500 mr-2 text-xs"></i>
                    Medical Reports
                  </Link>
                  <Link to="/prescriptions" className="nav-dropdown-item pl-6">
                    <i className="fas fa-prescription-bottle text-purple-500 mr-2 text-xs"></i>
                    e-Scripts
                  </Link>
                  <Link to="/lab-results" className="nav-dropdown-item pl-6">
                    <i className="fas fa-microscope text-purple-500 mr-2 text-xs"></i>
                    Lab Results
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link to="/appointments" className="nav-dropdown-item">
                    <i className="fas fa-calendar-check text-orange-500 mr-2"></i>
                    Appointments
                  </Link>
                  {isMasterAdmin && (
                    <Link to="/admin/users" className="nav-dropdown-item">
                      <i className="fas fa-users-cog text-purple-500 mr-2"></i>
                      User Management
                    </Link>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-3 py-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-900">
                      {currentUser?.first_name || currentUser?.username || 'User'}
                    </p>
                    <p className="text-[10px] text-gray-500 capitalize">
                      {currentUser?.user_type || 'User'}
                    </p>
                  </div>
                  <Link to="/profile" className="nav-dropdown-item">
                    <i className="fas fa-user text-gray-500 mr-2"></i>
                    My Profile
                  </Link>
                  <Link to="/settings" className="nav-dropdown-item">
                    <i className="fas fa-cog text-gray-500 mr-2"></i>
                    Settings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left nav-dropdown-item text-red-600 hover:bg-red-50"
                  >
                    <i className="fas fa-sign-out-alt text-red-500 mr-2"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex-shrink-0 ml-2">
            <button 
              className="mobile-menu-button p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              onClick={toggleMobileMenu}
            >
              <i className="fas fa-bars text-lg sm:text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        ref={mobileMenuRef}
        className="mobile-menu hidden md:hidden bg-white border-t border-gray-200 shadow-lg"
      >
        <div className="px-3 py-2 space-y-1">
          <Link 
            to="/" 
            className="mobile-nav-item"
            onClick={() => mobileMenuRef.current?.classList.add('hidden')}
          >
            <i className="fas fa-tachometer-alt text-blue-500 w-5"></i>
            <span>Dashboard</span>
          </Link>
          
          {/* Patients Mobile Section - Only for non-patients */}
          {!isPatient && (
            <div className="mobile-nav-section">
              <button 
                className="mobile-nav-item justify-between"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMobileSubmenu(e.currentTarget.parentElement);
                }}
              >
                <div className="flex items-center">
                  <i className="fas fa-user-injured text-green-500 w-5"></i>
                  <span>Patients</span>
                </div>
                <i className="fas fa-chevron-down text-xs"></i>
              </button>
              <div className="mobile-submenu pl-7 space-y-1">
                <Link 
                  to="/patients" 
                  className="mobile-subnav-item"
                  onClick={() => mobileMenuRef.current?.classList.add('hidden')}
                >
                  Patient Records
                </Link>
                {isStaff && (
                  <Link 
                    to="/patients/new" 
                    className="mobile-subnav-item"
                    onClick={() => mobileMenuRef.current?.classList.add('hidden')}
                  >
                    Add New Patient
                  </Link>
                )}
                {isStaff && (
                  <Link 
                    to="/patients/search" 
                    className="mobile-subnav-item"
                    onClick={() => mobileMenuRef.current?.classList.add('hidden')}
                  >
                    Search Patients
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Medical Mobile Section */}
          <div className="mobile-nav-section">
            <button 
              className="mobile-nav-item justify-between"
              onClick={(e) => {
                e.stopPropagation();
                toggleMobileSubmenu(e.currentTarget.parentElement);
              }}
            >
              <div className="flex items-center">
                <i className="fas fa-file-medical text-purple-500 w-5"></i>
                <span>Medical</span>
              </div>
              <i className="fas fa-chevron-down text-xs"></i>
            </button>
            <div className="mobile-submenu pl-7 space-y-1">
              <Link 
                to="/reports" 
                className="mobile-subnav-item"
                onClick={() => mobileMenuRef.current?.classList.add('hidden')}
              >
                Medical Reports
              </Link>
              <Link 
                to="/prescriptions" 
                className="mobile-subnav-item"
                onClick={() => mobileMenuRef.current?.classList.add('hidden')}
              >
                e-Scripts
              </Link>
              <Link 
                to="/lab-results" 
                className="mobile-subnav-item"
                onClick={() => mobileMenuRef.current?.classList.add('hidden')}
              >
                Lab Results
              </Link>
            </div>
          </div>

          {/* Appointments */}
          <Link 
            to="/appointments" 
            className="mobile-nav-item"
            onClick={() => mobileMenuRef.current?.classList.add('hidden')}
          >
            <i className="fas fa-calendar-check text-orange-500 w-5"></i>
            <span>Appointments</span>
          </Link>

          {/* Admin Link - Only for master admin */}
          {isMasterAdmin && (
            <Link 
              to="/admin/users" 
              className="mobile-nav-item"
              onClick={() => mobileMenuRef.current?.classList.add('hidden')}
            >
              <i className="fas fa-users-cog text-purple-500 w-5"></i>
              <span>User Management</span>
            </Link>
          )}

          {/* User Section */}
          <div className="border-t border-gray-200 pt-2">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.first_name || currentUser?.username || currentUser?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize truncate">
                {currentUser?.user_type || 'User'}
              </p>
            </div>
            <Link 
              to="/profile" 
              className="mobile-nav-item"
              onClick={() => mobileMenuRef.current?.classList.add('hidden')}
            >
              <i className="fas fa-user text-gray-500 w-5"></i>
              <span>My Profile</span>
            </Link>
            <Link 
              to="/settings" 
              className="mobile-nav-item"
              onClick={() => mobileMenuRef.current?.classList.add('hidden')}
            >
              <i className="fas fa-cog text-gray-500 w-5"></i>
              <span>Settings</span>
            </Link>
            <button 
              onClick={() => {
                handleLogout();
                mobileMenuRef.current?.classList.add('hidden');
              }}
              className="w-full text-left mobile-nav-item text-red-600"
            >
              <i className="fas fa-sign-out-alt text-red-500 w-5"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-item {
          @apply flex items-center px-1.5 lg:px-2 py-1.5 rounded-lg text-gray-600 hover:bg-blue-600 hover:text-white transition-colors duration-200 text-xs lg:text-sm;
        }
        .nav-dropdown {
          @apply relative;
        }
        .nav-dropdown-menu {
          @apply absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50;
        }
        .nav-dropdown-menu.right-0 {
          @apply left-auto right-0;
        }
        .nav-dropdown-item {
          @apply flex items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 w-full;
        }
        .mobile-nav-item {
          @apply flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200;
        }
        .mobile-subnav-item {
          @apply block px-3 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200;
        }
        .mobile-nav-section.active .mobile-submenu {
          @apply block;
        }
        .mobile-nav-section.active > button i.fa-chevron-down {
          @apply rotate-180;
        }
      `}</style>
    </header>
  );
};

export default Header;