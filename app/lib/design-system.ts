// app/lib/design-system.ts - Centralized design system for consistent UI

export const BUTTON_VARIANTS = {
  primary: {
    base: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-transparent shadow-md hover:shadow-lg transition-all duration-200 font-medium",
    size: {
      sm: "px-3 py-2 text-sm rounded-lg",
      md: "px-4 py-2 text-sm rounded-lg", 
      lg: "px-6 py-3 text-base rounded-lg"
    }
  },
  secondary: {
    base: "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium",
    size: {
      sm: "px-3 py-2 text-sm rounded-lg",
      md: "px-4 py-2 text-sm rounded-lg",
      lg: "px-6 py-3 text-base rounded-lg"
    }
  },
  ghost: {
    base: "bg-transparent hover:bg-gray-700/50 text-gray-300 hover:text-white border border-transparent transition-all duration-200 font-medium",
    size: {
      sm: "px-3 py-2 text-sm rounded-lg",
      md: "px-4 py-2 text-sm rounded-lg",
      lg: "px-6 py-3 text-base rounded-lg"
    }
  }
} as const;

export const CARD_STYLES = {
  base: "bg-gray-800 rounded-xl border border-gray-700",
  interactive: "bg-gray-800 hover:bg-gray-750 rounded-xl border border-gray-700 transition-colors duration-200",
  elevated: "bg-gray-800 rounded-xl border border-gray-700 shadow-lg"
} as const;

export const INPUT_STYLES = {
  base: "bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
} as const;

export const BADGE_STYLES = {
  success: "bg-green-600/20 text-green-400 border border-green-600/30",
  warning: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30", 
  error: "bg-red-600/20 text-red-400 border border-red-600/30",
  info: "bg-blue-600/20 text-blue-400 border border-blue-600/30"
} as const;

// Consistent spacing scale
export const SPACING = {
  xs: "0.25rem", // 4px
  sm: "0.5rem",  // 8px
  md: "1rem",    // 16px
  lg: "1.5rem",  // 24px
  xl: "2rem",    // 32px
  "2xl": "3rem"  // 48px
} as const;

// Consistent border radius
export const BORDER_RADIUS = {
  sm: "0.25rem", // 4px
  md: "0.5rem",  // 8px
  lg: "0.75rem", // 12px
  xl: "1rem"     // 16px
} as const;

// Color palette
export const COLORS = {
  primary: {
    50: "#eef2ff",
    100: "#e0e7ff", 
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1", // indigo-500
    600: "#4f46e5", // indigo-600
    700: "#4338ca", // indigo-700
    800: "#3730a3", // indigo-800
    900: "#312e81"
  },
  purple: {
    500: "#8b5cf6",
    600: "#7c3aed", // purple-600
    700: "#6d28d9"
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937", // gray-800
    900: "#111827"
  }
} as const;

// Typography scale
export const TYPOGRAPHY = {
  xs: "text-xs",
  sm: "text-sm", 
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  "6xl": "text-6xl"
} as const;

// Utility function to build consistent button classes
export function buildButtonClass(
  variant: keyof typeof BUTTON_VARIANTS = 'primary',
  size: keyof typeof BUTTON_VARIANTS.primary.size = 'md',
  additionalClasses: string = ''
): string {
  const variantClasses = BUTTON_VARIANTS[variant];
  const sizeClasses = variantClasses.size[size];
  
  return `${variantClasses.base} ${sizeClasses} ${additionalClasses}`.trim();
}

// Utility function to build consistent card classes
export function buildCardClass(
  style: keyof typeof CARD_STYLES = 'base',
  additionalClasses: string = ''
): string {
  return `${CARD_STYLES[style]} ${additionalClasses}`.trim();
} 