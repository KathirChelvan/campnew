// constants/Colors.js
const LIGHT_THEME = {
  PRIMARY: "#E8B20E",
  GRAY: "#A9A9A9",
  RED: "#ff0000",
  BLUE: "#3366ff",
  BLUEGREEN: "#006C72",
  WHITE: "#fff",
  PRIMARY_LIGHT: '#E6F2FF',
  BLACK: "#000000",
  LIGHTGREY: "#d7dbdd",
  HIGHYELLOW: "#f7dc6f",
  
  // Theme specific
  BACKGROUND: "#fff",
  TEXT: "#000000",
  CARD_BACKGROUND: "#f5f5f5",
  MENU_BACKGROUND: "#f5f5f5",
  ADMIN_BACKGROUND: "#F0F5FF",
};

const DARK_THEME = {
  PRIMARY: "#F0C030", // Slightly brighter yellow for dark mode
  GRAY: "#C0C0C0", // Lighter gray for better visibility
  RED: "#ff4040", // Brighter red
  BLUE: "#5580ff", // Brighter blue
  BLUEGREEN: "#1A9DA6", // Brighter bluegreen
  WHITE: "#121212", // Dark background instead of white
  BLACK: "#FFFFFF", // White text instead of black
  LIGHTGREY: "#383838", // Darker grey
  HIGHYELLOW: "#fce282", // Brighter yellow
  
  // Theme specific
  BACKGROUND: "#121212", // Dark background
  TEXT: "#FFFFFF", // White text
  CARD_BACKGROUND: "#1E1E1E", // Dark card background
  MENU_BACKGROUND: "#2C2C2C", // Dark menu background
  ADMIN_BACKGROUND: "#25344D", // Dark admin panel background
};

export default {
  ...LIGHT_THEME,
  light: LIGHT_THEME,
  dark: DARK_THEME,
  
  // Function to get current theme colors
  getTheme: (isDark = false) => {
    return isDark ? DARK_THEME : LIGHT_THEME;
  }
};