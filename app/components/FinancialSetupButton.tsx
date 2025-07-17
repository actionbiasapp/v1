// app/components/FinancialSetupButton.tsx
'use client';

import { useState, useEffect } from 'react';
import FinancialSetupModal from './financial-setup/FinancialSetupModal';
import { FinancialProfile, createDefaultFinancialProfile } from '@/app/lib/types/shared';

interface FinancialSetupButtonProps {
  onProfileUpdate?: (profile: FinancialProfile) => void;
}

export default function FinancialSetupButton({ onProfileUpdate }: FinancialSetupButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<FinancialProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing financial profile on component mount
  useEffect(() => {
    loadFinancialProfile();
  }, []);

  const loadFinancialProfile = async () => {
    try {
      setIsLoading(true);
      
      // FIXED: Enable actual API call for data persistence
      const response = await fetch('/api/financial-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // FIXED: Map API response to FinancialProfile interface
          const loadedProfile: FinancialProfile = {
            // Basic financial info
            annualIncome: data.data.income,
            incomeCurrency: 'SGD', // Default
            taxStatus: data.data.taxStatus,
            currentSRSContributions: data.data.srsContributions,
            
            // FI Goals
            fiGoal: data.data.fiTarget,
            fiTargetYear: data.data.fiYear,
            firstMillionTarget: data.data.firstMillionTarget,
            
            // Optional income
            bonusIncome: undefined, // Not in current API
            
            // Portfolio targets (use defaults if not in API)
            coreTarget: 25,
            growthTarget: 55,
            hedgeTarget: 10,
            liquidityTarget: 10,
            rebalanceThreshold: 5,
            
            // Profile management
            profileCompleteness: calculateCompleteness(data.data),
            
            // Auto-optimization preferences
            srsAutoOptimize: true,
            
            // FI preferences  
          };
          
          setCurrentProfile(loadedProfile);
          console.log('✅ Loaded existing financial profile from API:', loadedProfile);
        } else {
          console.log('No saved profile found, using default');
          setCurrentProfile(createDefaultFinancialProfile());
        }
      } else {
        console.log('API error, using default profile');
        setCurrentProfile(createDefaultFinancialProfile());
      }
      
    } catch (error) {
      console.error('Failed to load financial profile:', error);
      setCurrentProfile(createDefaultFinancialProfile());
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Helper function to calculate completeness from API data
  const calculateCompleteness = (data: any): number => {
    let completed = 0;
    const fields = [
      data.income,
      data.taxStatus,
      data.srsContributions !== undefined,
      data.fiTarget,
      data.fiYear
    ];
    
    fields.forEach(field => {
      if (field !== undefined && field !== null && field !== 0) completed++;
    });
    
    return Math.round((completed / fields.length) * 100);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleProfileUpdate = (updatedProfile: FinancialProfile) => {
    setCurrentProfile(updatedProfile);
    onProfileUpdate?.(updatedProfile);
    
    // FIXED: Re-load from API after save to ensure consistency
    setTimeout(() => {
      loadFinancialProfile();
    }, 500);
    
    console.log('✅ Financial profile updated and reloaded:', updatedProfile);
  };

  const getCompletionStatus = () => {
    if (!currentProfile) return { percentage: 0, text: 'Not Started' };
    
    const completeness = currentProfile.profileCompleteness || 0;
    
    if (completeness === 0) return { percentage: 0, text: 'Get Started' };
    if (completeness < 50) return { percentage: completeness, text: `${completeness}% Complete` };
    if (completeness < 100) return { percentage: completeness, text: `${completeness}% Complete` };
    return { percentage: 100, text: 'Complete' };
  };

  const { percentage, text } = getCompletionStatus();
  
  // Responsive button styling - simplified for mobile
  const getButtonStyles = () => {
    if (percentage === 0) {
      return {
        button: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-transparent shadow-md hover:shadow-lg",
        icon: "⚙️"
      };
    } else if (percentage < 100) {
      return {
        button: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-transparent shadow-md hover:shadow-lg",
        icon: "⚠️"
      };
    } else {
      return {
        button: "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-transparent shadow-md hover:shadow-lg",
        icon: "✅"
      };
    }
  };

  const { button: buttonClass, icon } = getButtonStyles();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600/50">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium hidden sm:inline">Loading...</span>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-optimized button with responsive layout */}
      <button
        onClick={handleOpenModal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-lg border transition-all duration-200 font-medium text-sm
          ${buttonClass}
          ${isHovered ? 'scale-105' : ''}
        `}
        title={`Financial Setup - ${text}`}
      >
        {/* Icon */}
        <span className="text-base">{icon}</span>
        
        {/* Main Content - Responsive layout */}
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-medium whitespace-nowrap">
            <span className="hidden sm:inline">Financial Setup</span>
            <span className="sm:hidden">Setup</span>
          </span>
          <span className="text-xs opacity-90 whitespace-nowrap">{text}</span>
        </div>
        
        {/* Progress Indicator - Smaller on mobile, hidden on very small screens */}
        <div className="hidden sm:flex flex-col items-center ml-2 lg:ml-2">
          <div className="w-6 h-6 lg:w-8 lg:h-8 relative">
            {/* Background circle */}
            <svg className="w-6 h-6 lg:w-8 lg:h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="3"
              />
              {/* Progress circle */}
              {percentage > 0 && (
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 14}`}
                  strokeDashoffset={`${2 * Math.PI * 14 * (1 - percentage / 100)}`}
                  className="transition-all duration-500"
                />
              )}
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {percentage}
              </span>
            </div>
          </div>
        </div>
        
        {/* Mobile-only percentage indicator (simple) */}
        <div className="sm:hidden flex items-center">
          <span className="text-xs font-bold text-white bg-white/20 px-1.5 py-0.5 rounded">
            {percentage}
          </span>
        </div>
      </button>

      {/* Financial Setup Modal */}
      <FinancialSetupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onProfileUpdate={handleProfileUpdate}
        initialProfile={currentProfile || undefined}
      />
    </>
  );
}