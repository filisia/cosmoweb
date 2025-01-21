import React from 'react';

function Header({ title, subtitle }) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
    </div>
  );
}

export default Header; 