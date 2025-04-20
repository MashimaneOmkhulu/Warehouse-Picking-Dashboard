'use client';

import React, { useState, useEffect } from 'react';

interface StickyHeaderProps {
  children: React.ReactNode;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`sticky-header ${isScrolled ? 'scrolled glass' : ''} z-50 py-4 mb-4 transition-all-smooth`}>
      {children}
    </div>
  );
};

export default StickyHeader; 