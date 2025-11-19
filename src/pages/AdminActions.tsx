import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { adminListEvaluations } from "@/lib/api";
import { Evaluation } from "@/lib/types";
import { MessageSquare } from "lucide-react";

export default function AdminActions() {
  const [recentEvaluations, setRecentEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRecentEvaluations();
  }, []);

  const loadRecentEvaluations = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminListEvaluations();
      // Sort by most recent first and take top 10
      const sortedEvaluations = data
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10);
      setRecentEvaluations(sortedEvaluations);
    } catch (err: any) {
      setError(err.message || "Failed to load recent evaluations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Actions</h1>
          <p className="text-muted-foreground mt-1">
            Recent activity and system actions
          </p>
        </div>
        <Button onClick={loadRecentEvaluations}>
          Refresh
        </Button>
      </div>
      {/* Recent Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Latest judge evaluations and feedback
          </p>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading evaluations...
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && recentEvaluations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No evaluations submitted yet</p>
            </div>
          )}

          {!loading && !error && recentEvaluations.length > 0 && (
            <div className="space-y-4">{recentEvaluations.map((evaluation) => (
                <Card key={evaluation.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header: Judge, Team, Total Score */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-lg">
                              {evaluation.team.project_name}
                            </span>
                            <Badge className="text-base">
                              {parseFloat(evaluation.total).toFixed(2)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Evaluated by <span className="font-medium">{evaluation.judge_name}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(evaluation.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Criteria Scores */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(evaluation.scores).map(([key, score]) => (
                          <div
                            key={key}
                            className="p-3 rounded-lg border bg-muted/30"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium capitalize truncate">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <Badge className="shrink-0">
                                {Number(score.score).toFixed(1)}/5
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* General Comments */}
                      {evaluation.general_comment && (
                        <div className="pt-3 border-t">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium mb-1">General Feedback</p>
                              <p className="text-sm text-muted-foreground break-words">
                                {evaluation.general_comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
