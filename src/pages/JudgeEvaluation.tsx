import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { judgeGetEvaluation, judgeSubmitScore, adminListCriteria } from "@/lib/api";
import type { TeamBasic, Evaluation, CriterionScore, Criterion } from "@/lib/types";
import StarRating from "@/components/StarRating";

const JudgeEvaluation = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [team, setTeam] = useState<TeamBasic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const [scores, setScores] = useState<Record<string, CriterionScore>>({});

  const [generalComment, setGeneralComment] = useState("");

  useEffect(() => {
    loadCriteria();
  }, []);

  useEffect(() => {
    if (teamId && criteria.length > 0) {
      loadEvaluation();
    }
  }, [teamId, criteria]);

  const loadCriteria = async () => {
    try {
      const data = await adminListCriteria();
      const sortedCriteria = data.sort((a, b) => a.order - b.order);
      setCriteria(sortedCriteria);
      
      // Initialize scores with default value of 3 for each criterion (middle value 0-5)
      const initialScores: Record<string, CriterionScore> = {};
      sortedCriteria.forEach((criterion) => {
        initialScores[criterion.key] = { score: 3 };
      });
      setScores(initialScores);
    } catch (error) {
      console.error("Failed to load criteria:", error);
      toast({
        title: "Failed to load criteria",
        description: "Please refresh the page",
        variant: "destructive",
      });
    }
  };

  const loadEvaluation = async () => {
    if (!teamId) return;
    
    setIsLoading(true);
    try {
      // First try to get evaluation (which includes team info)
      const evaluation = await judgeGetEvaluation(parseInt(teamId));
      
      if ("message" in evaluation) {
        // No evaluation found, get team info from teams list
        const { judgeListTeams } = await import("@/lib/api");
        const teams = await judgeListTeams();
        const foundTeam = teams.find((t) => t.id === parseInt(teamId));
        if (foundTeam) {
          setTeam(foundTeam);
        } else {
          throw new Error("Team not found");
        }
      } else {
        // Existing evaluation found
        setTeam(evaluation.team);
        setScores(evaluation.scores);
        setGeneralComment(evaluation.general_comment || "");
      }
    } catch (error: any) {
      toast({
        title: "Failed to load team",
        description: error?.error || error?.detail || "Please try again",
        variant: "destructive",
      });
      navigate("/judge/teams");
    } finally {
      setIsLoading(false);
    }
  };

  const updateScore = (key: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: { ...prev[key], score: Number(score) },
    }));
  };

  const calculateTotalScore = () => {
    return criteria.reduce((total, criterion) => {
      const score = Number(scores[criterion.key]?.score) || 0;
      const weighted = score * criterion.weight;
      return total + weighted;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!teamId || !team) return;
    
    setIsSubmitting(true);

    try {
      await judgeSubmitScore({
        team_id: parseInt(teamId),
        scores: scores,
        general_comment: generalComment,
      });
      
      toast({
        title: "Evaluation submitted",
        description: "Your scores have been saved successfully",
      });
      
      navigate("/judge/teams");
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || "Please try again";
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/judge/teams")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Loading team details...</p>
          </Card>
        ) : !team ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Team not found</p>
            <Button className="mt-4" onClick={() => navigate("/judge/teams")}>
              Back to Teams
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Team Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{team.project_name}</CardTitle>
                {team.project_domain && (
                  <div className="text-muted-foreground mt-2">{team.project_domain}</div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{team.short_description}</p>
              </CardContent>
            </Card>

          {/* Scoring Form */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {criteria.map((criterion) => (
                <div key={criterion.key} className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <Label className="text-base font-semibold">
                        {criterion.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Weight: {Math.round(criterion.weight * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <StarRating
                    value={Number(scores[criterion.key]?.score) || 0}
                    onChange={(value) => updateScore(criterion.key, value)}
                  />
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-semibold">Total Weighted Score</Label>
                  <div className="text-3xl font-bold text-primary">
                    {calculateTotalScore().toFixed(2)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>General Comments</Label>
                  <Textarea
                    placeholder="Overall feedback for the team..."
                    value={generalComment}
                    onChange={(e) => setGeneralComment(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Evaluation"}
              </Button>
            </CardContent>
          </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default JudgeEvaluation;
