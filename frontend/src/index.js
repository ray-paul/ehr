import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileSections = document.querySelectorAll('.mobile-nav-section');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
    });

    mobileSections.forEach(section => {
      const button = section.querySelector('button');
      if (button) {
        button.addEventListener('click', function() {
          section.classList.toggle('active');
        });
      }
    });

    document.addEventListener('click', function(event) {
      if (!event.target.closest('.mobile-menu') && !event.target.closest('.mobile-menu-button')) {
        mobileMenu.classList.add('hidden');
      }
    });
  }
});

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
