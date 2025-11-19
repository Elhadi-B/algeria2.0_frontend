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
          title: "Échec du chargement du tableau de bord",
          description: error?.error || error?.message || "Impossible de récupérer les données du tableau de bord",
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
      title: "Total Équipes",
      value: stats.totalTeams,
      icon: Users,
      description: "Équipes inscrites",
      color: "text-primary",
    },
    {
      title: "Total Jurys",
      value: stats.totalJudges,
      icon: FileText,
      description: "Jurys actifs",
      color: "text-success",
    },
    {
      title: "Évaluations",
      value: stats.totalEvaluations,
      icon: CheckCircle,
      description: "Évaluations soumises",
      color: "text-warning",
    },
    {
      title: "Score Moyen",
      value: stats.averageScore.toFixed(1),
      icon: TrendingUp,
      description: "Moyenne générale",
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de Bord</h1>
        <p className="text-muted-foreground mt-1">
          Aperçu de votre événement hackathon
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
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <a
                  href="/admin/actions"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">Voir les Évaluations Récentes</h3>
                  <p className="text-sm text-muted-foreground">Consultez les dernières soumissions et commentaires des jurys</p>
                </a>
                <a
                  href="/admin/teams/import"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">Importer des Équipes</h3>
                  <p className="text-sm text-muted-foreground">Télécharger un CSV pour ajouter plusieurs équipes</p>
                </a>
                <a
                  href="/admin/judges"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">Gérer les Jurys</h3>
                  <p className="text-sm text-muted-foreground">Créer et gérer les comptes jurys</p>
                </a>
                <a
                  href="/admin/ranking"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">Voir les Classements</h3>
                  <p className="text-sm text-muted-foreground">Consultez les classements et scores des équipes en direct</p>
                </a>
              </CardContent>
            </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
