import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Upload, Grid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminListTeams, adminDeleteTeam } from "@/lib/api";
import type { Team } from "@/lib/types";

const AdminTeams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<"grid" | "table">(() => {
    return (localStorage.getItem("adminTeamsDisplayMode") as "grid" | "table") || "grid";
  });

  // Persist displayMode changes
  useEffect(() => {
    localStorage.setItem("adminTeamsDisplayMode", displayMode);
  }, [displayMode]);

  const isPaginatedResponse = (value: unknown): value is { results: Team[] } => {
    return (
      typeof value === "object" &&
      value !== null &&
      "results" in value &&
      Array.isArray((value as { results?: unknown }).results)
    );
  };

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: unknown = await adminListTeams();
      // The API handler should already extract results from paginated responses
      // But add safety check just in case
      if (Array.isArray(data)) {
        setTeams(data);
      } else if (isPaginatedResponse(data)) {
        // Fallback: handle paginated response if API handler didn't
        setTeams(data.results);
      } else {
        console.warn("API returned non-array data:", data);
        setTeams([]);
      }
    } catch (error: any) {
      console.error("Failed to load teams:", error);
      const errorMessage = 
        error?.error || 
        error?.detail || 
        error?.message ||
        "Failed to load teams. Please check your connection and try again.";
      
      setError(errorMessage);
      toast({
        title: "Failed to load teams",
        description: errorMessage,
        variant: "destructive",
      });
      // Set empty array on error so UI doesn't break
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleDelete = async (numEquipe: string, nomEquipe: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${nomEquipe}" (${numEquipe}) ?`)) {
      return;
    }

    try {
      await adminDeleteTeam(numEquipe);
      toast({
        title: "Équipe supprimée",
        description: `"${nomEquipe}" a été retirée`,
      });
      await loadTeams();
    } catch (error: any) {
      toast({
        title: "Échec de la suppression de l'équipe",
        description: error?.error || error?.detail || "Veuillez réessayer",
        variant: "destructive",
      });
    }
  };

  // Ensure teams is always an array to prevent filter errors
  const teamsArray = Array.isArray(teams) ? teams : [];
  
  const filteredTeams = teamsArray.filter((team) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      team?.num_equipe?.toLowerCase().includes(query) ||
      team?.nom_equipe?.toLowerCase().includes(query)
    );
  });

  // Show error state if there's an error and no teams
  if (error && teamsArray.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="text-muted-foreground mt-1">
              Manage participating teams
            </p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => loadTeams()}>
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Équipes</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gérer les équipes participantes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/teams/import")}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer CSV
          </Button>
          <Button onClick={() => navigate("/admin/teams/new")} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Équipe
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro ou nom d'équipe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Display Mode Toggle */}
        <div className="flex gap-1 border rounded-lg p-1 self-start sm:self-auto">
          <Button
            size="sm"
            className={displayMode === "table" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}
            onClick={() => setDisplayMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className={displayMode === "grid" ? "" : "bg-transparent text-muted-foreground hover:text-foreground"}
            onClick={() => setDisplayMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Chargement des équipes...</p>
        </Card>
      ) : displayMode === "table" ? (
        <Card>
          <div className="overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Numéro</TableHead>
                  <TableHead>Nom de l'Équipe</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.num_equipe} className="hover:bg-muted/50">
                    <TableCell className="font-medium">#{team.num_equipe}</TableCell>
                    <TableCell className="font-medium">{team.nom_equipe}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/teams/${team.num_equipe}/edit`)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDelete(team.num_equipe, team.nom_equipe)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{filteredTeams.map((team) => (
            <Card key={team.num_equipe} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg break-words hyphens-auto">{team.nom_equipe}</CardTitle>
                  <div className="text-xs text-muted-foreground">Numéro: #{team.num_equipe}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-0"
                    onClick={() => navigate(`/admin/teams/${team.num_equipe}/edit`)}
                  >
                    <Edit className="h-3 w-3 mr-1 shrink-0" />
                    <span className="truncate">Modifier</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
                    onClick={() => handleDelete(team.num_equipe, team.nom_equipe)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredTeams.length === 0 && teamsArray.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aucune équipe trouvée</p>
          <Button className="mt-4" onClick={() => navigate("/admin/teams/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Votre Première Équipe
          </Button>
        </Card>
      )}

      {!isLoading && filteredTeams.length === 0 && teamsArray.length > 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aucune équipe ne correspond à votre recherche</p>
        </Card>
      )}
    </div>
  );
};

export default AdminTeams;
