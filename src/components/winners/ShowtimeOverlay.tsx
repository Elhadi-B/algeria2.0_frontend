import type { CSSProperties } from "react";
import type { RankingItem } from "@/lib/types";
import type { PlaceTheme } from "@/lib/winnerThemes";

const classNames = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export type ShowcasePhase = "carousel" | "align" | "spotlight" | "celebration";

export type WinnersShowcaseOverlayProps = {
  visible: boolean;
  participants: RankingItem[];
  winners: RankingItem[];
  rotation: number;
  phase: ShowcasePhase;
  theme: PlaceTheme;
  showHighlights?: boolean;
};

export const WinnersShowcaseOverlay = ({
  visible,
  participants,
  winners,
  rotation,
  phase,
  theme,
  showHighlights = false,
}: WinnersShowcaseOverlayProps) => {
  if (!visible) {
    return null;
  }

  const winnerIds = new Set(winners.map((team) => team.num_equipe));
  const angleStep = participants.length > 0 ? 360 / participants.length : 0;
  const showCenterStage = showHighlights && phase !== "carousel";
  const shouldCenterHero = showCenterStage && (phase === "spotlight" || phase === "celebration");

  const rootStyle = {
    "--winner-accent": theme.accent,
    "--winner-gradient": theme.gradient,
    "--winner-text": theme.text,
    "--winner-glow": theme.glow,
    "--winner-beam": theme.beam,
  } as CSSProperties;

  return (
    <div className={classNames("winner-overlay", `winner-overlay--${phase}`)} style={rootStyle}>
      <div className="winner-overlay__backdrop" />
      <div className="winner-overlay__spotlight" />

      {showCenterStage && <div className="winner-overlay__flare" />}

      <div className="winner-orbit">
        {participants.map((team, index) => {
          const angle = angleStep * index;
          const isWinner = winnerIds.has(team.num_equipe);
          const winnerIndex = winners.findIndex((w) => w.num_equipe === team.num_equipe);
          const centerOffset = shouldCenterHero && winnerIndex !== -1
            ? (winnerIndex - (winners.length - 1) / 2) * 180
            : 0;

          const cardStyle = {
            "--item-angle": `${angle}deg`,
            "--orbit-rotation": `${rotation}deg`,
            "--center-offset": `${centerOffset}px`,
          } as CSSProperties;

          return (
            <div
              key={team.num_equipe}
              className={classNames(
                "winner-orbit__card",
                isWinner && showHighlights && "winner-orbit__card--winner",
                isWinner && shouldCenterHero && "winner-orbit__card--center",
                isWinner && showHighlights && !shouldCenterHero && "winner-orbit__card--hero"
              )}
              style={cardStyle}
            >
              <span className="winner-orbit__name">{team.nom_equipe}</span>
            </div>
          );
        })}
      </div>

      {phase === "celebration" && <Fireworks colors={theme.fireworkColors} />}
    </div>
  );
};

const Fireworks = ({ colors }: { colors: string[] }) => {
  const bursts = Array.from({ length: 12 });
  return (
    <div className="winner-fireworks">
      {bursts.map((_, index) => (
        <span
          key={index}
          className={classNames("winner-firework", index % 2 === 0 ? "winner-firework--left" : "winner-firework--right")}
          style={{ "--firework-color": colors[index % colors.length] } as CSSProperties}
        />
      ))}
    </div>
  );
};
