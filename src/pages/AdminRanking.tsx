import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminGetRanking, adminExportCSV, createRankingWebSocket, adminListCriteria } from "@/lib/api";
import type { RankingItem, WebSocketMessage, Criterion } from "@/lib/types";

const AdminRanking = () => {
  const { toast } = useToast();
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadRankings();
    loadCriteria();

    // Set up WebSocket connection
    console.log("Setting up WebSocket connection...");
    wsRef.current = createRankingWebSocket(
      (data: WebSocketMessage) => {
        console.log("WebSocket message received:", data);
        if (data.type === "initial_ranking" && data.ranking) {
          console.log("Initial ranking received:", data.ranking);
          setRankings(data.ranking);
          setIsLoading(false);
        } else if (data.type === "ranking_update" && data.ranking) {
          console.log("Ranking update received:", data.ranking);
          setRankings(data.ranking);
          toast({
            title: "Classements mis à jour",
            description: "De nouveaux scores ont été reçus",
          });
        }
      },
      () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
      },
      (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        toast({
          title: "Erreur de connexion WebSocket",
          description: "Les mises à jour en temps réel ne sont pas disponibles. Veuillez actualiser manuellement.",
          variant: "destructive",
        });
      },
      () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      }
    );

    return () => {
      if (wsRef.current) {
        console.log("Closing WebSocket connection");
        wsRef.current.close();
      }
    };
  }, [toast]);

  const loadCriteria = async () => {
    try {
      const data = await adminListCriteria();
      setCriteria(data.sort((a, b) => a.order - b.order));
    } catch (error: any) {
      console.error("Failed to load criteria:", error);
    }
  };

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

  const exportCSV = async () => {
    try {
      await adminExportCSV();
      toast({
        title: "Exportation démarrée",
        description: "Le téléchargement du fichier CSV devrait commencer sous peu",
      });
    } catch (error: any) {
      toast({
        title: "Échec de l'exportation",
        description: error?.error || error?.detail || "Veuillez réessayer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Classements</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Classements et scores des équipes en temps réel
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <Badge variant={isConnected ? "default" : "secondary"} className="shrink-0">
            {isConnected ? "● En Direct" : "○ Déconnecté"}
          </Badge>
          <Button variant="outline" onClick={exportCSV} className="w-full sm:w-auto shrink-0">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classements Généraux</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rang</TableHead>
                  <TableHead>Nom de l'Équipe</TableHead>
                  <TableHead className="text-right">Score Moy</TableHead>
                  <TableHead className="text-right">Évaluations</TableHead>
                {criteria.map((criterion) => (
                  <TableHead key={criterion.id} className="text-right">
                    {criterion.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4 + criteria.length} className="text-center py-8 text-muted-foreground">
                    Chargement des classements...
                  </TableCell>
                </TableRow>
              ) : rankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4 + criteria.length} className="text-center py-8 text-muted-foreground">
                    Aucun classement disponible pour le moment
                  </TableCell>
                </TableRow>
              ) : (
                rankings.map((team, index) => {
                  const rank = index + 1;

                  return (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {rank === 1 && <TrendingUp className="h-4 w-4 text-warning" />}
                          #{rank}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{team.project_name}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {parseFloat(team.average_score).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{team.total_evaluations}</TableCell>
                      {criteria.map((criterion) => {
                        const score = team.criterion_breakdown[criterion.name]?.average || 0;
                        return (
                          <TableCell key={criterion.id} className="text-right">
                            {score.toFixed(1)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRanking;
