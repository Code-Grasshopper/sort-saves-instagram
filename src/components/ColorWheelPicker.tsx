import { memo, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

type ColorWheelPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

function getTextColor(color: string) {
  const hex = color.replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.65 ? "#1F1B16" : "#FFFFFF";
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hueSegment = hue / 60;
  const x = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSegment >= 0 && hueSegment < 1) {
    red = chroma;
    green = x;
  } else if (hueSegment < 2) {
    red = x;
    green = chroma;
  } else if (hueSegment < 3) {
    green = chroma;
    blue = x;
  } else if (hueSegment < 4) {
    green = x;
    blue = chroma;
  } else if (hueSegment < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  const match = l - chroma / 2;
  const toHex = (channel: number) => Math.round((channel + match) * 255).toString(16).padStart(2, "0");

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase();
}

export const ColorWheelPicker = memo(function ColorWheelPicker({
  value,
  onChange
}: ColorWheelPickerProps) {
  const swatches = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
        return {
          color: hslToHex(index * 15, 82, 56),
          angle
        };
      }),
    []
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.wheel}>
        {swatches.map((swatch) => {
          const size = swatch.color === value ? 30 : 24;
          const center = 110;
          const radius = 78;
          const left = center + Math.cos(swatch.angle) * radius - size / 2;
          const top = center + Math.sin(swatch.angle) * radius - size / 2;

          return (
            <Pressable
              key={swatch.color}
              accessibilityRole="button"
              onPress={() => onChange(swatch.color)}
              style={[
                styles.swatch,
                {
                  width: size,
                  height: size,
                  left,
                  top,
                  backgroundColor: swatch.color,
                  borderWidth: swatch.color === value ? 3 : 1
                }
              ]}
            />
          );
        })}

        <View style={[styles.centerPreview, { backgroundColor: value }]}>
          <Text variant="labelLarge" style={[styles.centerPreviewText, { color: getTextColor(value) }]}>
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center"
  },
  wheel: {
    width: 220,
    height: 220,
    position: "relative",
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "#00000012"
  },
  swatch: {
    position: "absolute",
    borderRadius: 999,
    borderColor: "#FFFFFF"
  },
  centerPreview: {
    position: "absolute",
    left: 57,
    top: 57,
    width: 106,
    height: 106,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#00000014"
  },
  centerPreviewText: {
    textAlign: "center"
  }
});
