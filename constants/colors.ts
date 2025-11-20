/**
 * Color constants for the app
 * Replaces the broken react-native/Libraries/NewAppScreen import
 */
export const Colors = {
  // Light theme colors
  lighter: "#F3F3F3",
  light: "#DAE1E7",
  white: "#FFFFFF",

  // Dark theme colors
  black: "#000000",
  dark: "#1E1E1E",
  darker: "#121212",

  // Primary colors
  primary: "#007AFF",
  secondary: "#5856D6",

  // Semantic colors
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",

  // Text colors
  text: {
    light: "#000000",
    dark: "#FFFFFF",
    secondary: "#8E8E93",
  },

  // Background colors
  background: {
    light: "#FFFFFF",
    dark: "#000000",
    card: {
      light: "#F5F5F5",
      dark: "#1E1E1E",
    },
  },

  // Input colors
  input: {
    background: {
      light: "#FFFFFF",
      dark: "#636363",
    },
    border: {
      light: "#E5E5EA",
      dark: "#48484A",
    },
  },
};

export type ThemeColors = typeof Colors;
