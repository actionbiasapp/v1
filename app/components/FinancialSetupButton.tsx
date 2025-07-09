'use client';

import { useState } from 'react';

export default function FinancialSetupButton() {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = () => {
    // TODO: Implement financial setup modal/page
    alert('Financial Setup coming soon! This will allow you to:\n\n• Set your actual income\n• Track SRS contributions\n• Customize FI milestones\n• Manage tax optimization');
  };
  
  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 hover:text-white transition-all duration-200 opacity-75"
      title="Financial Setup (Coming Soon)"
    >
      <span className="text-sm">⚙️</span>
      <span className="text-sm font-medium">Financial Setup</span>
      {isHovered && (
        <span className="text-xs text-gray-400">(Coming Soon)</span>
      )}
    </button>
  );
}