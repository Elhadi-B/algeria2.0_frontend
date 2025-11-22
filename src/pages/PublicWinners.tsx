import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Sparkles } from "lucide-react";
import { publicGetRanking, createWinnersWebSocket } from "@/lib/api";
import type { RankingItem } from "@/lib/types";

const PublicWinners = () => {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedPlace, setRevealedPlace] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'rapid' | 'slowing' | 'stopping'>('idle');
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadRankings();
    
    // Set up WebSocket connection for synchronization
    wsRef.current = createWinnersWebSocket(
      (data: any) => {
        console.log("Winners WebSocket message received:", data);
        if (data.type === 'winner_announcement') {
          if (data.action === 'start_animation') {
            // Start animation when admin triggers it
            startShuffleAnimation(data.place);
          } else if (data.action === 'reveal') {
            // Direct reveal without animation
            setIsAnimating(false);
            setRevealedPlace(data.place);
          } else if (data.action === 'reset') {
            // Reset animation
            resetAnimation();
          }
        }
      },
      () => {
        console.log("Public Winners WebSocket connected");
      },
      (error) => {
        console.error("Public Winners WebSocket error:", error);
      },
      () => {
        console.log("Public Winners WebSocket disconnected");
      }
    );

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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

  const getTopThree = () => {
    if (rankings.length === 0) return { first: [], second: [], third: [] };
    
    const firstPlace = rankings.filter(t => t.rank === 1);
    const rank2Teams = rankings.filter(t => t.rank === 2);
    const rank3Teams = rankings.filter(t => t.rank === 3);
    
    let secondPlace: RankingItem[] = [];
    let thirdPlace: RankingItem[] = [];
    
    if (firstPlace.length === 1) {
      secondPlace = rank2Teams;
      thirdPlace = rank3Teams;
    } else {
      secondPlace = [];
      thirdPlace = rank2Teams;
    }
    
    return {
      first: firstPlace,
      second: secondPlace,
      third: thirdPlace,
    };
  };

  const startShuffleAnimation = (targetPlace: number) => {
    // Reset any previous state
    resetAnimation();
    
    const topThree = getTopThree();
    let winnerTeams: RankingItem[] = [];
    let winnerColor = '';
    
    if (targetPlace === 3) {
      winnerTeams = topThree.third;
      winnerColor = '#FF6B35'; // Orange
    } else if (targetPlace === 2) {
      winnerTeams = topThree.second;
      winnerColor = '#4ECDC4'; // Green/Turquoise
    } else if (targetPlace === 1) {
      winnerTeams = topThree.first;
      winnerColor = '#1E88E5'; // Blue
    }
    
    const winnerNums = new Set(winnerTeams.map(t => t.num_equipe));
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      setIsAnimating(true);
      setAnimationPhase('rapid');
      setRevealedPlace(null);
      
      // Define animation function first
      const startAnimation = () => {
        const cards = document.querySelectorAll('.team-card');

        // Store original positions before making cards absolute
        const originalPositions = new Map<Element, { left: number; top: number; width: number; height: number }>();
        cards.forEach((card) => {
          const rect = (card as HTMLElement).getBoundingClientRect();
          originalPositions.set(card, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          });
        });

        // Initialize starting positions (centered)
        cards.forEach((card) => {
          (card as HTMLElement).style.position = 'absolute';
          (card as HTMLElement).style.transition = 'none';
          (card as HTMLElement).style.transform = 'translate(0, 0) rotate(0deg)';
        });

        let startTime = Date.now();
        const rapidDuration = 3000; // 3 seconds of rapid shuffling
        const slowDuration = 2000; // 2 seconds of slowing down

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const cards = document.querySelectorAll('.team-card');
          
          if (elapsed < rapidDuration) {
            // Rapid shuffling phase - fast random movements
            setAnimationPhase('rapid');
            cards.forEach((card) => {
              const randomX = (Math.random() - 0.5) * (window.innerWidth * 0.7);
              const randomY = (Math.random() - 0.5) * (window.innerHeight * 0.7);
              const randomRotate = (Math.random() - 0.5) * 360;
              (card as HTMLElement).style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
              (card as HTMLElement).style.transition = 'none';
            });
            animationFrameRef.current = requestAnimationFrame(animate);
          } else if (elapsed < rapidDuration + slowDuration) {
            // Slowing down phase - gradually move winners to center, others fade out
            setAnimationPhase('slowing');
            const progress = (elapsed - rapidDuration) / slowDuration;
            const easeOut = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            let winnerIndex = 0;
            
            cards.forEach((card) => {
              const teamId = card.getAttribute('data-team-id');
              const isWinner = teamId && winnerNums.has(teamId);
              
              if (isWinner) {
                // Winner cards move to center and highlight
                const offsetX = (winnerIndex - (winnerTeams.length - 1) / 2) * 150;
                const targetX = centerX - 60 + offsetX - (window.innerWidth / 2);
                const targetY = centerY - 40 - (window.innerHeight / 2);
                
                const currentX = targetX * (1 - easeOut);
                const currentY = targetY * (1 - easeOut);
                const currentRotate = 360 * (1 - easeOut);
                const currentScale = 0.8 + (1.2 - 0.8) * easeOut;
                
                (card as HTMLElement).style.transition = 'transform 0.1s linear, box-shadow 0.1s linear';
                (card as HTMLElement).style.transform = `translate(${currentX}px, ${currentY}px) rotate(${currentRotate}deg) scale(${currentScale})`;
                (card as HTMLElement).style.boxShadow = `0 0 ${20 * easeOut}px ${winnerColor}`;
                (card as HTMLElement).style.borderColor = winnerColor;
                (card as HTMLElement).style.borderWidth = `${2 + 2 * easeOut}px`;
                
                winnerIndex++;
              } else {
                // Non-winner cards fade out and move away
                const randomX = (Math.random() - 0.5) * (window.innerWidth * 0.7) * (1 - easeOut);
                const randomY = (Math.random() - 0.5) * (window.innerHeight * 0.7) * (1 - easeOut);
                const randomRotate = (Math.random() - 0.5) * 360 * (1 - easeOut);
                const opacity = 1 - easeOut;
                const scale = 1 - easeOut * 0.5;
                
                (card as HTMLElement).style.transition = 'transform 0.1s linear, opacity 0.1s linear';
                (card as HTMLElement).style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg) scale(${scale})`;
                (card as HTMLElement).style.opacity = opacity.toString();
              }
            });
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            // Stop and reveal - fade out non-winners completely, keep winners highlighted
            setAnimationPhase('stopping');
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            let winnerIndex = 0;
            
            cards.forEach((card) => {
              const teamId = card.getAttribute('data-team-id');
              const isWinner = teamId && winnerNums.has(teamId);
              
              if (isWinner) {
                // Calculate final centered position for winners using original position
                const originalPos = originalPositions.get(card);
                if (originalPos) {
                  const cardWidth = originalPos.width || 120;
                  // For single winner, center it perfectly. For multiple, space them evenly
                  const offsetX = winnerTeams.length === 1 
                    ? 0 
                    : (winnerIndex - (winnerTeams.length - 1) / 2) * 150;
                  const targetCenterX = centerX - cardWidth / 2 + offsetX;
                  const targetCenterY = centerY - 40;
                  
                  // Calculate translation needed from original position to center
                  const finalX = targetCenterX - originalPos.left;
                  const finalY = targetCenterY - originalPos.top;
                  
                  // Keep winners visible and highlighted at center
                  (card as HTMLElement).style.transition = 'transform 0.5s ease-out, box-shadow 0.5s ease-out';
                  (card as HTMLElement).style.transform = `translate(${finalX}px, ${finalY}px) rotate(0deg) scale(1.1)`;
                  (card as HTMLElement).style.boxShadow = `0 0 30px ${winnerColor}`;
                }
                winnerIndex++;
              } else {
                // Fade out non-winners
                (card as HTMLElement).style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                (card as HTMLElement).style.opacity = '0';
                (card as HTMLElement).style.transform = 'translate(0, 0) rotate(0deg) scale(0.5)';
              }
            });
            
            setTimeout(() => {
              setIsAnimating(false);
              setAnimationPhase('idle');
              setRevealedPlace(targetPlace);
              
              // Reset card styles
              cards.forEach((card) => {
                (card as HTMLElement).style.position = '';
                (card as HTMLElement).style.opacity = '';
                (card as HTMLElement).style.transform = '';
                (card as HTMLElement).style.transition = '';
                (card as HTMLElement).style.boxShadow = '';
                (card as HTMLElement).style.borderColor = '';
                (card as HTMLElement).style.borderWidth = '';
              });
            }, 600);
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      // Wait for React to render the cards - retry mechanism for production
      const waitForCards = (retries = 20) => {
        const cards = document.querySelectorAll('.team-card');
        console.log(`Checking for cards, attempt ${21 - retries}, found: ${cards.length}`);
        
        if (cards.length === 0 && retries > 0) {
          setTimeout(() => waitForCards(retries - 1), 100);
          return;
        }
        if (cards.length === 0) {
          console.error("No cards found after all retries, skipping animation. Rankings count:", rankings.length);
          setIsAnimating(false);
          setRevealedPlace(targetPlace);
          return;
        }
        
        console.log(`Cards found: ${cards.length}, starting animation`);
        // Cards found, start animation
        startAnimation();
      };
      
      // Start waiting for cards - give React more time in production
      setTimeout(() => waitForCards(), 300);
    }, 50);
  };

  const resetAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsAnimating(false);
    setAnimationPhase('idle');
    setRevealedPlace(null);
    
    const cards = document.querySelectorAll('.team-card');
    cards.forEach((card) => {
      (card as HTMLElement).style.position = '';
      (card as HTMLElement).style.transform = '';
      (card as HTMLElement).style.transition = '';
      (card as HTMLElement).style.opacity = '';
    });
  };

  const topThree = getTopThree();

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

        {/* Animated Team Cards - Only show when animating */}
        {isAnimating && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/20 backdrop-blur-sm">
            <div className="relative w-full h-full">
              {rankings.map((team, index) => {
                // Calculate initial grid position
                const cols = Math.ceil(Math.sqrt(rankings.length));
                const row = Math.floor(index / cols);
                const col = index % cols;
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                const cardWidth = 120;
                const cardHeight = 80;
                const startX = centerX - (cols * cardWidth) / 2 + col * cardWidth;
                const startY = centerY - (Math.ceil(rankings.length / cols) * cardHeight) / 2 + row * cardHeight;
                
                // Assign colors from logo palette (blue, orange, green)
                const logoColors = ['#1E88E5', '#FF6B35', '#4ECDC4'];
                const cardColor = logoColors[index % logoColors.length];
                
                return (
                  <Card
                    key={team.num_equipe}
                    data-team-id={team.num_equipe}
                    className="team-card shadow-xl absolute border-2"
                    style={{
                      left: `${startX}px`,
                      top: `${startY}px`,
                      width: `${cardWidth}px`,
                      backgroundColor: cardColor,
                      borderColor: cardColor,
                    }}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="text-sm font-medium truncate text-white drop-shadow-md">{team.nom_equipe}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
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

