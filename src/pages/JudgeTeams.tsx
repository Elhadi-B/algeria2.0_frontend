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
  }, []);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const data = await judgeListTeams();
      
      // Check which teams have evaluations and load their scores
      const teamsWithEvaluation = await Promise.all(
        data.map(async (team) => {
          try {
            const evaluation = await judgeGetEvaluation(team.id);
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

  // Check if search query is numeric (team ID search)
  const isNumericSearch = /^\d+$/.test(searchQuery.trim());

  const filteredTeams = teams.filter((team) => {
    // Apply search filter
    let matchesSearch = true;
    if (searchQuery) {
      if (isNumericSearch) {
        matchesSearch = team.id.toString() === searchQuery.trim();
      } else {
        matchesSearch =
          team.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.short_description.toLowerCase().includes(searchQuery.toLowerCase());
      }
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
    navigate("/judge/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo/logo-algeria20.svg" alt="Algeria 2.0" className="h-16 w-16" />
              <h1 className="text-xl font-bold">Évaluation Hackathon</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
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
                placeholder="Rechercher des équipes ou entrer l'ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex gap-2">
              {/* View Mode Filter */}
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  size="sm"
                  className={viewMode === "all" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}
                  onClick={() => setViewMode("all")}
                >
                  Toutes
                </Button>
                <Button
                  size="sm"
                  className={viewMode === "pending" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}
                  onClick={() => setViewMode("pending")}
                >
                  En Attente
                </Button>
                <Button
                  size="sm"
                  className={viewMode === "evaluated" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}
                  onClick={() => setViewMode("evaluated")}
                >
                  Évaluées
                </Button>
              </div>

              {/* Display Mode Toggle */}
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  size="sm"
                  className={displayMode === "grid" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}
                  onClick={() => setDisplayMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className={displayMode === "table" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}
                  onClick={() => setDisplayMode("table")}
                >
                  <List className="h-4 w-4" />
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
                        key={team.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/judge/teams/${team.id}`)}
                      >
                        <TableCell className="font-medium">#{team.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{team.project_name}</div>
                            {team.project_domain && (
                              <div className="text-sm text-muted-foreground mt-1">{team.project_domain}</div>
                            )}
                          </div>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredTeams.map((team) => (
                <Card 
                  key={team.id} 
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/judge/teams/${team.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl break-words">{team.project_name}</CardTitle>
                        <div className="text-xs text-muted-foreground mt-1">ID: #{team.id}</div>
                      </div>
                      {team.hasEvaluation && (
                        <Badge className="bg-success text-success-foreground text-base shrink-0">
                          {team.evaluationScore?.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    {team.project_domain && (
                      <div className="text-sm text-muted-foreground mt-2">{team.project_domain}</div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {team.short_description}
                    </p>
                    <Button className="w-full mt-2" variant={team.hasEvaluation ? "outline" : "default"}>
                      {team.hasEvaluation ? "Modifier Évaluation" : "Évaluer Maintenant"}
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
