// app/test-icons/page.tsx - Test page to diagnose mobile icon display issues
'use client';

import { useEffect } from 'react';

export default function TestIconsPage() {
  useEffect(() => {
    // Populate device information on client side
    if (typeof window !== 'undefined') {
      const userAgentEl = document.getElementById('user-agent');
      const platformEl = document.getElementById('platform');
      const screenSizeEl = document.getElementById('screen-size');
      const viewportEl = document.getElementById('viewport');
      
      if (userAgentEl) userAgentEl.textContent = navigator.userAgent;
      if (platformEl) platformEl.textContent = navigator.platform;
      if (screenSizeEl) screenSizeEl.textContent = `${window.screen.width} x ${window.screen.height}`;
      if (viewportEl) viewportEl.textContent = `${window.innerWidth} x ${window.innerHeight}`;
    }
  }, []);
  const categoryIcons = [
    { name: 'Core', icon: '🛡️', description: 'Shield emoji' },
    { name: 'Growth', icon: '📈', description: 'Chart increasing emoji' },
    { name: 'Hedge', icon: '⚖️', description: 'Balance scale emoji' },
    { name: 'Liquidity', icon: '💰', description: 'Money bag emoji' }
  ];

  const assetIcons = [
    { symbol: 'NVDA', icon: '🇺🇸', description: 'US flag' },
    { symbol: 'GOOG', icon: '🇺🇸', description: 'US flag' },
    { symbol: 'TSLA', icon: '🇺🇸', description: 'US flag' },
    { symbol: 'VUAA', icon: '🇺🇸', description: 'US flag' },
    { symbol: 'INDIA', icon: '🇮🇳', description: 'India flag' },
    { symbol: 'SGD', icon: '🇸🇬', description: 'Singapore flag' },
    { symbol: 'USDC', icon: '💵', description: 'Dollar banknote' },
    { symbol: 'BTC', icon: '₿', description: 'Bitcoin symbol' },
    { symbol: 'WBTC', icon: '₿', description: 'Bitcoin symbol' },
    { symbol: 'GOLD', icon: '🥇', description: 'Gold medal' },
    { symbol: 'ETH', icon: '⟠', description: 'Ethereum symbol' },
    { symbol: 'DEFAULT', icon: '📊', description: 'Bar chart' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mobile Icon Display Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Category Icons */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Category Icons (Portfolio Grid)</h2>
            <div className="space-y-4">
              {categoryIcons.map((item) => (
                <div key={item.name} className="flex items-center gap-4 p-3 bg-gray-700 rounded">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-400">{item.description}</div>
                    <div className="text-xs text-gray-500">Unicode: {item.icon.codePointAt(0)?.toString(16)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Icons */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Asset Icons (Holdings)</h2>
            <div className="space-y-4">
              {assetIcons.map((item) => (
                <div key={item.symbol} className="flex items-center gap-4 p-3 bg-gray-700 rounded">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium">{item.symbol}</div>
                    <div className="text-sm text-gray-400">{item.description}</div>
                    <div className="text-xs text-gray-500">Unicode: {item.icon.codePointAt(0)?.toString(16)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Detection */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Device Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User Agent:</strong>
              <div className="text-gray-400 break-all" id="user-agent">Loading...</div>
            </div>
            <div>
              <strong>Platform:</strong>
              <div className="text-gray-400" id="platform">Loading...</div>
            </div>
            <div>
              <strong>Screen Size:</strong>
              <div className="text-gray-400" id="screen-size">Loading...</div>
            </div>
            <div>
              <strong>Viewport:</strong>
              <div className="text-gray-400" id="viewport">Loading...</div>
            </div>
          </div>
        </div>

        {/* CSS Font Family Test */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Font Family Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['system-ui', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Android Emoji'].map((font) => (
              <div key={font} className="p-4 bg-gray-700 rounded">
                <div className="text-sm text-gray-400 mb-2">{font}</div>
                <div style={{ fontFamily: font }} className="text-2xl">
                  🛡️ 📈 ⚖️ 💰 🇺🇸 🇮🇳 🇸🇬 💵 ₿ 🥇 ⟠ 📊
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 