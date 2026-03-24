// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

const Sidebar = ({ isOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const currentUser = authService.getCurrentUser() || {};
  const isProvider = ['doctor', 'nurse', 'admin', 'lab_technician'].includes(currentUser.user_type);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      onClose();
    }
  }, [location.pathname, onClose]);

  // Navigation items
  const navItems = [
    {
      path: '/',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      roles: ['all']
    },
    {
      path: '/patients',
      icon: 'fas fa-user-injured',
      label: 'Patients',
      roles: ['all']
    },
    {
      icon: 'fas fa-chart-line',
      label: 'Medical Records',
      roles: ['doctor', 'nurse', 'admin'],
      dropdown: [
        { path: '/reports', icon: 'fas fa-file-alt', label: 'Medical Reports' },
        { path: '/prescriptions', icon: 'fas fa-prescription-bottle', label: 'e-Scripts' },
        { path: '/lab-results', icon: 'fas fa-microscope', label: 'Lab Results' }
      ]
    },
    {
      path: '/appointments',
      icon: 'fas fa-calendar-check',
      label: 'Appointments',
      roles: ['all']
    },
    {
      icon: 'fas fa-chart-bar',
      label: 'Analytics',
      roles: ['doctor', 'nurse', 'admin', 'researcher'],
      dropdown: [
        { path: '/analytics/clinical', icon: 'fas fa-chart-line', label: 'Clinical Analytics' },
        { path: '/analytics/patients', icon: 'fas fa-users', label: 'Patient Analytics' },
        { path: '/analytics/research', icon: 'fas fa-flask', label: 'Research Data' }
      ]
    },
    {
      path: '/messages',
      icon: 'fas fa-envelope',
      label: 'Messages',
      roles: ['all'],
      badge: 3
    },
    {
      path: '/notifications',
      icon: 'fas fa-bell',
      label: 'Notifications',
      roles: ['all'],
      badge: 5
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleDropdown = (label) => {
    if (activeDropdown === label) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(label);
    }
  };

  const renderNavItem = (item, index) => {
    // Check role permissions
    if (!item.roles.includes('all') && !item.roles.includes(currentUser.user_type)) {
      return null;
    }

    if (item.dropdown) {
      const isOpen = activeDropdown === item.label;
      return (
        <div key={index} className="mb-1">
          <button
            onClick={() => toggleDropdown(item.label)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
              isOpen 
                ? 'bg-blue-600 text-white' 
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <div className="flex items-center space-x-3">
              <i className={`${item.icon} text-lg`}></i>
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </div>
            {!collapsed && (
              <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-xs transition-transform`}></i>
            )}
          </button>
          
          {!collapsed && isOpen && (
            <div className="ml-8 mt-1 space-y-1">
              {item.dropdown.map((subItem, subIndex) => (
                <Link
                  key={subIndex}
                  to={subItem.path}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(subItem.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                >
                  <i className={`${subItem.icon} text-sm`}></i>
                  <span className="text-sm">{subItem.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={index}
        to={item.path}
        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive(item.path)
            ? 'bg-white bg-opacity-20 text-white'
            : 'text-white hover:bg-white hover:bg-opacity-20'
        }`}
        onClick={() => {
          if (window.innerWidth < 768) onClose();
        }}
      >
        <div className="flex items-center space-x-3">
          <i className={`${item.icon} text-lg`}></i>
          {!collapsed && <span className="font-medium">{item.label}</span>}
        </div>
        {!collapsed && item.badge && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar - Starts below header */}
      <aside
        className={`
          fixed left-0 shadow-lg transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-20' : 'w-64'}
          md:translate-x-0
          top-14 sm:top-16
          bottom-0
          overflow-y-auto
          z-20
        `}
        style={{ backgroundColor: 'rgb(62, 64, 149)' }}
      >
     
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {navItems.map((item, index) => renderNavItem(item, index))}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;