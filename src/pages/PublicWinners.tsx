import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Sparkles } from "lucide-react";
import { WinnersShowcaseOverlay, type ShowcasePhase } from "@/components/winners/ShowtimeOverlay";
import { getPlaceTheme, type PlaceTheme } from "@/lib/winnerThemes";
import { computeTopThree } from "@/lib/topThree";
import { publicGetRanking, createWinnersWebSocket } from "@/lib/api";
import type { RankingItem } from "@/lib/types";

type AnimationPhase = "idle" | ShowcasePhase;

type OverlayState = {
  place: number;
  winners: RankingItem[];
  participants: RankingItem[];
  theme: PlaceTheme;
};

const CAROUSEL_DURATION_MS = 4600;
const CAROUSEL_INITIAL_SPEED = 420;
const CAROUSEL_FINAL_SPEED = 40;

const PublicWinners = () => {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedPlace, setRevealedPlace] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null);
  const [rotation, setRotation] = useState(0);
  const [revealedTeams, setRevealedTeams] = useState<RankingItem[]>([]);

  const rotationRef = useRef(0);
  const carouselStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const handleAnnouncementRef = useRef<(payload: any) => void>(() => {});

  useEffect(() => {
    if (!isAnimating || !overlayState || animationPhase !== "carousel") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let last = performance.now();
    const tick = (time: number) => {
      const delta = time - last;
      last = time;

      if (!carouselStartRef.current) {
        carouselStartRef.current = time;
      }
      const elapsed = Math.max(0, time - carouselStartRef.current);
      const progress = Math.min(1, elapsed / CAROUSEL_DURATION_MS);
      const currentSpeed = getCarouselSpeed(progress);
      rotationRef.current += (currentSpeed * delta) / 1000;
      setRotation(rotationRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [animationPhase, isAnimating, overlayState]);

  useEffect(() => {
    if (animationPhase !== "spotlight" || !overlayState) {
      return;
    }
    scheduleTimer(() => setAnimationPhase("celebration"), 900);
  }, [animationPhase, overlayState]);

  useEffect(() => {
    if (animationPhase !== "celebration" || !overlayState) {
      return;
    }
    scheduleTimer(() => finalizeReveal(), 2600);
  }, [animationPhase, overlayState]);

  const topThree = useMemo(() => computeTopThree(rankings), [rankings]);

  const pickWinnersForPlace = useCallback((targetPlace: number) => {
    if (targetPlace === 1) {
      return topThree.first;
    }
    if (targetPlace === 2) {
      return topThree.second;
    }
    if (targetPlace === 3) {
      return topThree.third;
    }
    return [];
  }, [topThree]);

  const buildParticipants = useCallback((winners: RankingItem[]) => {
    const desiredCount = Math.min(rankings.length, 12);
    const unique = new Map<string, RankingItem>();
    revealedTeams.forEach((team) => unique.set(team.num_equipe, team));
    winners.forEach((team) => unique.set(team.num_equipe, team));

    for (const team of rankings) {
      if (unique.size >= desiredCount) {
        break;
      }
      if (!unique.has(team.num_equipe)) {
        unique.set(team.num_equipe, team);
      }
    }

    return Array.from(unique.values());
  }, [rankings, revealedTeams]);

  const startShowcase = useCallback((targetPlace: number) => {
    const winners = pickWinnersForPlace(targetPlace);
    if (winners.length === 0) {
      setRevealedPlace(targetPlace);
      return;
    }

    setRevealedPlace(null);
    const participants = buildParticipants(winners);
    const theme = getPlaceTheme(targetPlace);

    setOverlayState({ place: targetPlace, winners, participants, theme });
    rotationRef.current = 0;
    setRotation(0);
    setAnimationPhase("carousel");
    setIsAnimating(true);
    carouselStartRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();

    scheduleTimer(() => {
      setAnimationPhase("spotlight");
    }, CAROUSEL_DURATION_MS);
  }, [buildParticipants, pickWinnersForPlace]);

  const clearScheduledTimers = () => {
    if (typeof window !== "undefined") {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    }
    timersRef.current = [];
  };

  const scheduleTimer = (callback: () => void, delay: number) => {
    if (typeof window === "undefined") {
      return;
    }
    const id = window.setTimeout(() => {
      callback();
      timersRef.current = timersRef.current.filter((timer) => timer !== id);
    }, delay);
    timersRef.current.push(id);
  };

  const resetAnimation = useCallback((clearHistory = false) => {
    clearScheduledTimers();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    rotationRef.current = 0;
    carouselStartRef.current = 0;
    setRotation(0);
    setOverlayState(null);
    setIsAnimating(false);
    setAnimationPhase("idle");

    if (clearHistory) {
      setRevealedPlace(null);
      setRevealedTeams([]);
    }
  }, []);

  const finalizeReveal = () => {
    if (!overlayState) {
      return;
    }

    setRotation(rotationRef.current);
    carouselStartRef.current = 0;
    setRevealedPlace(overlayState.place);
    setIsAnimating(false);
    setAnimationPhase("idle");
    setOverlayState(null);

    setRevealedTeams((prev) => {
      const unique = new Map(prev.map((team) => [team.num_equipe, team] as const));
      overlayState.winners.forEach((team) => unique.set(team.num_equipe, team));
      return Array.from(unique.values());
    });
  };

  useEffect(() => {
    handleAnnouncementRef.current = (data: any) => {
      if (data.type !== 'winner_announcement') {
        return;
      }

      if (data.action === 'start_animation') {
        startShowcase(data.place);
      } else if (data.action === 'reset') {
        resetAnimation(true);
      } else if (data.action === 'reveal') {
        resetAnimation(false);
        const winners = pickWinnersForPlace(data.place);
        if (winners.length > 0) {
          setRevealedTeams((prev) => {
            const unique = new Map(prev.map((team) => [team.num_equipe, team] as const));
            winners.forEach((team) => unique.set(team.num_equipe, team));
            return Array.from(unique.values());
          });
        }
        setRevealedPlace(data.place);
      }
    };
  }, [pickWinnersForPlace, resetAnimation, startShowcase]);

  useEffect(() => {
    loadRankings();
    const socket = createWinnersWebSocket(
      (data: any) => handleAnnouncementRef.current(data),
      undefined,
      (error) => {
        console.error("Public Winners WebSocket error:", error);
      }
    );
    wsRef.current = socket;

    return () => {
      socket?.close();
      clearScheduledTimers();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const loadRankings = async () => {
    setIsLoading(true);
    try {
      const data = await publicGetRanking();
      setRankings(data);
    } catch (error: any) {
      console.error("Failed to load rankings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const topThreeDisplay = topThree;
  const overlayPhase: ShowcasePhase = animationPhase === "idle" ? "carousel" : animationPhase;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des classements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="h-12 w-12 text-warning" />
            <h1 className="text-4xl font-bold">Annonce des Gagnants</h1>
            <Trophy className="h-12 w-12 text-warning" />
          </div>
        </div>

        {/* Revealed Winners - Show only the selected place */}
        {revealedPlace !== null && (
          <div className="space-y-6">
            {revealedPlace === 3 && topThreeDisplay.third.length > 0 && (
              <Card className="border-4 border-[#FF6B35] bg-gradient-to-r from-orange-50 to-orange-100 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Trophy className="h-10 w-10 text-[#FF6B35]" />
                    <h2 className="text-3xl font-bold text-[#FF6B35]">3ème Place</h2>
                    <Trophy className="h-10 w-10 text-[#FF6B35]" />
                  </div>
                  <div className="space-y-2">
                    {topThreeDisplay.third.map((team) => (
                      <div key={team.num_equipe} className="text-2xl font-semibold">
                        {team.nom_equipe}
                        <div className="text-lg text-muted-foreground mt-1">
                          Score: {parseFloat(team.average_score).toFixed(2)}/5
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {revealedPlace === 2 && topThreeDisplay.second.length > 0 && (
              <Card className="border-4 border-[#4ECDC4] bg-gradient-to-r from-teal-50 to-teal-100 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Trophy className="h-10 w-10 text-[#4ECDC4]" />
                    <h2 className="text-3xl font-bold text-[#4ECDC4]">2ème Place</h2>
                    <Trophy className="h-10 w-10 text-[#4ECDC4]" />
                  </div>
                  <div className="space-y-2">
                    {topThreeDisplay.second.map((team) => (
                      <div key={team.num_equipe} className="text-2xl font-semibold">
                        {team.nom_equipe}
                        <div className="text-lg text-muted-foreground mt-1">
                          Score: {parseFloat(team.average_score).toFixed(2)}/5
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {revealedPlace === 1 && topThreeDisplay.first.length > 0 && (
              <Card className="border-4 border-[#1E88E5] bg-gradient-to-r from-blue-50 to-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="h-12 w-12 text-[#1E88E5] animate-pulse" />
                    <h2 className="text-4xl font-bold text-[#1E88E5]">1ère Place</h2>
                    <Sparkles className="h-12 w-12 text-[#1E88E5] animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {topThreeDisplay.first.map((team) => (
                      <div key={team.num_equipe} className="text-3xl font-bold">
                        {team.nom_equipe}
                        <div className="text-xl text-muted-foreground mt-2">
                          Score: {parseFloat(team.average_score).toFixed(2)}/5
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {overlayState && animationPhase !== "idle" && (
          <WinnersShowcaseOverlay
            visible={isAnimating}
            participants={overlayState.participants}
            winners={overlayState.winners}
            rotation={rotation}
            phase={overlayPhase}
            theme={overlayState.theme}
            showHighlights={animationPhase !== "carousel"}
          />
        )}

        {/* Static Team Cards - Only show when nothing is revealed and not animating */}
        {!isAnimating && revealedPlace === null && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {rankings.map((team) => (
              <Card key={team.num_equipe} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 text-center">
                  <div className="text-xs font-medium truncate">{team.nom_equipe}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicWinners;

function getCarouselSpeed(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  const decay = Math.pow(1 - clamped, 2.2);
  return CAROUSEL_FINAL_SPEED + (CAROUSEL_INITIAL_SPEED - CAROUSEL_FINAL_SPEED) * decay;
}

