/**
 * Design Tokens: "Continental" — Graphite + Ink Blue
 * 
 * Premium, editorial feel. Calm graphite canvas with confident blue accent.
 * Linear/Vanta-adjacent. Information-dense but not cluttered.
 */

export const tokens = {
  colors: {
    base: {
      graphite: '#0E1116',
      panel: '#161B22',
      border: '#21262D',
      hover: '#1C2128',
    },
    text: {
      primary: '#E6EAF0',
      secondary: '#8B93A7',
      muted: '#6E7681',
      inverse: '#0E1116',
    },
    accent: {
      blue: '#3B6EF5',
      blueHover: '#2C5AE0',
      blueSubtle: 'rgba(59, 110, 245, 0.1)',
    },
    risk: {
      critical: '#E5484D',
      high: '#F5A623',
      medium: '#E8C547',
      low: '#46A758',
    },
    semantic: {
      success: '#46A758',
      warning: '#F5A623',
      error: '#E5484D',
      info: '#3B6EF5',
    },
    // Light mode tokens (optional, for accessibility toggle later)
    light: {
      base: '#FFFFFF',
      panel: '#F6F8FA',
      border: '#D0D7DE',
      text: '#1F2328',
      textSecondary: '#656D76',
    },
  },
  typography: {
    fontFamily: {
      display: 'var(--font-display)',
      body: 'var(--font-body)',
      mono: 'var(--font-mono)',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  },
  transitions: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

export type Tokens = typeof tokens;
