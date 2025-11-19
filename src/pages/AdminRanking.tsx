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
            title: "Rankings updated",
            description: "New scores have been received",
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
          title: "WebSocket connection error",
          description: "Real-time updates are not available. Please refresh manually.",
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
        title: "Failed to load rankings",
        description: error?.error || error?.detail || "Please try again",
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
        title: "Export started",
        description: "CSV file download should begin shortly",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error?.error || error?.detail || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rankings</h1>
          <p className="text-muted-foreground mt-1">
            Real-time team rankings and scores
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "● Live" : "○ Disconnected"}
          </Badge>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">Evaluations</TableHead>
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
                    Loading rankings...
                  </TableCell>
                </TableRow>
              ) : rankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4 + criteria.length} className="text-center py-8 text-muted-foreground">
                    No rankings available yet
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
