'use client';

import { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import EnhancedCategoryCard from './EnhancedCategoryCard';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  value: number;
  category: string;
  location: string;
}

interface CategoryData {
  name: string;
  holdings: Holding[];
  currentValue: number;
  currentPercent: number;
  target: number;
  gap: number;
  gapAmount: number;
  color: string;
  icon: React.ReactNode;
  description: string;
  status: 'perfect' | 'underweight' | 'excess';
  statusText: string;
  id: string;
}

interface DraggablePortfolioGridProps {
  categories: CategoryData[];
  totalValue: number;
  expandedCards: Set<string>;
  onToggleExpand: (categoryName: string) => void;
}

const DraggablePortfolioGrid: React.FC<DraggablePortfolioGridProps> = ({
  categories,
  totalValue,
  expandedCards,
  onToggleExpand
}) => {
  // State for card order - allows user customization
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  
  // Initialize card order from categories
  useEffect(() => {
    if (categories.length > 0 && cardOrder.length === 0) {
      setCardOrder(categories.map(cat => cat.name));
    }
  }, [categories, cardOrder.length]);

  // Handle drag end - reorder cards
  const handleDragEnd = useCallback((result: DropResult) => {
    // If dropped outside droppable area
    if (!result.destination) return;
    
    // If dropped in same position
    if (result.destination.index === result.source.index) return;

    // Reorder the cards
    const newOrder = Array.from(cardOrder);
    const [reorderedCard] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedCard);
    
    setCardOrder(newOrder);
    
    // Optional: Save user preference to localStorage
    try {
      localStorage.setItem('portfolio-card-order', JSON.stringify(newOrder));
    } catch {
      // Silently fail if localStorage is unavailable
      console.log('Could not save card order preference');
    }
  }, [cardOrder]);

  // Load saved card order from localStorage
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('portfolio-card-order');
      if (savedOrder && categories.length > 0) {
        const parsedOrder = JSON.parse(savedOrder);
        // Validate that all categories exist in saved order
        const currentCategoryNames = categories.map(cat => cat.name);
        const isValidOrder = parsedOrder.every((name: string) => 
          currentCategoryNames.includes(name)
        ) && parsedOrder.length === currentCategoryNames.length;
        
        if (isValidOrder) {
          setCardOrder(parsedOrder);
        }
      }
    } catch {
      // Silently fail if localStorage parsing fails
      console.log('Could not load saved card order');
    }
  }, [categories]);

  // Get ordered categories based on user preference
  const orderedCategories = cardOrder
    .map(name => categories.find(cat => cat.name === name))
    .filter((cat): cat is CategoryData => cat !== undefined);

  // Fallback to original order if reordering fails
  const categoriesToRender = orderedCategories.length === categories.length 
    ? orderedCategories 
    : categories;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="portfolio-grid" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              grid grid-cols-1 lg:grid-cols-2 gap-6 items-start
              transition-colors duration-200
              ${snapshot.isDraggingOver ? 'bg-slate-800/20 rounded-2xl p-4' : ''}
            `}
            style={{
              minHeight: '200px' // Ensure droppable area is large enough
            }}
          >
            {categoriesToRender.map((category, index) => (
              <Draggable
                key={category.name}
                draggableId={category.name}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                      transition-all duration-200 
                      ${snapshot.isDragging 
                        ? 'rotate-3 scale-105 z-50 shadow-2xl' 
                        : 'hover:scale-[1.01]'
                      }
                      ${snapshot.isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                    `}
                    style={{
                      // Combine react-beautiful-dnd styles with our custom styles
                      ...provided.draggableProps.style,
                      // Ensure proper positioning during drag
                      position: snapshot.isDragging ? 'relative' : 'static'
                    }}
                  >
                    {/* Drag Handle Indicator - Only visible on hover */}
                    <div className="relative group">
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                          ⋮⋮ Drag to reorder
                        </div>
                      </div>
                      
                      <EnhancedCategoryCard
                        category={category}
                        totalValue={totalValue}
                        isExpanded={expandedCards.has(category.name)}
                        onToggleExpand={onToggleExpand}
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggablePortfolioGrid;