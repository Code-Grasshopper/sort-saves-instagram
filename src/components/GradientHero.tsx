import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

type GradientHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
};

export function GradientHero({ eyebrow, title, subtitle }: GradientHeroProps) {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={
        theme.dark ? ["#2C3A4D", "#151B23", "#083C36"] : ["#F4A261", "#E9724C", "#2A9D8F"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.glow} />
      {eyebrow ? (
        <Text variant="labelLarge" style={styles.eyebrow}>
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="headlineMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        {subtitle}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 22,
    overflow: "hidden",
    minHeight: 164
  },
  glow: {
    position: "absolute",
    right: -30,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)"
  },
  eyebrow: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2
  },
  title: {
    color: "#FFFFFF",
    marginBottom: 10
  },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    maxWidth: "90%"
  }
});
