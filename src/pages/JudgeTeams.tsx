import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Award, Grid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { judgeListTeams, judgeGetEvaluation } from "@/lib/api";
import type { TeamBasic } from "@/lib/types";

interface TeamWithEvaluation extends TeamBasic {
  hasEvaluation?: boolean;
  evaluationScore?: number;
}

const JudgeTeams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState<TeamWithEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [judgeName, setJudgeName] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "pending" | "evaluated">(() => {
    return (localStorage.getItem("judgeTeamsViewMode") as "all" | "pending" | "evaluated") || "all";
  });
  const [displayMode, setDisplayMode] = useState<"grid" | "table">(() => {
    return (localStorage.getItem("judgeTeamsDisplayMode") as "grid" | "table") || "grid";
  });

  // Persist viewMode changes
  useEffect(() => {
    localStorage.setItem("judgeTeamsViewMode", viewMode);
  }, [viewMode]);

  // Persist displayMode changes
  useEffect(() => {
    localStorage.setItem("judgeTeamsDisplayMode", displayMode);
  }, [displayMode]);

  // Listen for visibility changes to refresh teams
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTeams();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    loadTeams();
    // Load judge name from localStorage
    const storedJudgeInfo = localStorage.getItem("judgeInfo");
    if (storedJudgeInfo) {
      try {
        const judge = JSON.parse(storedJudgeInfo);
        setJudgeName(judge.name || "");
      } catch (e) {
        console.error("Failed to parse judge info:", e);
      }
    }
  }, []);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const data = await judgeListTeams();
      
      // Sort teams by num_equipe ascending
      const sortedData = [...data].sort((a, b) => {
        // Extract numeric part if possible for natural sorting
        const numA = parseInt(a.num_equipe) || 0;
        const numB = parseInt(b.num_equipe) || 0;
        if (numA !== numB) {
          return numA - numB;
        }
        // If not numeric, sort alphabetically
        return a.num_equipe.localeCompare(b.num_equipe);
      });
      
      // Check which teams have evaluations and load their scores
      const teamsWithEvaluation = await Promise.all(
        sortedData.map(async (team) => {
          try {
            const evaluation = await judgeGetEvaluation(team.num_equipe);
            if ("message" in evaluation) {
              return {
                ...team,
                hasEvaluation: false,
              };
            }
            return {
              ...team,
              hasEvaluation: true,
              evaluationScore: parseFloat(evaluation.total),
            };
          } catch {
            return {
              ...team,
              hasEvaluation: false,
            };
          }
        })
      );
      
      setTeams(teamsWithEvaluation);
    } catch (error: any) {
      toast({
        title: "Échec du chargement des équipes",
        description: error?.error || error?.detail || "Veuillez réessayer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeams = teams.filter((team) => {
    // Apply search filter
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      matchesSearch =
        team.num_equipe.toLowerCase().includes(query) ||
        team.nom_equipe.toLowerCase().includes(query);
    }

    // Apply view mode filter
    if (viewMode === "pending") {
      return matchesSearch && !team.hasEvaluation;
    } else if (viewMode === "evaluated") {
      return matchesSearch && team.hasEvaluation;
    }

    return matchesSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem("judgeToken");
    localStorage.removeItem("judgeInfo");
    navigate("/judge/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src="/logo/logo-algeria20.svg" alt="Algeria 2.0" className="h-12 w-12 sm:h-16 sm:w-16 shrink-0" />
              <div className="flex flex-col min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">Évaluation Hackathon</h1>
                {judgeName && (
                  <p className="text-sm sm:text-base font-medium text-primary truncate">{judgeName}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0 text-xs sm:text-sm px-2 sm:px-4">
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold">Équipes à Évaluer</h2>
            <p className="text-muted-foreground mt-1">
              Sélectionnez une équipe pour voir les détails et soumettre votre évaluation
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou nom d'équipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              {/* View Mode Filter */}
              <div className="flex gap-1 border rounded-lg p-1 w-full sm:w-auto">
                <Button
                  size="sm"
                  className={`flex-1 sm:flex-initial ${viewMode === "all" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setViewMode("all")}
                >
                  <span className="text-xs sm:text-sm">Toutes</span>
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 sm:flex-initial ${viewMode === "pending" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setViewMode("pending")}
                >
                  <span className="text-xs sm:text-sm">En Attente</span>
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 sm:flex-initial ${viewMode === "evaluated" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setViewMode("evaluated")}
                >
                  <span className="text-xs sm:text-sm">Évaluées</span>
                </Button>
              </div>

              {/* Display Mode Toggle */}
              <div className="flex gap-1 border rounded-lg p-1 w-full sm:w-auto">
                <Button
                  size="sm"
                  className={`flex-1 sm:flex-initial ${displayMode === "table" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setDisplayMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 sm:flex-initial ${displayMode === "grid" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setDisplayMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Loading teams...</p>
            </Card>
          ) : displayMode === "table" ? (
            <Card>
              <div className="overflow-visible">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="w-24">Score</TableHead>
                      <TableHead className="w-32">Statut</TableHead>
                      <TableHead className="w-32 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team) => (
                      <TableRow 
                        key={team.num_equipe}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/judge/teams/${team.num_equipe}`)}
                      >
                        <TableCell className="font-medium">#{team.num_equipe}</TableCell>
                        <TableCell>
                          <div className="font-medium">{team.nom_equipe}</div>
                        </TableCell>
                        <TableCell>
                          {team.hasEvaluation ? (
                            <Badge className="bg-success text-success-foreground">
                              {team.evaluationScore?.toFixed(2)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {team.hasEvaluation ? (
                            <Badge className="bg-success text-success-foreground">
                              Évaluée
                            </Badge>
                          ) : (
                            <Badge className="bg-warning text-warning-foreground">
                              En Attente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant={team.hasEvaluation ? "outline" : "default"}>
                            {team.hasEvaluation ? "Modifier" : "Évaluer"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{filteredTeams.map((team) => (
                <Card 
                  key={team.num_equipe} 
                  className="hover:shadow-lg transition-all cursor-pointer group flex flex-col"
                  onClick={() => navigate(`/judge/teams/${team.num_equipe}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl break-words hyphens-auto">{team.nom_equipe}</CardTitle>
                        <div className="text-xs text-muted-foreground mt-1">Numéro: #{team.num_equipe}</div>
                      </div>
                      {team.hasEvaluation && (
                        <Badge className="bg-success text-success-foreground text-sm sm:text-base shrink-0">
                          {team.evaluationScore?.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col">
                    <Button className="w-full mt-auto" variant={team.hasEvaluation ? "outline" : "default"}>
                      <span className="truncate">{team.hasEvaluation ? "Modifier Évaluation" : "Évaluer Maintenant"}</span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredTeams.length === 0 && !isLoading && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No teams found matching your search</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default JudgeTeams;
