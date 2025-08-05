'use client';

import React from 'react';

export function PortfolioSkeleton() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4 pt-20">
        {/* Portfolio Status Metrics Skeleton */}
        <div className="bg-gray-800 rounded-lg p-4 lg:p-6 mb-6 border border-gray-700">
          <div className="grid grid-cols-3 lg:flex lg:gap-8 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col">
                <div className="w-24 h-8 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="w-full h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="w-48 h-3 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Net Worth Tracker Skeleton */}
        <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="w-32 h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="w-48 h-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-80 bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Holdings Section Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-20 h-6 bg-gray-700 rounded animate-pulse"></div>
            <div className="w-24 h-8 bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          {/* Radial Allocation Skeleton */}
          <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="w-32 h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="w-48 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-80 bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Holdings Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-16 h-5 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-20 h-5 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="w-24 h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="w-32 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Section Skeleton */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="w-32 h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="w-48 h-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-4">
                <div className="w-full h-4 bg-gray-600 rounded animate-pulse mb-2"></div>
                <div className="w-3/4 h-3 bg-gray-600 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 