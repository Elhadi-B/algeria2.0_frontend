import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WinnersShowcaseOverlay, type ShowcasePhase } from "@/components/winners/ShowtimeOverlay";
import { getPlaceTheme, type PlaceTheme } from "@/lib/winnerThemes";
import { computeTopThree } from "@/lib/topThree";
import { adminGetRanking, adminAnnounceWinner } from "@/lib/api";
import type { RankingItem } from "@/lib/types";

type AnimationPhase = "idle" | ShowcasePhase;

type OverlayState = {
  place: number;
  winners: RankingItem[];
  participants: RankingItem[];
  theme: PlaceTheme;
};

const CAROUSEL_DURATION_MS = 4600;
const ALIGN_SMOOTHING_MS = 520;
const CAROUSEL_INITIAL_SPEED = 420;
const CAROUSEL_FINAL_SPEED = 40;

const AdminWinners = () => {
  const { toast } = useToast();
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedPlace, setRevealedPlace] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null);
  const [rotation, setRotation] = useState(0);
  const [revealedTeams, setRevealedTeams] = useState<RankingItem[]>([]);

  const rotationRef = useRef(0);
  const rotationTargetRef = useRef(0);
  const carouselStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    loadRankings();
    return () => {
      clearScheduledTimers();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAnimating || !overlayState || animationPhase === "idle") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let last = performance.now();

    const step = (time: number) => {
      const delta = time - last;
      last = time;

      if (animationPhase === "carousel") {
        if (!carouselStartRef.current) {
          carouselStartRef.current = time;
        }
        const elapsed = Math.max(0, time - carouselStartRef.current);
        const progress = Math.min(1, elapsed / CAROUSEL_DURATION_MS);
        const currentSpeed = getCarouselSpeed(progress);
        rotationRef.current += (currentSpeed * delta) / 1000;
        setRotation(rotationRef.current);
      } else if (animationPhase === "align") {
        const diff = rotationTargetRef.current - rotationRef.current;
        const easing = Math.min(1, delta / ALIGN_SMOOTHING_MS);
        rotationRef.current += diff * easing;
        setRotation(rotationRef.current);

        if (Math.abs(diff) <= 0.6) {
          rotationRef.current = rotationTargetRef.current;
          setRotation(rotationRef.current);
          setAnimationPhase("spotlight");
          return;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [animationPhase, isAnimating, overlayState]);

  useEffect(() => {
    if (animationPhase !== "align" || !overlayState || overlayState.winners.length === 0) {
      return;
    }

    rotationTargetRef.current = computeForwardRotationTarget(
      overlayState.participants,
      overlayState.winners[0],
      rotationRef.current
    );
  }, [animationPhase, overlayState]);

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

  const loadRankings = async () => {
    setIsLoading(true);
    try {
      const data = await adminGetRanking();
      setRankings(data);
    } catch (error: any) {
      toast({
        title: "Échec du chargement des classements",
        description: error?.error || error?.detail || "Veuillez réessayer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startShowcase = (targetPlace: number) => {
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
      setAnimationPhase("align");
    }, CAROUSEL_DURATION_MS);
  };

  const resetAnimation = async (broadcast = true) => {
    if (broadcast) {
      try {
        await adminAnnounceWinner(0, "reset");
      } catch (error: any) {
        console.error("Failed to send reset:", error);
      }
    }

    clearScheduledTimers();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    rotationRef.current = 0;
    rotationTargetRef.current = 0;
    carouselStartRef.current = 0;
    setRotation(0);
    setOverlayState(null);
    setIsAnimating(false);
    setAnimationPhase("idle");
    setRevealedPlace(null);
    setRevealedTeams([]);
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

  const clearScheduledTimers = () => {
    if (typeof window !== "undefined") {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    }
    timersRef.current = [];
  };

  const buildParticipants = (winners: RankingItem[]) => {
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
  };

  const finalizeReveal = () => {
    if (!overlayState) {
      return;
    }

    rotationRef.current = rotationTargetRef.current;
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

  const revealPlace = async (place: number) => {
    const canReveal =
      (place === 1 && hasFirstPlace) ||
      (place === 2 && hasSecondPlace) ||
      (place === 3 && hasThirdPlace);

    if (!canReveal) {
      toast({
        title: "Aucun gagnant pour cette place",
        description: "Ajoutez davantage d'évaluations ou choisissez une autre place.",
        variant: "destructive",
      });
      return;
    }

    if (!isAnimating && (revealedPlace === null || revealedPlace > place)) {
      try {
        await adminAnnounceWinner(place, 'start_animation');
        startShowcase(place);
      } catch (error: any) {
        console.error("Failed to announce winner:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer l'annonce. L'animation locale continue.",
          variant: "destructive",
        });
        startShowcase(place);
      }
    }
  };

  const topThree = useMemo(() => computeTopThree(rankings), [rankings]);
  const hasFirstPlace = topThree.first.length > 0;
  const hasSecondPlace = topThree.second.length > 0;
  const hasThirdPlace = topThree.third.length > 0;

  const pickWinnersForPlace = (targetPlace: number) => {
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
  };

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

        {/* Control Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => revealPlace(3)}
            disabled={isAnimating || (revealedPlace !== null && revealedPlace <= 3)}
            size="lg"
            className="min-w-[200px] bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
          >
            Révéler 3ème Place
          </Button>
          <Button
            onClick={() => revealPlace(2)}
            disabled={isAnimating || revealedPlace === null || revealedPlace <= 2}
            size="lg"
            variant="outline"
            className="min-w-[200px] border-[#4ECDC4] text-[#4ECDC4] hover:bg-[#4ECDC4]/10"
          >
            Révéler 2ème Place
          </Button>
          <Button
            onClick={() => revealPlace(1)}
            disabled={isAnimating || revealedPlace === null || revealedPlace <= 1}
            size="lg"
            variant="outline"
            className="min-w-[200px] border-[#1E88E5] text-[#1E88E5] hover:bg-[#1E88E5]/10"
          >
            Révéler 1ère Place
          </Button>
          <Button
            onClick={() => resetAnimation()}
            disabled={isAnimating}
            variant="destructive"
            size="lg"
            className="min-w-[200px]"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Réinitialiser
          </Button>
        </div>

        {/* Revealed Winners - Show only the selected place */}
        {revealedPlace !== null && (
          <div className="space-y-6">
            {revealedPlace === 3 && topThree.third.length > 0 && (
              <Card className="border-4 border-[#FF6B35] bg-gradient-to-r from-orange-50 to-orange-100 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Trophy className="h-10 w-10 text-[#FF6B35]" />
                    <h2 className="text-3xl font-bold text-[#FF6B35]">3ème Place</h2>
                    <Trophy className="h-10 w-10 text-[#FF6B35]" />
                  </div>
                  <div className="space-y-2">
                    {topThree.third.map((team) => (
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

            {revealedPlace === 2 && topThree.second.length > 0 && (
              <Card className="border-4 border-[#4ECDC4] bg-gradient-to-r from-teal-50 to-teal-100 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Trophy className="h-10 w-10 text-[#4ECDC4]" />
                    <h2 className="text-3xl font-bold text-[#4ECDC4]">2ème Place</h2>
                    <Trophy className="h-10 w-10 text-[#4ECDC4]" />
                  </div>
                  <div className="space-y-2">
                    {topThree.second.map((team) => (
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

            {revealedPlace === 1 && topThree.first.length > 0 && (
              <Card className="border-4 border-[#1E88E5] bg-gradient-to-r from-blue-50 to-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="h-12 w-12 text-[#1E88E5] animate-pulse" />
                    <h2 className="text-4xl font-bold text-[#1E88E5]">1ère Place</h2>
                    <Sparkles className="h-12 w-12 text-[#1E88E5] animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {topThree.first.map((team) => (
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

export default AdminWinners;

function normalizeAngle(value: number) {
  let angle = value % 360;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

function computeForwardRotationTarget(participants: RankingItem[], winner: RankingItem, currentRotation: number) {
  const targetAngle = computeTargetRotation(participants, winner);
  const currentAngle = normalizeAngle(currentRotation);
  const forwardDiff = ((targetAngle - currentAngle + 360) % 360);
  return currentRotation + forwardDiff;
}

function computeTargetRotation(participants: RankingItem[], winner: RankingItem) {
  if (participants.length === 0) {
    return 0;
  }
  const winnerIndex = participants.findIndex((team) => team.num_equipe === winner.num_equipe);
  if (winnerIndex === -1) {
    return 0;
  }
  const angleStep = 360 / participants.length;
  const baseAngle = angleStep * winnerIndex;
  return (360 - baseAngle) % 360;
}

function getCarouselSpeed(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  const decay = Math.pow(1 - clamped, 2.2);
  return CAROUSEL_FINAL_SPEED + (CAROUSEL_INITIAL_SPEED - CAROUSEL_FINAL_SPEED) * decay;
}
