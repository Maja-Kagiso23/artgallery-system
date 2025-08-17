// components/Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  shadow = 'shadow-md',
  rounded = 'rounded-lg',
  bg = 'bg-white'
}) => {
  return (
    <div className={`${bg} ${shadow} ${rounded} ${padding} ${className}`}>
      {children}
    </div>
  );
};

