import { useEffect } from 'react';

// Reusable hook: observes elements with `.float-card` and toggles `.in-view` when visible
export default function useFloatOnView(options = { threshold: 0.2 }) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.float-card'));
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, options);
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [JSON.stringify(options)]);
}
