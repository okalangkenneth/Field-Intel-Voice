// Typography System - Inter Font
// Mobile-first responsive typography

export const fontFamily = {
  primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
  monospace: "'Monaco', 'Courier New', monospace",
};

export const fontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

export const typography = {
  // Display - Hero sections
  display: {
    fontSize: '28px',
    fontWeight: fontWeight.bold,
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
    fontFamily: fontFamily.primary,
  },

  // H1 - Page titles
  h1: {
    fontSize: '24px',
    fontWeight: fontWeight.bold,
    lineHeight: '1.2',
    fontFamily: fontFamily.primary,
  },

  // H2 - Section headings
  h2: {
    fontSize: '20px',
    fontWeight: fontWeight.semibold,
    lineHeight: '1.3',
    fontFamily: fontFamily.primary,
  },

  // H3 - Subsection headings
  h3: {
    fontSize: '18px',
    fontWeight: fontWeight.semibold,
    lineHeight: '1.4',
    fontFamily: fontFamily.primary,
  },

  // H4 - Card titles
  h4: {
    fontSize: '18px',
    fontWeight: fontWeight.semibold,
    lineHeight: '1.4',
    fontFamily: fontFamily.primary,
  },

  // Body - Default text
  body: {
    fontSize: '16px',
    fontWeight: fontWeight.normal,
    lineHeight: '1.6',
    fontFamily: fontFamily.primary,
  },

  // Body large
  bodyLarge: {
    fontSize: '18px',
    fontWeight: fontWeight.normal,
    lineHeight: '1.6',
    fontFamily: fontFamily.primary,
  },

  // Body small
  bodySmall: {
    fontSize: '14px',
    fontWeight: fontWeight.normal,
    lineHeight: '1.5',
    fontFamily: fontFamily.primary,
  },

  // Caption
  caption: {
    fontSize: '12px',
    fontWeight: fontWeight.normal,
    lineHeight: '1.4',
    fontFamily: fontFamily.primary,
  },

  // Numbers (for financial amounts, metrics)
  number: {
    fontSize: '24px',
    fontWeight: fontWeight.semibold,
    letterSpacing: '-0.01em',
    fontFamily: fontFamily.primary,
  },

  numberLarge: {
    fontSize: '32px',
    fontWeight: fontWeight.bold,
    letterSpacing: '-0.02em',
    fontFamily: fontFamily.primary,
  },

  // Buttons
  button: {
    fontSize: '16px',
    fontWeight: fontWeight.medium,
    letterSpacing: '0.01em',
    fontFamily: fontFamily.primary,
  },

  buttonSmall: {
    fontSize: '14px',
    fontWeight: fontWeight.medium,
    letterSpacing: '0.01em',
    fontFamily: fontFamily.primary,
  },

  // Forms
  label: {
    fontSize: '14px',
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.primary,
  },

  input: {
    fontSize: '16px',
    fontWeight: fontWeight.normal,
    fontFamily: fontFamily.primary,
  },
};
