// app/components/FinancialSetupButton.tsx - Add allocation editor integration
'use client';

import { useState, useEffect } from 'react';
import FinancialSetupModal from './financial-setup/FinancialSetupModal';
import { FinancialProfile, createDefaultFinancialProfile } from '@/app/lib/types/shared';

interface FinancialSetupButtonProps {
  onProfileUpdate?: (profile: FinancialProfile) => void;
  portfolioTotal?: number;
  allocationTargets?: {
    core: number;
    growth: number;
    hedge: number;
    liquidity: number;
    rebalanceThreshold: number;
  };
}

export default function FinancialSetupButton({ 
  onProfileUpdate, 
  portfolioTotal,
  allocationTargets
}: FinancialSetupButtonProps) {
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
      
      const response = await fetch('/api/financial-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) { // Use 'profile' from API
          const loadedProfile: FinancialProfile = {
            ...createDefaultFinancialProfile(), // Start with defaults
            ...data.profile, // Override with API data
          };
          
          setCurrentProfile(loadedProfile);
          
          if (data.allocationTargets) {
            // setAllocationTargets(data.allocationTargets); // This line is removed
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

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleOpenAllocationEditor = () => {
    // setIsAllocationEditorOpen(true); // This line is removed
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Refresh data when modal is closed
    if (onProfileUpdate) {
      onProfileUpdate(currentProfile as FinancialProfile);
    }
  };

  const handleProfileUpdate = (updatedProfile: FinancialProfile) => {
    setCurrentProfile(updatedProfile);
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
    console.log('✅ Financial profile updated:', updatedProfile);
  };

  const buttonClass = "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-transparent shadow-md hover:shadow-lg";
  const icon = "⚙️";
  
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
            flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg border transition-all duration-200 font-medium text-sm
            ${buttonClass}
            ${isHovered ? 'scale-105' : ''}
          `}
          title={`Financial Setup`}
        >
          <span className="text-base">{icon}</span>
          
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium whitespace-nowrap">
              <span className="hidden sm:inline">Financial Setup</span>
              <span className="sm:hidden">Setup</span>
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
        portfolioTotal={portfolioTotal}
        allocationTargets={allocationTargets}
      />
    </>
  );
}