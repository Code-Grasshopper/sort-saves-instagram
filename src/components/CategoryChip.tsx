import { Chip } from "react-native-paper";

import type { Category } from "@/types/models";

type CategoryChipProps = {
  category: Category;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
};

function getTextColor(color: string) {
  const hex = color.replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.65 ? "#1F1B16" : "#FFFFFF";
}

export function CategoryChip({
  category,
  selected = false,
  onPress,
  compact = false
}: CategoryChipProps) {
  const backgroundColor = selected ? category.color : `${category.color}22`;
  const textColor = selected ? getTextColor(category.color) : category.color;

  return (
    <Chip
      compact={compact}
      onPress={onPress}
      mode={selected ? "flat" : "outlined"}
      style={{ backgroundColor, borderColor: `${category.color}88`, borderRadius: compact ? 12 : 14 }}
      textStyle={{ color: textColor }}
    >
      {`${category.emoji} ${category.name}`}
    </Chip>
  );
}
