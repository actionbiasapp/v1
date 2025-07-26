// app/lib/iconUtils.ts - Icon utilities with fallback support
import React from 'react';

// SVG icon components for better cross-platform compatibility
export const CategoryIcons = {
  Core: {
    emoji: '🛡️',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l6 2.67v4.15c0 4.52-3.03 8.69-6 9.82-2.97-1.13-6-5.3-6-9.82V5.85l6-2.67z"/>
      </svg>
    )
  },
  Growth: {
    emoji: '📈',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
      </svg>
    )
  },
  Hedge: {
    emoji: '⚖️',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    )
  },
  Liquidity: {
    emoji: '💰',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
      </svg>
    )
  }
};

export const AssetIcons = {
  NVDA: { emoji: '🇺🇸', svg: <span>🇺🇸</span> },
  GOOG: { emoji: '🇺🇸', svg: <span>🇺🇸</span> },
  TSLA: { emoji: '🇺🇸', svg: <span>🇺🇸</span> },
  VUAA: { emoji: '🇺🇸', svg: <span>🇺🇸</span> },
  INDIA: { emoji: '🇮🇳', svg: <span>🇮🇳</span> },
  SGD: { emoji: '🇸🇬', svg: <span>🇸🇬</span> },
  USDC: { emoji: '💵', svg: <span>💵</span> },
  BTC: { emoji: '₿', svg: <span>₿</span> },
  WBTC: { emoji: '₿', svg: <span>₿</span> },
  GOLD: { emoji: '🥇', svg: <span>🥇</span> },
  ETH: { emoji: '⟠', svg: <span>⟠</span> },
  DEFAULT: { emoji: '📊', svg: <span>📊</span> }
};

// Utility function to get icon with fallback
export function getIconWithFallback(
  type: 'category' | 'asset',
  name: string,
  useSvg: boolean = false
): { emoji: string; svg: React.ReactNode } {
  if (type === 'category') {
    return CategoryIcons[name as keyof typeof CategoryIcons] || CategoryIcons.Core;
  } else {
    return AssetIcons[name as keyof typeof AssetIcons] || AssetIcons.DEFAULT;
  }
}

// Hook to detect emoji support
export function useEmojiSupport(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Simple emoji support detection
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  ctx.font = '16px Arial';
  const text = '🛡️';
  const metrics = ctx.measureText(text);
  
  // If the width is very small, emoji might not be supported
  return metrics.width > 10;
} 