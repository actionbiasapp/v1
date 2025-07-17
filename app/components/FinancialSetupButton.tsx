// app/components/FinancialSetupButton.tsx - Add allocation editor integration
'use client';

import { useState, useEffect } from 'react';
import FinancialSetupModal from './financial-setup/FinancialSetupModal';
import AllocationTargetEditor from './AllocationTargetEditor';
import { FinancialProfile, createDefaultFinancialProfile } from '@/app/lib/types/shared';

interface FinancialSetupButtonProps {
  onProfileUpdate?: (profile: FinancialProfile) => void;
}

export default function FinancialSetupButton({ onProfileUpdate }: FinancialSetupButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllocationEditorOpen, setIsAllocationEditorOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<FinancialProfile | null>(null);
  const [allocationTargets, setAllocationTargets] = useState({
    core: 25,
    growth: 55,
    hedge: 10,
    liquidity: 10,
    rebalanceThreshold: 5
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load existing financial profile on component mount
  useEffect(() => {
    loadFinancialProfile();
  }, []);

  const loadFinancialProfile = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/financial-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Map API response to FinancialProfile interface
          const loadedProfile: FinancialProfile = {
            annualIncome: data.data.income,
            incomeCurrency: 'SGD',
            taxStatus: data.data.taxStatus,
            currentSRSContributions: data.data.srsContributions,
            fiGoal: data.data.fiTarget,
            fiTargetYear: data.data.fiYear,
            firstMillionTarget: data.data.firstMillionTarget,
            coreTarget: data.allocationTargets?.core || 25,
            growthTarget: data.allocationTargets?.growth || 55,
            hedgeTarget: data.allocationTargets?.hedge || 10,
            liquidityTarget: data.allocationTargets?.liquidity || 10,
            rebalanceThreshold: data.allocationTargets?.rebalanceThreshold || 5,
            profileCompleteness: calculateCompleteness(data.data),
            srsAutoOptimize: true,
          };
          
          setCurrentProfile(loadedProfile);
          
          // Set allocation targets
          if (data.allocationTargets) {
            setAllocationTargets(data.allocationTargets);
          }
          
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

  const handleOpenAllocationEditor = () => {
    setIsAllocationEditorOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleProfileUpdate = (updatedProfile: FinancialProfile) => {
    setCurrentProfile(updatedProfile);
    onProfileUpdate?.(updatedProfile);
    
    setTimeout(() => {
      loadFinancialProfile();
    }, 500);
    
    console.log('✅ Financial profile updated and reloaded:', updatedProfile);
  };

  const handleAllocationTargetsUpdate = (newTargets: typeof allocationTargets) => {
    setAllocationTargets(newTargets);
    // Update current profile with new targets
    if (currentProfile) {
      const updatedProfile = {
        ...currentProfile,
        coreTarget: newTargets.core,
        growthTarget: newTargets.growth,
        hedgeTarget: newTargets.hedge,
        liquidityTarget: newTargets.liquidity,
        rebalanceThreshold: newTargets.rebalanceThreshold
      };
      setCurrentProfile(updatedProfile);
      onProfileUpdate?.(updatedProfile);
    }
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
      {/* Dropdown Button */}
      <div className="relative">
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
          <span className="text-base">{icon}</span>
          
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium whitespace-nowrap">
              <span className="hidden sm:inline">Financial Setup</span>
              <span className="sm:hidden">Setup</span>
            </span>
            <span className="text-xs opacity-90 whitespace-nowrap">{text}</span>
          </div>
          
          <div className="hidden sm:flex flex-col items-center ml-2 lg:ml-2">
            <div className="w-6 h-6 lg:w-8 lg:h-8 relative">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="3"
                />
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
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {percentage}
                </span>
              </div>
            </div>
          </div>
          
          <div className="sm:hidden flex items-center">
            <span className="text-xs font-bold text-white bg-white/20 px-1.5 py-0.5 rounded">
              {percentage}
            </span>
          </div>
        </button>
      </div>

      {/* Financial Setup Modal */}
      <FinancialSetupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onProfileUpdate={handleProfileUpdate}
        initialProfile={currentProfile || undefined}
      />

      {/* Allocation Target Editor Modal */}
      <AllocationTargetEditor
        isOpen={isAllocationEditorOpen}
        onClose={() => setIsAllocationEditorOpen(false)}
        currentTargets={allocationTargets}
        onTargetsUpdate={handleAllocationTargetsUpdate}
      />
    </>
  );
}