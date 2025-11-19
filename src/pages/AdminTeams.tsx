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
    return (localStorage.getItem("adminTeamsDisplayMode") as "grid" | "table") || "table";
  });

  // Persist displayMode changes
  useEffect(() => {
    localStorage.setItem("adminTeamsDisplayMode", displayMode);
  }, [displayMode]);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminListTeams();
      // The API handler should already extract results from paginated responses
      // But add safety check just in case
      if (Array.isArray(data)) {
        setTeams(data);
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
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

  const handleDelete = async (id: number, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return;
    }

    try {
      await adminDeleteTeam(id);
      toast({
        title: "Team deleted",
        description: `"${projectName}" has been removed`,
      });
      await loadTeams();
    } catch (error: any) {
      toast({
        title: "Failed to delete team",
        description: error?.error || error?.detail || "Please try again",
        variant: "destructive",
      });
    }
  };

  // Ensure teams is always an array to prevent filter errors
  const teamsArray = Array.isArray(teams) ? teams : [];
  
  // Check if search query is numeric (team ID search)
  const isNumericSearch = /^\d+$/.test(searchQuery.trim());
  
  const filteredTeams = teamsArray.filter((team) => {
    if (isNumericSearch) {
      // Search by team ID if query is numeric
      return team?.id?.toString() === searchQuery.trim();
    }
    // Otherwise search by project name and description
    return (
      team?.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team?.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
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
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage participating teams
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/teams/import")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => navigate("/admin/teams/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams or enter team ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                  <TableHead>Project</TableHead>
                  <TableHead>Team Leader</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">#{team.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{team.project_name}</div>
                        {team.project_domain && (
                          <div className="text-sm text-muted-foreground mt-1">{team.project_domain}</div>
                        )}
                        {team.short_description && (
                          <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {team.short_description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {team.team_leader_name && (
                          <div className="font-medium">{team.team_leader_name}</div>
                        )}
                        {team.team_leader_email && (
                          <div className="text-muted-foreground">{team.team_leader_email}</div>
                        )}
                        {team.team_leader_phone && (
                          <div className="text-muted-foreground">{team.team_leader_phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {team.members || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/teams/${team.id}/edit`)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDelete(team.id, team.project_name)}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filteredTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{team.project_name}</CardTitle>
                {team.project_domain && (
                  <div className="text-sm text-muted-foreground mt-1">{team.project_domain}</div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  {team.team_leader_email && (
                    <div className="text-xs text-muted-foreground mb-1">Email: {team.team_leader_email}</div>
                  )}
                  {team.team_leader_phone && (
                    <div className="text-xs text-muted-foreground mb-1">Phone: {team.team_leader_phone}</div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Members</p>
                  <p className="text-sm">{team.members || "—"}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {team.short_description}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/teams/${team.id}/edit`)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(team.id, team.project_name)}
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
          <p className="text-muted-foreground">No teams found</p>
          <Button className="mt-4" onClick={() => navigate("/admin/teams/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Team
          </Button>
        </Card>
      )}

      {!isLoading && filteredTeams.length === 0 && teamsArray.length > 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No teams match your search</p>
        </Card>
      )}
    </div>
  );
};

export default AdminTeams;
