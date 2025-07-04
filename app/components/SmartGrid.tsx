// Smart Grid Layout that adapts to expanded cards
'use client';

import { useState, useEffect, useRef } from 'react';

interface SmartGridProps {
  children: React.ReactNode[];
  expandedItems: Set<string>;
  gap?: number;
  minCardWidth?: number;
  className?: string; // Add this line
}

const SmartGrid: React.FC<SmartGridProps> = ({ 
  children, 
  expandedItems, 
  gap = 24,
  minCardWidth = 400,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const expandedCount = expandedItems.size;
      
      // If we have expanded items, give them more space
      if (expandedCount > 0) {
        // Expanded cards need more space, so reduce columns
        const maxColumns = Math.floor(containerWidth / (minCardWidth + 100));
        setColumns(Math.max(1, Math.min(expandedCount + 1, maxColumns)));
      } else {
        // Normal grid
        const maxColumns = Math.floor(containerWidth / minCardWidth);
        setColumns(Math.max(1, Math.min(4, maxColumns)));
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    
    return () => window.removeEventListener('resize', updateColumns);
  }, [expandedItems.size, minCardWidth]);

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
    gridAutoRows: 'min-content',
    transition: 'grid-template-columns 0.3s ease-out'
  };

  return (
    <div 
      ref={containerRef} 
      style={gridStyle}
      className={className}
    >
      {children}
    </div>
  );
};

export default SmartGrid;