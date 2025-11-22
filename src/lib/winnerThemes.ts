export type PlaceTheme = {
  label: string;
  gradient: string;
  accent: string;
  text: string;
  glow: string;
  beam: string;
  fireworkColors: string[];
};

const PLACE_THEMES: Record<number, PlaceTheme> = {
  1: {
    label: "1ère Place",
    gradient: "linear-gradient(135deg, #f8c365 0%, #f1aa26 35%, #f8c365 100%)",
    accent: "#f5b74a",
    text: "#2c1600",
    glow: "rgba(248, 195, 101, 0.55)",
    beam: "rgba(248, 195, 101, 0.35)",
    fireworkColors: ["#fff6da", "#f6d579", "#ff6b35"],
  },
  2: {
    label: "2ème Place",
    gradient: "linear-gradient(135deg, #d1e4ff 0%, #96b5ff 35%, #d1e4ff 100%)",
    accent: "#8aaef8",
    text: "#0b1c33",
    glow: "rgba(150, 181, 255, 0.45)",
    beam: "rgba(150, 181, 255, 0.3)",
    fireworkColors: ["#cfe0ff", "#8eb8ff", "#4ecdc4"],
  },
  3: {
    label: "3ème Place",
    gradient: "linear-gradient(135deg, #ffd9c7 0%, #ff9f72 35%, #ffd9c7 100%)",
    accent: "#ff9f72",
    text: "#331103",
    glow: "rgba(255, 159, 114, 0.5)",
    beam: "rgba(255, 159, 114, 0.28)",
    fireworkColors: ["#ffe2d4", "#ffb184", "#ffd83d"],
  },
};

const DEFAULT_THEME: PlaceTheme = {
  label: "Finaliste",
  gradient: "linear-gradient(135deg, #dfe8ff 0%, #c7d7ff 100%)",
  accent: "#9fb4ff",
  text: "#0d1a32",
  glow: "rgba(159, 180, 255, 0.35)",
  beam: "rgba(159, 180, 255, 0.25)",
  fireworkColors: ["#e2edff", "#c3d3ff", "#96aaff"],
};

export const getPlaceTheme = (place: number): PlaceTheme => {
  return PLACE_THEMES[place] ?? DEFAULT_THEME;
};
