
export const PASTEL_COLORS = [
  "#A2D2FF", // Light Blue
  "#BDE0FE", // Lighter Blue
  "#FFC8DD", // Pink
  "#FFAFCC", // Lighter Pink
  "#CDB4DB", // Lavender
  "#B4A0E5", // Purple
  "#A8D8EA", // Sky Blue
  "#AFE1AF", // Pale Green
  "#F6EAC2", // Beige
  "#F4CFCF", // Light Coral
];

export const generatePastelColor = (index: number): string => {
  return PASTEL_COLORS[index % PASTEL_COLORS.length];
};
