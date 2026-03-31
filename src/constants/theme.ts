import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
  type MD3Theme
} from "react-native-paper";

const fontConfig = configureFonts({
  config: {
    displayLarge: { fontFamily: "SpaceGrotesk_700Bold" },
    displayMedium: { fontFamily: "SpaceGrotesk_700Bold" },
    displaySmall: { fontFamily: "SpaceGrotesk_700Bold" },
    headlineLarge: { fontFamily: "SpaceGrotesk_700Bold" },
    headlineMedium: { fontFamily: "SpaceGrotesk_700Bold" },
    headlineSmall: { fontFamily: "SpaceGrotesk_700Bold" },
    titleLarge: { fontFamily: "SpaceGrotesk_700Bold" },
    titleMedium: { fontFamily: "SpaceGrotesk_500Medium" },
    titleSmall: { fontFamily: "SpaceGrotesk_500Medium" },
    bodyLarge: { fontFamily: "SpaceGrotesk_400Regular" },
    bodyMedium: { fontFamily: "SpaceGrotesk_400Regular" },
    bodySmall: { fontFamily: "SpaceGrotesk_400Regular" },
    labelLarge: { fontFamily: "SpaceGrotesk_500Medium" },
    labelMedium: { fontFamily: "SpaceGrotesk_500Medium" },
    labelSmall: { fontFamily: "SpaceGrotesk_500Medium" }
  }
});

export const categoryPalette = [
  "#E9724C",
  "#2A9D8F",
  "#F4A261",
  "#457B9D",
  "#D62839",
  "#6A994E",
  "#7B2CBF",
  "#FF7F50"
];

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 18,
  fonts: fontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#C84C1B",
    onPrimary: "#FFF7F2",
    primaryContainer: "#F9D6C7",
    onPrimaryContainer: "#54210A",
    secondary: "#0B7A6D",
    onSecondary: "#F0FFFC",
    secondaryContainer: "#B9EFE7",
    onSecondaryContainer: "#083C36",
    tertiary: "#7F5AF0",
    background: "#F5F1EB",
    onBackground: "#211F1C",
    surface: "#FFFBF7",
    onSurface: "#211F1C",
    surfaceVariant: "#E7DED5",
    onSurfaceVariant: "#5B524A",
    outline: "#857B73",
    outlineVariant: "#D1C6BD",
    error: "#BA1A1A",
    elevation: {
      level0: "transparent",
      level1: "#FFF5EF",
      level2: "#FDF1EB",
      level3: "#FAECE6",
      level4: "#F7E7E1",
      level5: "#F5E2DC"
    }
  }
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 18,
  fonts: fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#FF9B73",
    onPrimary: "#5A2007",
    primaryContainer: "#7D3410",
    onPrimaryContainer: "#FFDCCF",
    secondary: "#75D6C9",
    onSecondary: "#003731",
    secondaryContainer: "#005047",
    onSecondaryContainer: "#A2F3E8",
    tertiary: "#C9B8FF",
    background: "#11151B",
    onBackground: "#EAE0D5",
    surface: "#171C23",
    onSurface: "#EAE0D5",
    surfaceVariant: "#3A4653",
    onSurfaceVariant: "#BFCCD9",
    outline: "#8A98A8",
    outlineVariant: "#43505E",
    error: "#FFB4AB",
    elevation: {
      level0: "transparent",
      level1: "#1C222C",
      level2: "#202834",
      level3: "#26303C",
      level4: "#2A3442",
      level5: "#2E3947"
    }
  }
};
