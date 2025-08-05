'use client';

import { getAssetIcon, getCategoryIcon, getCategoryInfo } from '@/app/lib/iconUtils';

export default function TestIconsPage() {
  const testAssets = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOG', name: 'Alphabet Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'GOLD', name: 'Gold' },
    { symbol: 'VUAA', name: 'Vanguard S&P 500 ETF' },
    { symbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: 'HIMS', name: 'Hims & Hers Health' },
    { symbol: 'IREN', name: 'Iris Energy Limited' },
    { symbol: 'CASH', name: 'Cash' },
    { symbol: 'UNKNOWN', name: 'Unknown Stock' }
  ];

  const testCategories = ['Core', 'Growth', 'Hedge', 'Liquidity'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🎨 New Icon System Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Asset Icons */}
          <div className="bg-glass-primary rounded-xl p-6 border border-glass-border">
            <h2 className="text-xl font-semibold text-white mb-4">📈 Asset Icons</h2>
            <div className="space-y-3">
              {testAssets.map((asset) => (
                <div key={asset.symbol} className="flex items-center gap-3 p-3 bg-glass-secondary rounded-lg">
                  <span className="text-2xl">{getAssetIcon(asset.symbol, asset.name)}</span>
                  <div>
                    <div className="text-white font-medium">{asset.symbol}</div>
                    <div className="text-text-secondary text-sm">{asset.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Icons */}
          <div className="bg-glass-primary rounded-xl p-6 border border-glass-border">
            <h2 className="text-xl font-semibold text-white mb-4">🏷️ Category Icons</h2>
            <div className="space-y-3">
              {testCategories.map((category) => {
                const info = getCategoryInfo(category);
                return (
                  <div key={category} className="flex items-center gap-3 p-3 bg-glass-secondary rounded-lg">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <div>
                      <div className="text-white font-medium">{info.name}</div>
                      <div className="text-text-secondary text-sm">{info.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Design Principles */}
        <div className="mt-8 bg-glass-primary rounded-xl p-6 border border-glass-border">
          <h2 className="text-xl font-semibold text-white mb-4">✨ Design Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-glass-secondary rounded-lg">
              <div className="text-accent-primary font-medium mb-1">🎯 Intuitive</div>
              <div className="text-text-secondary">Crypto = ₿, Tech = 💻, Gold = 🥇</div>
            </div>
            <div className="p-3 bg-glass-secondary rounded-lg">
              <div className="text-accent-primary font-medium mb-1">⚡ Lean</div>
              <div className="text-text-secondary">Simple emoji system, no over-engineering</div>
            </div>
            <div className="p-3 bg-glass-secondary rounded-lg">
              <div className="text-accent-primary font-medium mb-1">🎨 Consistent</div>
              <div className="text-text-secondary">Unified categorization across the app</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 