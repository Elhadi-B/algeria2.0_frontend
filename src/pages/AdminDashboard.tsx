import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { adminListTeams, adminListJudges, adminGetRanking } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalTeams: number;
  totalJudges: number;
  totalEvaluations: number;
  averageScore: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalJudges: 0,
    totalEvaluations: 0,
    averageScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch teams, judges, and ranking data
        const [teams, judges, ranking] = await Promise.all([
          adminListTeams(),
          adminListJudges(),
          adminGetRanking(),
        ]);

        // Calculate total evaluations and average score from ranking data
        let totalEvaluations = 0;
        let totalScore = 0;
        let teamsWithScores = 0;

        ranking.forEach((item) => {
          totalEvaluations += item.total_evaluations;
          if (item.total_evaluations > 0) {
            totalScore += parseFloat(item.average_score);
            teamsWithScores++;
          }
        });

        const averageScore = teamsWithScores > 0 ? totalScore / teamsWithScores : 0;

        setStats({
          totalTeams: teams.length,
          totalJudges: judges.length,
          totalEvaluations,
          averageScore,
        });
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: "Failed to load dashboard",
          description: error?.error || error?.message || "Could not fetch dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const statCards = [
    {
      title: "Total Teams",
      value: stats.totalTeams,
      icon: Users,
      description: "Registered teams",
      color: "text-primary",
    },
    {
      title: "Total Judges",
      value: stats.totalJudges,
      icon: FileText,
      description: "Active judges",
      color: "text-success",
    },
    {
      title: "Evaluations",
      value: stats.totalEvaluations,
      icon: CheckCircle,
      description: "Submitted evaluations",
      color: "text-warning",
    },
    {
      title: "Average Score",
      value: stats.averageScore.toFixed(1),
      icon: TrendingUp,
      description: "Overall average",
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your pitch judging event
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <a
                  href="/admin/actions"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">View Recent Evaluations</h3>
                  <p className="text-sm text-muted-foreground">See latest judge submissions and feedback</p>
                </a>
                <a
                  href="/admin/teams/import"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">Import Teams</h3>
                  <p className="text-sm text-muted-foreground">Upload CSV to add multiple teams</p>
                </a>
                <a
                  href="/admin/judges"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">Manage Judges</h3>
                  <p className="text-sm text-muted-foreground">Create and manage judge accounts</p>
                </a>
                <a
                  href="/admin/ranking"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">View Rankings</h3>
                  <p className="text-sm text-muted-foreground">See live team rankings and scores</p>
                </a>
              </CardContent>
            </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
