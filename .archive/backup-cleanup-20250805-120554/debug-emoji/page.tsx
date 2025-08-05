// app/debug-emoji/page.tsx - Debug page for emoji rendering
'use client';

import { useEffect, useState } from 'react';

export default function DebugEmojiPage() {
  const [emojiSupport, setEmojiSupport] = useState<boolean | null>(null);
  const [userAgent, setUserAgent] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Test emoji support
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '16px Arial';
        const text = '🛡️';
        const metrics = ctx.measureText(text);
        setEmojiSupport(metrics.width > 10);
      }

      // Get user agent
      setUserAgent(navigator.userAgent);
      
      // Check if mobile
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
  }, []);

  const testEmojis = [
    { name: 'Core', emoji: '🛡️', unicode: '1F6E1' },
    { name: 'Growth', emoji: '📈', unicode: '1F4C8' },
    { name: 'Hedge', emoji: '⚖️', unicode: '2696' },
    { name: 'Liquidity', emoji: '💰', unicode: '1F4B0' },
    { name: 'US Flag', emoji: '🇺🇸', unicode: '1F1FA-1F1F8' },
    { name: 'India Flag', emoji: '🇮🇳', unicode: '1F1EE-1F1F3' },
    { name: 'Singapore Flag', emoji: '🇸🇬', unicode: '1F1F8-1F1EC' },
    { name: 'Bitcoin', emoji: '₿', unicode: '20BF' },
    { name: 'Ethereum', emoji: '⟠', unicode: '27E0' },
    { name: 'Gold Medal', emoji: '🥇', unicode: '1F947' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Emoji Debug Page</h1>
        
        {/* Device Info */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Device Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User Agent:</strong>
              <div className="text-gray-400 break-all">{userAgent}</div>
            </div>
            <div>
              <strong>Is Mobile:</strong>
              <div className="text-gray-400">{isMobile ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <strong>Emoji Support:</strong>
              <div className="text-gray-400">
                {emojiSupport === null ? 'Testing...' : emojiSupport ? '✅ Supported' : '❌ Not Supported'}
              </div>
            </div>
            <div>
              <strong>Screen Size:</strong>
              <div className="text-gray-400">
                {typeof window !== 'undefined' ? `${window.screen.width} x ${window.screen.height}` : 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Emoji Test Grid */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Emoji Rendering Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {testEmojis.map((item) => (
              <div key={item.name} className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-400">U+{item.unicode}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Font Family Test */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Font Family Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'var(--font-geist-sans)',
              'Apple Color Emoji',
              'Segoe UI Emoji',
              'Noto Color Emoji',
              'Android Emoji',
              'system-ui'
            ].map((font) => (
              <div key={font} className="bg-gray-700 p-4 rounded">
                <div className="text-sm text-gray-400 mb-2">{font}</div>
                <div style={{ fontFamily: font }} className="text-2xl">
                  🛡️ 📈 ⚖️ 💰 🇺🇸 🇮🇳 🇸🇬 ₿ ⟠ 🥇
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSS Class Test */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">CSS Class Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-400 mb-2">Default (no special CSS)</div>
              <div className="text-2xl">🛡️ 📈 ⚖️ 💰</div>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <div className="text-sm text-gray-400 mb-2">With card-icon class</div>
              <div className="card-icon text-2xl">🛡️ 📈 ⚖️ 💰</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 